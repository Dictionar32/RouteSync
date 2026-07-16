import fs from 'fs-extra'
import { ParsedRoute, ParsedModel } from '@routesync/core'
import { execSync } from 'child_process'
import path from 'path'
import os from 'os'

export interface ParserResult {
  routes: ParsedRoute[]
  models: ParsedModel[]
  resources?: any[]
}

export class LaravelRouteParser {
  async parse(filePath: string, options: { extractModels?: boolean } = {}): Promise<ParserResult> {
    // Resolve filePath relative to cwd first so that relative paths like
    // "../routes/api.php" or "routes/api.php" always land correctly.
    // Then go one level up from the routes directory to get the Laravel project root.
    const resolvedFile = path.resolve(process.cwd(), filePath)
    const projectRoot = path.dirname(path.dirname(resolvedFile))
    const extractModels = options.extractModels ? 'true' : 'false'

    // ---------------------------------------------------------------------------
    // PHP block: JsonResource $wrap detection.
    // Built with String.raw so JS does NOT interpret backslashes — what you write
    // is exactly what PHP receives. Injected into phpScript via ${wrapDetectionPhp}.
    // ---------------------------------------------------------------------------
    const wrapDetectionPhp = String.raw`
                // Detect JsonResource wrap behavior for attribute-based responses.
                // $responseMetadata is already set when the method has #[Response(Model::class)].
                // We inspect the actual returned resource class to know whether it wraps in
                // { data: ... } (Laravel default) or returns flat JSON ($wrap = null).
                if ($responseMetadata && !($responseMetadata['collection'] ?? false) && $methodSource) {
                    $returnedResClass = null;

                    // Match: return new OrderResource( or return new \App\Http\Resources\OrderResource(
                    // or aliased: return new OrderRes( — alias may not end in 'Resource'
                    // [^\s(]+ grabs the full class name between "new " and "(".
                    if (preg_match('#return\s+new\s+([^\s(]+)\s*\(#', $methodSource, $retMatches)
                        || preg_match('#DB::transaction.*?new\s+([^\s(]+)\s*\(#s', $methodSource, $retMatches)) {
                        $rawName = $retMatches[1];

                        if (str_contains($rawName, '\\')) {
                            // FQCN — strip optional leading backslash
                            $returnedResClass = ltrim($rawName, '\\');
                        } else {
                            // Short name — resolve via 'use' statements in the controller file.
                            // Deterministic: reads the actual source file.
                            $ctrlFile = $reflector->getFileName();
                            if ($ctrlFile && file_exists($ctrlFile)) {
                                $ctrlSource = file_get_contents($ctrlFile);
                                $esc = preg_quote($rawName, '#');
                                // use Full\Namespace\ClassName; (may be indented inside namespace block)
                                if (preg_match('#^\s*use\s+([\w\\\\]+\\\\' . $esc . ')\s*;#m', $ctrlSource, $um)) {
                                    $returnedResClass = $um[1];
                                // use Full\Namespace\ClassName as ShortAlias;
                                } elseif (preg_match('#^\s*use\s+([^\s;]+)\s+as\s+' . $esc . '\s*;#m', $ctrlSource, $um)) {
                                    $returnedResClass = $um[1];
                                }
                            }
                        }
                    }

                    if ($returnedResClass && class_exists($returnedResClass)) {
                        $resRef = new ReflectionClass($returnedResClass);
                        $wrapped = true;
                        if ($resRef->hasProperty('wrap')) {
                            $wrapProp = $resRef->getProperty('wrap');
                            // Unwrapped only if THIS class explicitly declares: public static $wrap = null
                            if ($wrapProp->getDeclaringClass()->getName() === $resRef->getName()) {
                                $wrapValue = $resRef->getStaticPropertyValue('wrap', '__UNSET__');
                                $wrapped = ($wrapValue !== null && $wrapValue !== '__UNSET__');
                            }
                        }
                        if ($wrapped) {
                            $responseMetadata['wrapped'] = true;
                        }
                    }
                }
    `

    const assignmentsScannerPhp = String.raw`
                $assignments = [];
                if ($methodSource) {
                    if (preg_match_all('/\$([a-zA-Z0-9_]+)\s*=\s*([^;]+);/s', $methodSource, $assignMatches)) {
                        foreach ($assignMatches[1] as $idx => $varName) {
                            if ($varName === 'request' || $varName === 'this') continue;
                            $expr = trim($assignMatches[2][$idx]);
                            // Skip if the expression itself IS a return statement,
                            // not if it merely contains 'return' inside a nested closure.
                            if (str_starts_with($expr, 'return')) continue;
                            // Normalize whitespace: collapse newlines and multiple spaces
                            $expr = preg_replace('/\s+/', ' ', $expr);
                            $assignments[$varName] = $expr;
                        }
                    }
                }
    `

    // NOTE: This string is written as-is to a .php file.
    // Do NOT use JS template literal interpolation inside PHP code blocks
    // except for the explicitly marked injection points below.
    // All backslashes here are literal PHP backslashes (single \).
    const phpScript = `<?php
error_reporting(0);
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$result = [
    'routes' => [],
    'models' => [],
    'resources' => []
];

if (!function_exists('parseArrayTokens')) {
    function parseArrayTokens($tokens, &$index, $symbolTable) {
        $fields = [];
        $expectingKey = true;
        $currentKey = null;

        while ($index < count($tokens)) {
            $token = $tokens[$index];
            
            if (is_string($token)) {
                if ($token === '[') {
                    if ($currentKey !== null) {
                        $index++;
                        $fields[$currentKey] = [
                            'kind' => 'object',
                            'fields' => parseArrayTokens($tokens, $index, $symbolTable)
                        ];
                        $currentKey = null;
                        $expectingKey = true;
                    } else {
                        // Start of array, just continue
                    }
                } elseif ($token === ']') {
                    return (object)$fields;
                } elseif ($token === ',') {
                    $expectingKey = true;
                }
                $index++;
                continue;
            }

            $id = $token[0];
            $text = $token[1];

            if ($id === T_WHITESPACE || $id === T_COMMENT || $id === T_DOC_COMMENT) {
                $index++;
                continue;
            }

            if ($expectingKey) {
                if ($id === T_CONSTANT_ENCAPSED_STRING) {
                    $currentKey = trim($text, "'\\\"");
                    // Skip to =>
                    while ($index < count($tokens)) {
                        $t = $tokens[$index];
                        if (is_array($t) && $t[0] === T_DOUBLE_ARROW) {
                            $index++;
                            $expectingKey = false;
                            break;
                        }
                        $index++;
                    }
                } else {
                    $index++;
                }
            } else {
                // We are expecting a value
                if (is_string($token) && $token === '[') {
                    continue;
                }
                
                $valTokens = [];
                $bracketDepth = 0;
                $parenDepth = 0;
                while ($index < count($tokens)) {
                    $t = $tokens[$index];
                    if (is_string($t)) {
                        if ($t === '[') $bracketDepth++;
                        if ($t === ']') {
                            if ($bracketDepth === 0 && $parenDepth === 0) break;
                            $bracketDepth--;
                        }
                        if ($t === '(') $parenDepth++;
                        if ($t === ')') {
                            if ($parenDepth > 0) $parenDepth--;
                        }
                        if ($t === ',' && $bracketDepth === 0 && $parenDepth === 0) break;
                    }
                    $valTokens[] = $t;
                    $index++;
                }
                
                $code = '';
                foreach ($valTokens as $vt) {
                    $code .= is_array($vt) ? $vt[1] : $vt;
                }
                $code = trim($code);
                $code = preg_replace('/\\s+/', ' ', $code);
                
                $valLower = strtolower($code);
                if ($valLower === 'true' || $valLower === 'false') {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'boolean'];
                } elseif ($valLower === 'null') {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'null'];
                } elseif (is_numeric($code)) {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'number'];
                } elseif (preg_match('/^[\\\\\\'\\\\\\"].*[\\\\\\'\\\\\\"]$/s', $code)) {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'string'];
                } else {
                    $hints = [];
                    if (str_contains($code, '?->')) {
                        $hints['pattern'] = 'nullsafe_property_access';
                    } elseif (str_contains($code, '::')) {
                        $hints['pattern'] = 'static_method_call';
                    } elseif (str_contains($code, '->')) {
                        $hints['pattern'] = str_contains($code, '()') ? 'method_call' : 'property_access';
                    } elseif (str_starts_with($code, '$')) {
                        $hints['pattern'] = 'variable';
                    }
                    $fields[$currentKey] = ['kind' => 'raw_code', 'code' => $code, 'hints' => (object)$hints];
                }
                $currentKey = null;
            }
        }
        
        return (object)$fields;
    }
}

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
    $responseMetadata = null;
    $assignments = [];
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
                        if (is_subclass_of($className, 'Illuminate\\\\Foundation\\\\Http\\\\FormRequest')) {
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
                                'kind' => 'model',
                                'model' => class_basename($type),
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

${wrapDetectionPhp}

${assignmentsScannerPhp}

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
                                            'kind' => 'model',
                                            'model' => class_basename($type),
                                            'collection' => $collection
                                        ];
                                    }
                                }
                            }

                            if (!$responseMetadata) {
                                $docComment = $resReflector->getDocComment();
                                if ($docComment && preg_match('/@mixin\\s+([\\\\a-zA-Z0-9_]+)/', $docComment, $mixinMatches)) {
                                    $responseMetadata = [
                                        'kind' => 'model',
                                        'model' => class_basename($mixinMatches[1]),
                                        'collection' => $collection
                                    ];
                                }
                            }

                            // Detect Laravel JsonResource $wrap behavior automatically.
                            // Laravel wraps single resources in { data: ... } by default.
                            // The SDK handles this transparently — developers do not need
                            // to know about $wrap = null. We inspect the class via reflection:
                            // if this specific class does NOT declare a $wrap property set to
                            // null, the response is wrapped and we mark it in the manifest so
                            // ZodTierGenerator generates z.object({ data: schema }) accordingly.
                            if ($responseMetadata && !$collection) {
                                // Laravel JsonResource wraps single resources in { data: ... } by default.
                                // We detect this transparently so developers don't need to know about $wrap.
                                // Strategy: read the static $wrap property from the resource class.
                                //   - If the class declares its own $wrap = null → not wrapped (flat JSON)
                                //   - Otherwise (inherits default 'data' from JsonResource) → wrapped
                                $wrapped = true; // Laravel default
                                try {
                                    if ($resReflector->hasProperty('wrap')) {
                                        $wrapProp = $resReflector->getProperty('wrap');
                                        // Only consider it "explicitly unwrapped" if THIS class (not a parent)
                                        // declares the property — otherwise it's just the inherited default.
                                        if ($wrapProp->getDeclaringClass()->getName() === $resReflector->getName()) {
                                            $wrapProp->setAccessible(true);
                                            // getStaticPropertyValue works for static props in PHP 8
                                            $wrapValue = $resReflector->getStaticPropertyValue('wrap', '__NOT_SET__');
                                            $wrapped = ($wrapValue !== null && $wrapValue !== '__NOT_SET__');
                                        }
                                    }
                                } catch (\Throwable $e) {
                                    // Fallback: read the source file and look for static \$wrap = null
                                    $srcFile = $resReflector->getFileName();
                                    if ($srcFile && file_exists($srcFile)) {
                                        $src = file_get_contents($srcFile);
                                        if (preg_match('/static\s+\$wrap\s*=\s*null/', $src)) {
                                            $wrapped = false;
                                        }
                                    }
                                }
                                if ($wrapped) {
                                    $responseMetadata['wrapped'] = true;
                                }
                            }

                        }
                    }
                }

                // Smart Response Inference: Eloquent variable tracking
                if (!$responseMetadata && $methodSource) {
                    $symbolTable = [];
                    
                    // Level 90: Single instance assignments
                    // Covers: find, findOrFail, create, first, firstOrFail, update, latest,
                    //         updateOrCreate, firstOrCreate, forceCreate, make, sole,
                    //         firstOrNew, newInstance, newModelInstance, updateOrInsert
                    if (preg_match_all('/\\\\$([a-zA-Z0-9_]+)\\\\s*=\\\\s*([A-Z][a-zA-Z0-9_]+)::(?:[^;]*?->)?(?:find|findOrFail|create|first|firstOrFail|update|latest|updateOrCreate|firstOrCreate|forceCreate|make|sole|firstOrNew|newInstance|newModelInstance|updateOrInsert)\\\\s*\\\\(/s', $methodSource, $matches)) {
                        foreach ($matches[1] as $idx => $var) {
                            $symbolTable[$var] = ['kind' => 'model', 'model' => $matches[2][$idx], 'collection' => false];
                        }
                    }
                    
                    // Level 80: Collection assignments
                    if (preg_match_all('/\\\\$([a-zA-Z0-9_]+)\\\\s*=\\\\s*([A-Z][a-zA-Z0-9_]+)::(?:[^;]*?->)?(?:all|get)\\\\s*\\\\(/s', $methodSource, $matches)) {
                        foreach ($matches[1] as $idx => $var) {
                            $symbolTable[$var] = ['kind' => 'model', 'model' => $matches[2][$idx], 'collection' => true];
                        }
                    }
                    if (preg_match_all('/\\\\$([a-zA-Z0-9_]+)\\\\s*=\\\\s*([A-Z][a-zA-Z0-9_]+)::(?:[^;]*?->)?(?:paginate|cursorPaginate)\\\\s*\\\\(/s', $methodSource, $matches)) {
                        foreach ($matches[1] as $idx => $var) {
                            $symbolTable[$var] = ['kind' => 'model', 'model' => $matches[2][$idx], 'collection' => true, 'paginated' => true];
                        }
                    }

                    // Level 75: Auth Awareness
                    if (preg_match_all('/\\\\$([a-zA-Z0-9_]+)\\\\s*=\\\\s*(?:auth\\\\(\\\\)->user\\\\(\\\\)|Auth::user\\\\(\\\\)|\\\\$request->user\\\\(\\\\))/i', $methodSource, $matches)) {
                        foreach ($matches[1] as $idx => $var) {
                            $symbolTable[$var] = ['kind' => 'model', 'model' => 'User', 'collection' => false];
                        }
                    }

                    // Parse returns array or json response
                    if (preg_match('/return\\\\s+(?:response\\\\(\\\\)->json\\\\(\\\\s*|\\\\s*)(\\\\[.*)/s', $methodSource, $retMatches)) {
                        $arrayContent = $retMatches[1];
                    } elseif (preg_match('/return\\\\s+(\\\\[.*)/s', $methodSource, $retMatches)) {
                        $arrayContent = $retMatches[1];
                    } else {
                        $arrayContent = null;
                    }

                    if ($arrayContent) {
                        try {
                            $tokens = token_get_all("<?php " . $arrayContent);
                            array_shift($tokens); // Remove <?php
                            $index = 0;
                            $fieldsObj = parseArrayTokens($tokens, $index, $symbolTable);
                            $fieldsArr = (array)$fieldsObj;
                            file_put_contents(__DIR__ . '/routesync-debug.log', print_r($fieldsArr, true), FILE_APPEND);
                            if (!empty($fieldsArr)) {
                                $responseMetadata = [
                                    'kind' => 'object',
                                    'fields' => $fieldsObj
                                ];
                            }
                        } catch (\\Throwable $e) {
                            file_put_contents(__DIR__ . '/routesync-error.log', "Error: " . $e->getMessage() . " on line " . $e->getLine() . "\\n", FILE_APPEND);
                        }
                    }
                }

                // Fallback: Try to parse $request->validate([...]) from source code
                if (empty($schema) && $methodSource) {
                    if (preg_match('/\\$request->validate\\s*\\(\\s*\\[(.*?)\\]\\s*\\)/s', $methodSource, $matches)) {
                        $rulesString = $matches[1];
                        preg_match_all('/[\\\'"]([a-zA-Z0-9_.*]+)[\\\'"]\\s*=>\\s*[\\\'"](.*?)[\\\'"]/', $rulesString, $ruleMatches);
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
        $slugParts = array_map(
            fn($s) => preg_replace('/\\{([^}]*)\\}/', '$1', $s),
            $nameParts
        );
        $pathSlug = implode('_', array_filter($slugParts, fn($s) => $s !== ''));
        if (empty($pathSlug)) $pathSlug = 'api';
        $name = $pathSlug . '.' . strtolower($method);

        $result['routes'][] = [
            'name' => $route->getName() ?: $name,
            'method' => $method,
            'path' => '/' . preg_replace('/^api\\//', '', $route->uri()),
            'auth' => $auth,
            'middleware' => $middlewares,
            'schema' => empty($schema) ? null : ['rules' => $schema],
            'response' => $responseMetadata,
            'assignments' => empty($assignments) ? null : $assignments,
            // Real source location of the controller action, from ReflectionMethod —
            // not derived/guessed. Null when the action isn't a controller@method
            // (closures, etc.) rather than faked.
            'sourceFile' => $fileName ?: null,
            'sourceLine' => ($startLine !== false && $startLine !== null) ? $startLine : null
        ];
    }
}

// Extract Models if requested
$extractModels = ${extractModels};
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
                            'type' => $col['type'],
                            'nullable' => $col['nullable']
                        ];
                    }

                    $relations = [];
                    $accessors = [];

                    $docComment = $reflection->getDocComment();
                    if ($docComment) {
                        preg_match_all('/@property(?:-read)?\\s+([a-zA-Z0-9_|\\\\\\\\\\[\\]]+)\\s+\\$([a-zA-Z0-9_]+)/', $docComment, $docMatches);
                        if (!empty($docMatches[2])) {
                            foreach ($docMatches[2] as $idx => $propName) {
                                $docType = strtolower($docMatches[1][$idx]);
                                $typeStr = 'mixed';
                                if (str_contains($docType, 'int') || str_contains($docType, 'float') || str_contains($docType, 'double')) {
                                    $typeStr = 'number';
                                } elseif (str_contains($docType, 'bool')) {
                                    $typeStr = 'boolean';
                                } elseif (str_contains($docType, 'string')) {
                                    $typeStr = 'string';
                                } elseif (str_contains($docType, 'array')) {
                                    $typeStr = 'array';
                                } else {
                                    $typeStr = class_basename($docMatches[1][$idx]);
                                }
                                $accessors[$propName] = [
                                    'expression' => null,
                                    'type' => $typeStr
                                ];
                            }
                        }
                    }
                    $fileName = $reflection->getFileName();
                    $lines = ($fileName && is_file($fileName)) ? file($fileName) : [];
                    if (is_array($lines) && !empty($lines)) {
                        foreach ($reflection->getMethods() as $method) {
                            if ($method->getDeclaringClass()->getName() !== $class) continue;

                            $mStart = $method->getStartLine();
                            $mEnd = $method->getEndLine();
                            if ($mStart !== false && $mEnd !== false) {
                                $mLines = array_slice($lines, $mStart - 1, $mEnd - $mStart + 1);
                                $mSource = implode("", $mLines);
                                
                                // 1. Parse relationship
                                if ($method->getNumberOfParameters() === 0 && preg_match('/\\$this->(belongsTo|hasMany|hasOne|belongsToMany|morphTo|morphMany|morphOne|morphToMany|morphedByMany)\\s*\\(\\s*([a-zA-Z0-9_\\\\\\\\]+)::class/i', $mSource, $relMatches)) {
                                    $relModel = class_basename($relMatches[2]);
                                    $relations[$method->getName()] = [
                                        'type' => $relMatches[1],
                                        'model' => $relModel
                                    ];
                                }
                                
                                // 2. Parse accessor (Attribute return type or Attribute::make call in body)
                                if (preg_match('/Attribute::make\\s*\\(\\s*(?:get:\\s*)?fn\\s*\\(\\s*\\)\\s*=>\\s*(.+)\\s*\\)\\s*;/s', $mSource, $attrMatches)) {
                                    $accessors[$method->getName()] = [
                                        'expression' => trim($attrMatches[1]),
                                        'sourceFile' => $fileName ?: null,
                                        'sourceLine' => $mStart ?: null
                                    ];
                                } else if (preg_match('/Attribute::make\\s*\\(\\s*(?:get:\\s*)?function\\s*\\(\\s*\\)\\s*\\{.*?return\\s*(.+?);\\s*\\}/s', $mSource, $attrMatches)) {
                                    $accessors[$method->getName()] = [
                                        'expression' => trim($attrMatches[1]),
                                        'sourceFile' => $fileName ?: null,
                                        'sourceLine' => $mStart ?: null
                                    ];
                                } else if (preg_match('/^get([A-Za-z0-9_]+)Attribute$/', $method->getName(), $accessorMatches)) {
                                    $attrName = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $accessorMatches[1]));
                                    $typeStr = 'mixed';
                                    $returnType = $method->getReturnType();
                                    if ($returnType && $returnType instanceof ReflectionNamedType) {
                                        $rName = $returnType->getName();
                                        if ($rName === 'bool') $typeStr = 'boolean';
                                        elseif ($rName === 'int' || $rName === 'float') $typeStr = 'number';
                                        elseif ($rName === 'string') $typeStr = 'string';
                                        elseif ($rName === 'array') $typeStr = 'array';
                                        else $typeStr = class_basename($rName);
                                    } else {
                                        $doc = $method->getDocComment();
                                        if ($doc && preg_match('/@return\\s+([a-zA-Z0-9_|\\\\\\\\\\[\\]]+)/', $doc, $docMatches)) {
                                            $docType = strtolower($docMatches[1]);
                                            if (str_contains($docType, 'int') || str_contains($docType, 'float') || str_contains($docType, 'double')) {
                                                $typeStr = 'number';
                                            } elseif (str_contains($docType, 'bool')) {
                                                $typeStr = 'boolean';
                                            } elseif (str_contains($docType, 'string')) {
                                                $typeStr = 'string';
                                            } elseif (str_contains($docType, 'array')) {
                                                $typeStr = 'array';
                                            }
                                        }
                                    }
                                    $exprStr = null;
                                    if (preg_match('/return\\s+(.+?);/s', $mSource, $retMatches)) {
                                        $exprStr = trim($retMatches[1]);
                                    }
                                    $accessors[$attrName] = [
                                        'expression' => $exprStr,
                                        'type' => $typeStr,
                                        'sourceFile' => $fileName ?: null,
                                        'sourceLine' => $mStart ?: null
                                    ];
                                }
                            }
                        }
                    }

                    $result['models'][] = [
                        'name' => class_basename($class),
                        'table' => $table,
                        'columns' => $parsedColumns,
                        'hidden' => $model->getHidden(),
                        'appends' => $model->getAppends(),
                        'casts' => $model->getCasts(),
                        'relations' => $relations,
                        'accessors' => $accessors
                    ];
                } catch (\\Throwable $e) {
                    file_put_contents(__DIR__ . '/routesync-error.log', "Error on class " . $class . ": " . $e->getMessage() . " on line " . $e->getLine() . "\\n", FILE_APPEND);
                }
            }
        }
    }

    $dtosPath = app_path('Http/DTOs');
    if (is_dir($dtosPath)) {
        $files = \\Illuminate\\Support\\Facades\\File::allFiles($dtosPath);
        foreach ($files as $file) {
            $class = 'App\\\\Http\\\\DTOs\\\\' . str_replace('/', '\\\\', $file->getRelativePathname());
            $class = preg_replace('/\\.php$/', '', $class);

            if (class_exists($class)) {
                try {
                    $reflection = new ReflectionClass($class);
                    if ($reflection->isAbstract()) continue;

                    $parsedColumns = [];
                    foreach ($reflection->getProperties(ReflectionProperty::IS_PUBLIC) as $prop) {
                        $typeStr = 'mixed';
                        $nullable = true;
                        if ($prop->hasType()) {
                            $refType = $prop->getType();
                            $nullable = $refType->allowsNull();
                            if ($refType instanceof ReflectionNamedType) {
                                $name = $refType->getName();
                                if ($name === 'bool') {
                                    $typeStr = 'boolean';
                                } elseif ($name === 'int' || $name === 'float') {
                                    $typeStr = 'number';
                                } elseif ($name === 'string') {
                                    $typeStr = 'string';
                                } elseif ($name === 'array') {
                                    $typeStr = 'array';
                                } elseif ($name === 'mixed') {
                                    $typeStr = 'mixed';
                                } else {
                                    $typeStr = class_basename($name);
                                }
                            }
                        }
                        $parsedColumns[] = [
                            'name' => $prop->getName(),
                            'type' => $typeStr,
                            'nullable' => $nullable
                        ];
                    }

                    $result['models'][] = [
                        'name' => class_basename($class),
                        'table' => null,
                        'columns' => $parsedColumns,
                        'hidden' => [],
                        'appends' => [],
                        'casts' => [],
                        'relations' => [],
                        'accessors' => []
                    ];
                } catch (\\Throwable $e) {
                    file_put_contents(__DIR__ . '/routesync-error.log', "Error on DTO " . $class . ": " . $e->getMessage() . "\\n", FILE_APPEND);
                }
            }
        }
    }
}

// Extract Resources if models are extracted
if ($extractModels) {
    $resourcesPath = app_path('Http/Resources');
    if (is_dir($resourcesPath)) {
        $files = \\Illuminate\\Support\\Facades\\File::allFiles($resourcesPath);
        foreach ($files as $file) {
            $class = 'App\\\\Http\\\\Resources\\\\' . str_replace('/', '\\\\', $file->getRelativePathname());
            $class = preg_replace('/\\.php$/', '', $class);

            if (class_exists($class)) {
                try {
                    $reflection = new ReflectionClass($class);
                    if ($reflection->isAbstract()) continue;

                    $method = $reflection->getMethod('toArray');
                    $fileName = $reflection->getFileName();
                    $startLine = $method->getStartLine();
                    $endLine = $method->getEndLine();

                    if ($fileName && $startLine && $endLine) {
                        $lines = file($fileName);
                        $methodSource = implode("", array_slice($lines, $startLine - 1, $endLine - $startLine + 1));
                        
                        if (preg_match('/return\\s+\\[(.*?)\\];/s', $methodSource, $matches)) {
                            $arrayContent = "[" . $matches[1] . "]";
                            $tokens = token_get_all("<?php " . $arrayContent);
                            array_shift($tokens);
                            $idx = 0;
                            $fields = parseArrayTokens($tokens, $idx, []);
                            
                            $assignments = [];
                            if (preg_match_all('/\\$([a-zA-Z0-9_]+)\\s*=\\s*([^;]+);/s', $methodSource, $assignMatches)) {
                                foreach ($assignMatches[1] as $idx => $varName) {
                                    if ($varName === 'request' || $varName === 'this') continue;
                                    $expr = trim($assignMatches[2][$idx]);
                                    if (str_contains($expr, 'return')) continue;
                                    $assignments[$varName] = $expr;
                                }
                            }
                            
                            $result['resources'][] = [
                                'name' => class_basename($class),
                                'fields' => $fields,
                                'assignments' => $assignments,
                                'sourceFile' => $fileName ?: null,
                                'sourceLine' => $startLine ?: null
                            ];
                        }
                    }
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
      await fs.writeFile(path.join(projectRoot, 'routesync-dump.php'), phpScript)

      // Use spawnSync instead of execSync so we can capture stdout and stderr
      // as separate streams without relying on shell redirect syntax (which is
      // not cross-platform: "2>/dev/null" fails on Windows, "2>NUL" requires
      // shell:true which itself has quoting issues on Windows paths with spaces).
      const { spawnSync } = await import('child_process')
      const result = spawnSync('php', ['routesync-extractor-temp.php'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10
      })

//       await fs.remove(scriptPath)

      if (result.error) {
        throw result.error
      }

      const raw = result.stdout ?? ''

      // Strip UTF-8 BOM if present, normalize CRLF → LF, trim whitespace
      const cleaned = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()

      // Find the first '{' to skip any stray PHP notices/warnings on stdout
      const jsonStart = cleaned.indexOf('{')
      if (jsonStart === -1) {
        // Dump stderr to help diagnose what PHP actually printed
        const stderrHint = result.stderr ? `\nPHP stderr: ${result.stderr.slice(0, 500)}` : ''
        const stdoutHint = cleaned ? `\nPHP stdout: ${cleaned.slice(0, 500)}` : ''
        throw new Error('No JSON output from PHP script' + stderrHint + stdoutHint)
      }

      const parsed = JSON.parse(cleaned.slice(jsonStart))
      return {
        routes: parsed.routes || [],
        models: parsed.models || [],
        resources: parsed.resources || []
      }
    } catch (err) {
      if (fs.existsSync(scriptPath)) {
        // await fs.remove(scriptPath)
      }
      console.error('Failed to parse Laravel routes via PHP script:', err)
      return { routes: [], models: [], resources: [] }
    }
  }
}