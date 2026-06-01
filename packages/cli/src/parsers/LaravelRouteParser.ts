import fs from 'fs-extra'
import { ParsedRoute, ParsedModel } from '@routesync/core'
import { execSync } from 'child_process'
import path from 'path'

export interface ParserResult {
  routes: ParsedRoute[]
  models: ParsedModel[]
}

export class LaravelRouteParser {
  async parse(filePath: string, options: { extractModels?: boolean } = {}): Promise<ParserResult> {
    const projectRoot = path.resolve(path.dirname(filePath), '..')

    const extractModels = options.extractModels ? 'true' : 'false'
    const phpScript = `<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$result = ['routes' => [], 'models' => []];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rsync_get_source(ReflectionFunctionAbstract $ref): ?string {
    $file = $ref->getFileName();
    $start = $ref->getStartLine();
    $end = $ref->getEndLine();
    if (!$file || $start === false || $end === false) return null;
    return implode('', array_slice(file($file), $start - 1, $end - $start + 1));
}

/**
 * Try to resolve responseMetadata from a Resource class.
 * Checks (in order):
 *   1. PHP 8 #[RouteSyncResponse] attribute on class
 *   2. @mixin docblock
 *   3. Constructor parameter type hint  ← NEW
 *   4. $this->resource @var docblock    ← NEW
 *   5. Strip Resource suffix → match App\Models\*
 *   6. toArray() field vs DB column intersection
 */
function rsync_infer_from_resource(string $resourceClass, bool $collection): ?array {
    if (!class_exists($resourceClass)) return null;
    $resRef = new ReflectionClass($resourceClass);

    // 1. PHP 8 attribute
    foreach ($resRef->getAttributes() as $attr) {
        $short = class_basename($attr->getName());
        if (in_array($short, ['Response', 'RouteSyncResponse'])) {
            $args = $attr->getArguments();
            $type = $args[0] ?? $args['type'] ?? $args['model'] ?? $args['response'] ?? null;
            if ($type) return ['type' => class_basename($type), 'collection' => $collection];
        }
    }

    // 2. @mixin docblock
    $doc = $resRef->getDocComment();
    if ($doc && preg_match('/@mixin\s+([\\\\\w]+)/', $doc, $m)) {
        return ['type' => class_basename($m[1]), 'collection' => $collection];
    }

    // 3. Constructor parameter type hint: __construct(User $user)
    if ($resRef->hasMethod('__construct')) {
        $ctor = $resRef->getMethod('__construct');
        foreach ($ctor->getParameters() as $param) {
            $ptype = $param->getType();
            if ($ptype && !$ptype->isBuiltin()) {
                $cn = $ptype->getName();
                if (is_subclass_of($cn, 'Illuminate\Database\Eloquent\Model')) {
                    return ['type' => class_basename($cn), 'collection' => $collection];
                }
            }
        }
    }

    // 4. $this->resource @var docblock in class body or toArray()
    $classDoc = $resRef->getDocComment() ?: '';
    foreach (['toArray', 'toResponse'] as $mname) {
        if ($resRef->hasMethod($mname)) {
            $src = rsync_get_source($resRef->getMethod($mname)) ?? '';
            $classDoc .= $src;
        }
    }
    if (preg_match('/@var\s+([\\\\\w]+)\s+\$(?:resource|model)/', $classDoc, $m)) {
        $cn = ltrim($m[1], '\\');
        $fqcn = str_contains($cn, '\\') ? $cn : 'App\\Models\\' . $cn;
        if (class_exists($fqcn)) {
            return ['type' => class_basename($fqcn), 'collection' => $collection];
        }
    }

    // 5. Strip Resource suffix → App\Models\<Name>
    $inferredName = preg_replace('/Resource$/', '', class_basename($resourceClass));
    if ($inferredName) {
        $mc = 'App\\Models\\' . $inferredName;
        if (class_exists($mc)) {
            return ['type' => $inferredName, 'collection' => $collection];
        }
    }

    // 6. toArray() field vs DB column intersection
    if ($resRef->hasMethod('toArray')) {
        $src = rsync_get_source($resRef->getMethod('toArray')) ?? '';
        preg_match_all('/[\'"]([a-zA-Z0-9_]+)[\'"]\s*=>/', $src, $km);
        $resFields = array_unique($km[1] ?? []);
        if (!empty($resFields)) {
            $bestModel = null; $bestScore = 0;
            $modelsPath = app_path('Models');
            if (is_dir($modelsPath)) {
                foreach (\Illuminate\Support\Facades\File::allFiles($modelsPath) as $mf) {
                    $mn = preg_replace('/\.php$/', '', $mf->getFilename());
                    $mc = 'App\\Models\\' . $mn;
                    if (!class_exists($mc)) continue;
                    try {
                        $mi = new $mc();
                        $cols = array_column(\Illuminate\Support\Facades\Schema::getColumns($mi->getTable()), 'name');
                        $score = count(array_intersect($resFields, $cols));
                        if ($score > $bestScore) { $bestScore = $score; $bestModel = $mn; }
                    } catch (\Exception $e) {}
                }
            }
            if ($bestModel && $bestScore > 0) {
                return ['type' => $bestModel, 'collection' => $collection];
            }
        }
    }

    return null;
}

/**
 * Try to resolve responseMetadata directly from controller method source.
 * Handles cases where no Resource class is used at all.
 */
function rsync_infer_from_source(?string $source): ?array {
    if (!$source) return null;

    // return new SomeResource($x)
    if (preg_match('/return\s+new\s+([a-zA-Z0-9_]+Resource)\s*\(/', $source, $m)) {
        $rc = 'App\\Http\\Resources\\' . $m[1];
        $result = rsync_infer_from_resource($rc, false);
        if ($result) return $result;
    }

    // SomeResource::collection(...)
    if (preg_match('/([a-zA-Z0-9_]+Resource)::collection\s*\(/', $source, $m)) {
        $rc = 'App\\Http\\Resources\\' . $m[1];
        $result = rsync_infer_from_resource($rc, true);
        if ($result) return $result;
    }

    // ->paginate() or ->simplePaginate() with Resource
    if (preg_match('/([a-zA-Z0-9_]+Resource)::collection.*paginate/s', $source, $m)) {
        $rc = 'App\\Http\\Resources\\' . $m[1];
        $result = rsync_infer_from_resource($rc, true);
        if ($result) { $result['paginated'] = true; return $result; }
    }

    // response()->json(['token' => ..., 'user' => ...]) — inline array
    // Extract top-level keys and try to match a model
    if (preg_match('/response\(\)\s*->\s*json\s*\(\s*\[([^\]]{0,800})\]/', $source, $jsonMatch)) {
        preg_match_all('/[\'"]([a-zA-Z0-9_]+)[\'"]\s*=>/', $jsonMatch[1], $km);
        $keys = array_unique($km[1] ?? []);
        if (!empty($keys)) {
            $bestModel = null; $bestScore = 0;
            foreach (\Illuminate\Support\Facades\File::allFiles(app_path('Models')) as $mf) {
                $mn = preg_replace('/\.php$/', '', $mf->getFilename());
                $mc = 'App\\Models\\' . $mn;
                if (!class_exists($mc)) continue;
                try {
                    $mi = new $mc();
                    $cols = array_column(\Illuminate\Support\Facades\Schema::getColumns($mi->getTable()), 'name');
                    $camelCols = array_map(fn($c) => lcfirst(str_replace('_', '', ucwords($c, '_'))), $cols);
                    $score = count(array_intersect($keys, array_merge($cols, $camelCols)));
                    if ($score > $bestScore) { $bestScore = $score; $bestModel = $mn; }
                } catch (\Exception $e) {}
            }
            if ($bestModel && $bestScore >= 2) {
                return ['type' => $bestModel, 'collection' => false];
            }
        }
    }

    return null;
}

// ─── Main Route Loop ──────────────────────────────────────────────────────────

$routes = app('router')->getRoutes();
foreach ($routes as $route) {
    if (!str_starts_with($route->uri(), 'api/')) continue;

    $methods = array_diff($route->methods(), ['HEAD']);
    $middlewares = $route->gatherMiddleware();

    $auth = false;
    foreach ($middlewares as $mw) {
        if (is_string($mw) && (str_contains($mw, 'auth') || str_contains($mw, 'sanctum'))) {
            $auth = true;
        }
    }

    $schema = [];
    $responseMetadata = null;
    $action = $route->getAction();

    if (isset($action['uses']) && is_string($action['uses']) && str_contains($action['uses'], '@')) {
        list($controller, $method) = explode('@', $action['uses']);
        if (class_exists($controller)) {
            try {
                $reflector = new ReflectionMethod($controller, $method);

                // ── Request schema from FormRequest ─────────────────────────
                foreach ($reflector->getParameters() as $param) {
                    $type = $param->getType();
                    if ($type && !$type->isBuiltin()) {
                        $className = $type->getName();
                        if (is_subclass_of($className, 'Illuminate\Foundation\Http\FormRequest')) {
                            $request = new $className();
                            if (method_exists($request, 'rules')) {
                                $schema = $request->rules();
                            }
                        }
                    }
                }

                // ── Stage 1: PHP 8 Attribute on controller method ────────────
                foreach ($reflector->getAttributes() as $attr) {
                    $short = class_basename($attr->getName());
                    if (in_array($short, ['Response', 'RouteSyncResponse'])) {
                        $args = $attr->getArguments();
                        $type = $args[0] ?? $args['type'] ?? $args['model'] ?? $args['response'] ?? null;
                        if ($type) {
                            $collection = (bool)($args[1] ?? $args['collection'] ?? false);
                            $responseMetadata = ['type' => class_basename($type), 'collection' => $collection];
                            break;
                        }
                    }
                }

                $methodSource = rsync_get_source($reflector);

                // ── Stage 2: Source-based inference ──────────────────────────
                if (!$responseMetadata) {
                    $responseMetadata = rsync_infer_from_source($methodSource);
                }

                // ── Stage 3: Fallback $request->validate([...]) for schema ──
                if (empty($schema) && $methodSource) {
                    if (preg_match('/\$request->validate\s*\(\s*\[(.*?)\]\s*\)/s', $methodSource, $vm)) {
                        preg_match_all('/[\'"]([a-zA-Z0-9_.*]+)[\'"]\s*=>\s*[\'"]([^\'"]*)[\'"]/', $vm[1], $rm);
                        foreach ($rm[1] as $i => $field) {
                            $schema[$field] = $rm[2][$i];
                        }
                    }
                }

            } catch (\Exception $e) {}
        }
    }

    foreach ($methods as $method) {
        $nameParts = explode('/', preg_replace('/^api\//', '', $route->uri()));
        $resource = preg_replace('/\{.*\}/', '', $nameParts[0]);
        if (empty($resource)) $resource = 'api';

        $result['routes'][] = [
            'name'       => $route->getName() ?: ($resource . '.' . strtolower($method)),
            'method'     => $method,
            'path'       => '/' . preg_replace('/^api\//', '', $route->uri()),
            'auth'       => $auth,
            'middleware' => $middlewares,
            'schema'     => empty($schema) ? null : ['rules' => $schema],
            'response'   => $responseMetadata,
        ];
    }
}

// ─── Extract Models ───────────────────────────────────────────────────────────

$extractModels = ${extractModels};
if ($extractModels) {
    $modelsPath = app_path('Models');
    if (is_dir($modelsPath)) {
        $files = \Illuminate\Support\Facades\File::allFiles($modelsPath);
        foreach ($files as $file) {
            $class = 'App\\Models\\' . str_replace('/', '\\', $file->getRelativePathname());
            $class = preg_replace('/\.php$/', '', $class);

            if (class_exists($class) && is_subclass_of($class, 'Illuminate\\Database\\Eloquent\\Model')) {
                try {
                    $reflection = new ReflectionClass($class);
                    if ($reflection->isAbstract()) continue;

                    $model     = new $class();
                    $table     = $model->getTable();
                    $columns   = \Illuminate\Support\Facades\Schema::getColumns($table);

                    $parsedColumns = [];
                    foreach ($columns as $col) {
                        $parsedColumns[] = [
                            'name'     => $col['name'],
                            'type'     => $col['type'],
                            'nullable' => $col['nullable'],
                        ];
                    }

                    $result['models'][] = [
                        'name'    => class_basename($class),
                        'table'   => $table,
                        'columns' => $parsedColumns,
                        'hidden'  => $model->getHidden(),
                        'appends' => $model->getAppends(),
                        'casts'   => $model->getCasts(),
                    ];
                } catch (\Exception $e) {}
            }
        }
    }
}

echo json_encode($result);
`

    const scriptPath = path.join(projectRoot, 'routesync-extractor-temp.php')

    try {
      await fs.writeFile(scriptPath, phpScript)

      const stdout = execSync(`php routesync-extractor-temp.php`, {
        cwd: projectRoot,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10,
      })

      await fs.remove(scriptPath)

      const parsed = JSON.parse(stdout)
      return {
        routes: parsed.routes || [],
        models: parsed.models || [],
      }
    } catch (err) {
      if (fs.existsSync(scriptPath)) {
        await fs.remove(scriptPath)
      }
      console.error('Failed to parse Laravel routes via PHP script:', err)
      return { routes: [], models: [] }
    }
  }
}
