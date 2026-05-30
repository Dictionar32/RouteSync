import fs from 'fs-extra'
import { ParsedRoute } from '@routesync/core'
import { execSync } from 'child_process'
import path from 'path'
import os from 'os'

export class LaravelRouteParser {
  async parse(filePath: string): Promise<ParsedRoute[]> {
    // filePath is typically something like "routes/api.php" or absolute path.
    // We need the Laravel project root. We assume the parent of "routes" is the root.
    const projectRoot = path.resolve(path.dirname(filePath), '..')
    
    // We embed the PHP extraction script as a string to avoid bundling issues.
    const phpScript = `<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$routes = app('router')->getRoutes();
$output = [];

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
                            // Instantiate the request and get rules
                            $request = new $className();
                            if (method_exists($request, 'rules')) {
                                $schema = $request->rules();
                            }
                        }
                    }
                }
            } catch (\\Exception $e) {
                // Ignore reflection errors
            }
        }
    }

    foreach ($methods as $method) {
        $nameParts = explode('/', preg_replace('/^api\\//', '', $route->uri()));
        $resource = preg_replace('/\\{.*\\}/', '', $nameParts[0]);
        if (empty($resource)) $resource = 'api';
        
        $name = $resource . '.' . strtolower($method);
        
        $output[] = [
            'name' => $route->getName() ?: $name,
            'method' => $method,
            'path' => '/' . preg_replace('/^api\\//', '', $route->uri()),
            'auth' => $auth,
            'middleware' => $middlewares,
            'schema' => $schema
        ];
    }
}

echo json_encode($output);
`;

    const tempPhpFile = path.join(os.tmpdir(), `routesync_extractor_${Date.now()}.php`)
    
    try {
      // Write the script to the laravel root so it can resolve vendor/autoload.php
      const scriptPath = path.join(projectRoot, 'routesync-extractor-temp.php')
      await fs.writeFile(scriptPath, phpScript)
      
      const stdout = execSync(`php routesync-extractor-temp.php`, {
        cwd: projectRoot,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10
      })
      
      await fs.remove(scriptPath)
      
      const parsed = JSON.parse(stdout)
      return parsed as ParsedRoute[]
    } catch (err) {
      console.error("Failed to parse Laravel routes via PHP script:", err)
      return []
    }
  }
}

