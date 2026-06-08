import { Command } from 'commander'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

interface AnnotationResult {
  method: string
  uri: string
  controllerFile: string
  controllerClass: string
  controllerNamespace: string
  methodName: string
  methodLine: number
  modelClass: string
  modelFull: string
  modelExists: boolean
  collection: boolean
  attrExists: boolean
  alreadyAnnotated: boolean
}

export const annotateCommand = new Command('annotate')
  .description('Auto-inject #[Response] PHP 8 attributes into controller methods based on Resource discovery')
  .option('--input <file>', 'Path to routes/api.php', 'routes/api.php')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--force', 'Re-annotate methods that already have #[Response]')
  .action(async (options: { input: string; dryRun?: boolean; force?: boolean }) => {
    const filePath = path.resolve(options.input)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Routes file not found: ${filePath}`)
      process.exit(1)
    }

    const projectRoot = path.resolve(path.dirname(filePath), '..')
    const forceFlag = options.force ? 'true' : 'false'

    const phpScript = `<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$result = [];
$seen = []; // deduplicate by controllerClass + methodName

$routes = app('router')->getRoutes();
foreach ($routes as $route) {
    if (!str_starts_with($route->uri(), 'api/')) continue;

    $methods = array_diff($route->methods(), ['HEAD']);
    $action = $route->getAction();
    if (!isset($action['controller'])) continue;

    [$controllerClass, $methodName] = array_pad(explode('@', $action['controller']), 2, null);
    if (!$methodName) continue;

    $dedupKey = $controllerClass . '@' . $methodName;
    if (isset($seen[$dedupKey])) continue;
    $seen[$dedupKey] = true;

    try {
        $reflector = new ReflectionMethod($controllerClass, $methodName);

        // Check if already has #[Response] attribute
        $hasResponse = false;
        foreach ($reflector->getAttributes() as $attr) {
            if (str_contains($attr->getName(), 'Response')) {
                $hasResponse = true;
                break;
            }
        }
        if ($hasResponse && !${forceFlag}) continue;

        // Get method source
        $fileName = $reflector->getFileName();
        $startLine = $reflector->getStartLine();
        $endLine = $reflector->getEndLine();
        if (!$fileName || $startLine === false) continue;

        $fileLines = file($fileName);
        $methodSource = implode('', array_slice($fileLines, $startLine - 1, $endLine - $startLine + 1));

        // Find the actual "public function" line (for correct injection point)
        // Walk backwards from startLine to find the real function declaration line
        $funcLine = $startLine;
        for ($i = $startLine - 1; $i >= max(0, $startLine - 10); $i--) {
            if (preg_match('/^\\s*(public|protected|private)?\\s*function\\s+' . preg_quote($methodName) . '\\s*\\(/', $fileLines[$i])) {
                $funcLine = $i + 1; // convert to 1-indexed
                break;
            }
        }

        // Resource Discovery — support multiple return patterns
        $resourceName = null;
        $collection = false;

        $patterns = [
            // XxxResource::collection(...)
            '/([a-zA-Z0-9_]+Resource)::collection/' => ['collection' => true],
            // new XxxResource(...)
            '/new\\s+([a-zA-Z0-9_]+Resource)\\s*\\(/' => ['collection' => false],
            // response()->json(new XxxResource(...))
            '/response\\(\\)->json\\(\\s*new\\s+([a-zA-Z0-9_]+Resource)/' => ['collection' => false],
            // response()->json(XxxResource::collection(...))
            '/response\\(\\)->json\\(\\s*([a-zA-Z0-9_]+Resource)::collection/' => ['collection' => true],
            // JsonResponse: return new JsonResponse(new XxxResource(...))
            '/JsonResponse\\(\\s*new\\s+([a-zA-Z0-9_]+Resource)/' => ['collection' => false],
        ];

        foreach ($patterns as $pattern => $meta) {
            if (preg_match($pattern, $methodSource, $m)) {
                $resourceName = $m[1];
                $collection = $meta['collection'];
                break;
            }
        }

        // Fallback: check routesync manifest for resolved response types
        $modelFromManifest = null;
        if (!$resourceName) {
            $manifestPath = getcwd() . '/routesync.manifest.json';
            if (file_exists($manifestPath)) {
                $manifest = json_decode(file_get_contents($manifestPath), true);
                if (isset($manifest['routes'])) {
                    $routeUri = '/' . preg_replace('/^api\\//', '', $route->uri());
                    foreach ($manifest['routes'] as $mr) {
                        $manifestRoutePath = preg_replace('/\\{[^}]+\\}/', '{}', $mr['path']);
                        $routePath = preg_replace('/\\{[^}]+\\}/', '{}', $routeUri);
                        if ($manifestRoutePath === $routePath && in_array(strtoupper($mr['method']), $methods)) {
                            $resolved = $mr['response']['resolved'] ?? $mr['response']['semantic'] ?? null;
                            if ($resolved && $resolved['status'] === 'resolved' && !empty($resolved['model'])) {
                                $modelFromManifest = $resolved['model'];
                                $collection = !empty($resolved['collection']) || !empty($mr['response']['collection']);
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (!$resourceName && !$modelFromManifest) continue;

        // Resolve model from Resource @mixin docblock or from manifest
        $modelClass = null;
        if ($resourceName) {
            $resourceClass = 'App\\\\Http\\\\Resources\\\\' . $resourceName;
            if (!class_exists($resourceClass)) continue;

            $resReflector = new ReflectionClass($resourceClass);
            $docComment = $resReflector->getDocComment();

            if ($docComment && preg_match('/@mixin\\s+(\\S+)/', $docComment, $mixinMatch)) {
                $modelClass = class_basename(trim($mixinMatch[1], '\\\\'));
            }
            // Fallback: strip Resource suffix
            if (!$modelClass) {
                $modelClass = preg_replace('/Resource$/', '', $resourceName);
            }
        } elseif ($modelFromManifest) {
            $modelClass = $modelFromManifest;
        }

        $ctrlReflector = new ReflectionClass($controllerClass);
        $modelFull = 'App\\\\Models\\\\' . $modelClass;

        $result[] = [
            'method' => implode('|', $methods),
            'uri' => '/' . preg_replace('/^api\\//', '', $route->uri()),
            'controllerFile' => $fileName,
            'controllerClass' => $controllerClass,
            'controllerNamespace' => $ctrlReflector->getNamespaceName(),
            'methodName' => $methodName,
            'methodLine' => $funcLine,
            'modelClass' => $modelClass,
            'modelFull' => $modelFull,
            'modelExists' => class_exists($modelFull),
            'collection' => $collection,
            'attrExists' => class_exists('App\\\\Attributes\\\\Response'),
            'alreadyAnnotated' => $hasResponse,
        ];

    } catch (\\Exception $e) {
        // skip unresolvable routes
    }
}

echo json_encode($result);
`

    const tmpFile = path.join(projectRoot, `routesync-annotate-${Date.now()}.php`)
    fs.writeFileSync(tmpFile, phpScript)

    let annotations: AnnotationResult[] | undefined
    try {
      const output = execSync(`php ${tmpFile}`, { cwd: projectRoot, encoding: 'utf-8' })
      annotations = JSON.parse(output) as AnnotationResult[]
    } catch (e: unknown) {
      console.error('❌ PHP execution failed. Make sure PHP is available and database is accessible.')
      if (e && typeof e === 'object' && 'stderr' in e) {
        console.error('PHP error output:')
        console.error((e as { stderr: string }).stderr)
      }
      if (e && typeof e === 'object' && 'stdout' in e) {
        const stdout = (e as { stdout: string }).stdout
        if (stdout) console.error('PHP stdout:', stdout)
      }
      console.error('Temp script preserved at:', tmpFile)
      process.exit(1)
    }
    fs.removeSync(tmpFile)

    if (!annotations || annotations.length === 0) {
      console.log('✔ No methods to annotate — all routes already annotated or no Resources detected.')
      return
    }

    // Group by controller file, deduplicate by methodName
    const byFile = new Map<string, AnnotationResult[]>()
    for (const ann of (annotations ?? [])) {
      const existing = byFile.get(ann.controllerFile) ?? []
      if (!existing.find(e => e.methodName === ann.methodName)) {
        existing.push(ann)
      }
      byFile.set(ann.controllerFile, existing)
    }

    // Create app/Attributes/Response.php if missing
    const attrPath = path.join(projectRoot, 'app', 'Attributes', 'Response.php')
    const attrExists = fs.existsSync(attrPath)

    if (!attrExists) {
      if (options.dryRun) {
        console.log('  [dry-run] Would create app/Attributes/Response.php')
      } else {
        fs.ensureDirSync(path.dirname(attrPath))
        fs.writeFileSync(attrPath, `<?php

namespace App\\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
class Response
{
    public function __construct(
        public string $type,
        public bool $collection = false,
    ) {}
}
`)
        console.log('  ✔ Created app/Attributes/Response.php')
      }
    }

    let totalAnnotated = 0

    for (const [ctrlFile, anns] of byFile) {
      const lines = fs.readFileSync(ctrlFile, 'utf-8').split('\n')
      const needsImport = !lines.some(l => l.includes('App\\Attributes\\Response'))

      // Sort descending by line so injections don't shift subsequent line numbers
      const sorted = [...anns].sort((a, b) => b.methodLine - a.methodLine)

      for (const ann of sorted) {
        const collectionStr = ann.collection ? ', collection: true' : ''
        const attrLine = `    #[Response(${ann.modelClass}::class${collectionStr})]`

        // methodLine is 1-indexed; inject directly above the function declaration
        const insertAt = ann.methodLine - 1
        lines.splice(insertAt, 0, attrLine)
        totalAnnotated++

        if (options.dryRun) {
          const collDisplay = ann.collection ? '[]' : ''
          console.log(`  [dry-run] ${ann.controllerClass}::${ann.methodName}`)
          console.log(`           → #[Response(${ann.modelClass}::class${collectionStr})]  (${ann.uri}${collDisplay})`)
        }
      }

      if (needsImport) {
        // Insert use statement after the last existing use line
        const lastUseIndex = lines.reduce((last, line, i) =>
          line.trimStart().startsWith('use ') ? i : last, -1)
        const insertUseAt = lastUseIndex !== -1 ? lastUseIndex + 1 : 2
        lines.splice(insertUseAt, 0, 'use App\\Attributes\\Response;')
      }

      if (!options.dryRun) {
        fs.writeFileSync(ctrlFile, lines.join('\n'), 'utf-8')
      }
    }

    if (options.dryRun) {
      console.log(`\n✔ [dry-run] Would annotate ${totalAnnotated} method(s) across ${byFile.size} controller file(s)`)
      console.log('  Run without --dry-run to apply.')
    } else {
      console.log(`✔ Annotated ${totalAnnotated} method(s) across ${byFile.size} controller file(s)`)
      console.log('\n  Next steps:')
      console.log('  1. npx routesync scan --input routes/api.php --models')
      console.log('  2. Copy routesync.manifest.json to your frontend folder')
      console.log('  3. npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod')
    }
  })