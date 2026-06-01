import fs from 'fs-extra'
import { ParsedRoute, ParsedModel } from '@routesync/core'
import { execSync } from 'child_process'
import path from 'path'
import os from 'os'

export interface ParserResult {
  routes: ParsedRoute[]
  models: ParsedModel[]
}

export class LaravelRouteParser {
  async parse(filePath: string, options: { extractModels?: boolean } = {}): Promise<ParserResult> {
    const projectRoot = path.resolve(path.dirname(filePath), '..')
    
    const phpScript = `<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$result = [
    'routes' => [],
    'models' => []
];

// Extract Routes
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
    $action = $route->getAction();
    if (isset($action['uses']) && is_string($action['uses']) && str_contains($action['uses'], '@')) {
        list($controller, $method) = explode('@', $action['uses']);
        if (class_exists($controller)) {
            try {
                $reflector = new ReflectionMethod($controller, $method);
                foreach ($reflector->getParameters() as $param) {
                    $type = $param->getType();
                    if ($type && !$type->isBuiltin()) {
                        $className = $type->getName();
                        if (is_subclass_of($className, 'Illuminate\\Foundation\\Http\\FormRequest')) {
                            $request = new $className();
                            if (method_exists($request, 'rules')) {
                                $schema = $request->rules();
                            }
                        }
                    }
                }
                
                // Parse PHP 8 Attributes for Response Metadata
                $responseMetadata = null;
                $attributes = $reflector->getAttributes();
                foreach ($attributes as $attr) {
                    $attrName = $attr->getName();
                    $shortName = class_basename($attrName);
                    
                    if (in_array($shortName, ['Response', 'RouteSyncResponse'])) {
                        $args = $attr->getArguments();
                        
                        $type = null;
                        if (isset($args[0])) {
                            $type = $args[0];
                        } elseif (isset($args['type'])) {
                            $type = $args['type'];
                        } elseif (isset($args['model'])) {
                            $type = $args['model'];
                        } elseif (isset($args['response'])) {
                            $type = $args['response'];
                        }
                        
                        $collection = false;
                        if (isset($args[1])) {
                            $collection = (bool) $args[1];
                        } elseif (isset($args['collection'])) {
                            $collection = (bool) $args['collection'];
                        }
                        
                        if ($type) {
                            $responseMetadata = [
                                'type' => class_basename($type),
                                'collection' => $collection
                            ];
                            break;
                        }
                    }
                }
                
                
                $fileName = $reflector->getFileName();
                $startLine = $reflector->getStartLine();
                $endLine = $reflector->getEndLine();
                $methodSource = null;

                if ($fileName && $startLine !== false && $endLine !== false) {
                    $lines = file($fileName);
                    $methodSource = implode("", array_slice($lines, $startLine - 1, $endLine - $startLine + 1));
                }

                // Resource Discovery
                if (!$responseMetadata && $methodSource) {
                    $resourceName = null;
                    $collection = false;
                    
                    if (preg_match('/return\\s+new\\s+([a-zA-Z0-9_]+Resource)/', $methodSource, $matches)) {
                        $resourceName = $matches[1];
                    } elseif (preg_match('/return\\s+([a-zA-Z0-9_]+Resource)::collection/', $methodSource, $matches)) {
                        $resourceName = $matches[1];
                        $collection = true;
                    }
                    
                    if ($resourceName) {
                        $resourceClass = 'App\\\\Http\\\\Resources\\\\' . $resourceName;
                        if (class_exists($resourceClass)) {
                            $resReflector = new ReflectionClass($resourceClass);
                            $resAttrs = $resReflector->getAttributes();
                            foreach ($resAttrs as $attr) {
                                $shortName = class_basename($attr->getName());
                                if (in_array($shortName, ['Response', 'RouteSyncResponse'])) {
                                    $args = $attr->getArguments();
                                    $type = $args[0] ?? $args['type'] ?? $args['model'] ?? $args['response'] ?? null;
                                    if ($type) {
                                        $responseMetadata = [
                                            'type' => class_basename($type),
                                            'collection' => $collection
                                        ];
                                    }
                                }
                            }
                            
                            if (!$responseMetadata) {
                                $docComment = $resReflector->getDocComment();
                                if ($docComment && preg_match('/@mixin\\s+([\\\\\\\\a-zA-Z0-9_]+)/', $docComment, $mixinMatches)) {
                                    $responseMetadata = [
                                        'type' => class_basename($mixinMatches[1]),
                                        'collection' => $collection
                                    ];
                                }
                            }
                        }
                    }
                }
                
                // Fallback: Try to parse $request->validate([...]) from source code
                if (empty($schema) && $methodSource) {
                    // Look for $request->validate([ ... ])
                    if (preg_match('/\\\\$request->validate\\\\s*\\\\(\\\\s*\\\\[(.*?)\\\\]\\\\s*\\\\)/s', $methodSource, $matches)) {
                        $rulesString = $matches[1];
                        // Match 'field' => 'rules'
                        preg_match_all('~[\\\'"]([a-zA-Z0-9_.*]+)[\\\'"]\\\\s*=>\\\\s*[\\\'"](.*?)[\\\'"]~', $rulesString, $ruleMatches);
                        if (!empty($ruleMatches[1])) {
                            foreach ($ruleMatches[1] as $index => $field) {
                                $schema[$field] = $ruleMatches[2][$index];
                            }
                        }
                    }
                }
            } catch (\\Exception $e) {}
        }
    }

    foreach ($methods as $method) {
        $nameParts = explode('/', preg_replace('/^api\\//', '', $route->uri()));
        $resource = preg_replace('/\\{.*\\}/', '', $nameParts[0]);
        if (empty($resource)) $resource = 'api';
        
        $name = $resource . '.' . strtolower($method);
        
        $result['routes'][] = [
            'name' => $route->getName() ?: $name,
            'method' => $method,
            'path' => '/' . preg_replace('/^api\\//', '', $route->uri()),
            'auth' => $auth,
            'middleware' => $middlewares,
            'schema' => empty($schema) ? null : ['rules' => $schema],
            'response' => $responseMetadata
        ];
    }
}

// Extract Models if requested
$extractModels = ${options.extractModels ? 'true' : 'false'};
if ($extractModels) {
    $modelsPath = app_path('Models');
    if (is_dir($modelsPath)) {
        $files = \\Illuminate\\Support\\Facades\\File::allFiles($modelsPath);
        foreach ($files as $file) {
            $class = 'App\\\\Models\\\\' . str_replace('/', '\\\\', $file->getRelativePathname());
            $class = preg_replace('/\\.php$/', '', $class);
            
            if (class_exists($class) && is_subclass_of($class, 'Illuminate\\\\Database\\\\Eloquent\\\\Model')) {
                try {
                    $reflection = new ReflectionClass($class);
                    if ($reflection->isAbstract()) continue;
                    
                    $model = new $class();
                    $table = $model->getTable();
                    $columns = \\Illuminate\\Support\\Facades\\Schema::getColumns($table);
                    
                    $parsedColumns = [];
                    foreach ($columns as $col) {
                        $parsedColumns[] = [
                            'name' => $col['name'],
                            'type' => $col['type'], // Use 'type' which contains the raw type like enum('a','b') instead of 'type_name'
                            'nullable' => $col['nullable']
                        ];
                    }
                    
                    $result['models'][] = [
                        'name' => class_basename($class),
                        'table' => $table,
                        'columns' => $parsedColumns,
                        'hidden' => $model->getHidden(),
                        'appends' => $model->getAppends(),
                        'casts' => $model->getCasts()
                    ];
                } catch (\\Exception $e) {}
            }
        }
    }
}

echo json_encode($result);
`;

    const scriptPath = path.join(projectRoot, 'routesync-extractor-temp.php')
    
    try {
      await fs.writeFile(scriptPath, phpScript)
      
      const stdout = execSync(`php routesync-extractor-temp.php`, {
        cwd: projectRoot,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10
      })
      
      await fs.remove(scriptPath)
      
      const parsed = JSON.parse(stdout)
      return {
        routes: parsed.routes || [],
        models: parsed.models || []
      }
    } catch (err) {
      if (fs.existsSync(scriptPath)) {
        await fs.remove(scriptPath)
      }
      console.error("Failed to parse Laravel routes via PHP script:", err)
      return { routes: [], models: [] }
    }
  }
}