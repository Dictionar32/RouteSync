<?php
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

if (!function_exists('parseMethodBody')) {
    function evaluateTokens($tokens, $symbolTable) {
        $opIdx = -1;
        $depth = 0;
        foreach ($tokens as $i => $t) {
            if ($t === '(') $depth++;
            elseif ($t === ')') $depth--;
            elseif ($depth === 0 && ($t === '+' || $t === '-' || $t === '*' || $t === '/')) {
                if (!is_array($t)) {
                    $opIdx = $i;
                    break;
                }
            }
        }
        
        if ($opIdx !== -1) {
            $leftTokens = array_slice($tokens, 0, $opIdx);
            $rightTokens = array_slice($tokens, $opIdx + 1);
            return [
                'kind' => 'binary_operation',
                'operator' => $tokens[$opIdx],
                'left' => evaluateTokens($leftTokens, $symbolTable),
                'right' => evaluateTokens($rightTokens, $symbolTable)
            ];
        }

        if (!empty($tokens)) {
            $first = $tokens[0];
            if (is_array($first) && in_array($first[0], [T_INT_CAST, T_DOUBLE_CAST, T_STRING_CAST, T_BOOL_CAST])) {
                $type = ($first[0] === T_INT_CAST || $first[0] === T_DOUBLE_CAST) ? 'number' : ($first[0] === T_BOOL_CAST ? 'boolean' : 'string');
                $argTokens = array_slice($tokens, 1);
                return [
                    'kind' => 'type_cast',
                    'type' => $type,
                    'argument' => evaluateTokens($argTokens, $symbolTable)
                ];
            }
        }

        $text = "";
        foreach ($tokens as $t) {
            $text .= is_array($t) ? $t[1] : $t;
        }
        $text = trim($text);
        if ($text === '') return null;
        
        if (preg_match('/([A-Z][a-zA-Z0-9_]+Resource)::collection/', $text, $m)) {
            return ['kind' => 'resource', 'resource' => $m[1], 'collection' => true];
        }
        if (preg_match('/new\\s+([A-Z][a-zA-Z0-9_]+Resource)/', $text, $m)) {
            return ['kind' => 'resource', 'resource' => $m[1], 'collection' => false];
        }
        if (preg_match('/([A-Z][a-zA-Z0-9_]+)::[a-zA-Z0-9_]+\\s*\\(.*?\\).*?->([a-zA-Z0-9_]+)\\s*\\((.*?)\\)(.*)/s', $text, $m)) {
            $className = $m[1];
            $methodName = $m[2];
            $trailing = $m[4];
            
            $methodNode = ['kind' => 'method_call', 'variable' => $className, 'method' => $methodName, 'confidence' => 50, 'source' => 'ast:static_method_call'];
            
            if (!empty(trim($trailing))) {
                preg_match_all('/(?:->|\\?->)([a-zA-Z0-9_]+)/', $trailing, $props);
                $chain = $props[1];
                $node = $methodNode;
                foreach ($chain as $prop) {
                    $node = [
                        'kind' => 'property_access',
                        'target' => $node,
                        'property' => $prop
                    ];
                }
                return $node;
            }
            return $methodNode;
        }
        

        if (preg_match('/\\$([a-zA-Z0-9_]+)((?:->|\\?->)[a-zA-Z0-9_]+(?![\\(\\{]))*->([a-zA-Z0-9_]+)\\s*\\((.*?)\\)(.*)/s', $text, $m)) {
            $varName = $m[1];
            $propertyChainStr = $m[2];
            $methodName = $m[3];
            $args = $m[4];
            $trailing = $m[5];
            
            $baseVar = $varName;
            if ($propertyChainStr !== '') {
                preg_match_all('/(?:->|\\?->)([a-zA-Z0-9_]+)/', $propertyChainStr, $props);
                $chain = $props[1];
                $node = ['kind' => 'primitive', 'type' => 'variable', 'name' => $varName];
                if (isset($symbolTable[$varName])) {
                    $node = $symbolTable[$varName];
                } elseif ($varName === 'this') {
                    $node = ['kind' => 'this'];
                }
                foreach ($chain as $prop) {
                    $node = [
                        'kind' => 'property_access',
                        'target' => $node,
                        'property' => $prop
                    ];
                }
                $baseVar = $node;
            } else {
                if ($varName === 'this') {
                    $baseVar = ['kind' => 'this'];
                } else if (isset($symbolTable[$varName])) {
                    $baseVar = $symbolTable[$varName];
                }
            }
            
            $methodNode = ['kind' => 'method_call', 'variable' => $baseVar, 'method' => $methodName, 'confidence' => 50, 'source' => 'ast:method_call'];
            
            if (is_string($baseVar) && isset($symbolTable[$baseVar]) && isset($symbolTable[$baseVar]['class'])) {
                $className = $symbolTable[$baseVar]['class'];
                if (class_exists($className)) {
                    try {
                        $ref = new ReflectionMethod($className, $methodName);
                        $rt = $ref->getReturnType();
                        if ($rt) {
                            $methodNode = ['kind' => 'resolved_method', 'type' => $rt->getName(), 'confidence' => 100, 'source' => "native_return:$className::$methodName"];
                        } else {
                            $doc = $ref->getDocComment();
                            if ($doc && preg_match('/@return\\s+([a-zA-Z0-9_\\\\]+)/', $doc, $docM)) {
                                $methodNode = ['kind' => 'resolved_method', 'type' => ltrim($docM[1], '\\\\'), 'confidence' => 90, 'source' => "phpdoc_return:$className::$methodName"];
                            }
                        }
                    } catch (\\Exception $e) {}
                }
            }
            
            if (!empty(trim($trailing))) {
                preg_match_all('/(?:->|\\?->)([a-zA-Z0-9_]+)/', $trailing, $props);
                $chain = $props[1];
                $node = $methodNode;
                foreach ($chain as $prop) {
                    $node = [
                        'kind' => 'property_access',
                        'target' => $node,
                        'property' => $prop
                    ];
                }
                return $node;
            }
            
            return $methodNode;
        }
        
        if (preg_match('/\\$([a-zA-Z0-9_]+)((?:->|\\?->)[a-zA-Z0-9_]+(?![\\(\\{]))*/', $text, $m)) {
            $varName = $m[1];
            if (isset($symbolTable[$varName])) {
                $chainStr = substr($m[0], strlen('$' . $varName));
                if (empty($chainStr)) {
                    return $symbolTable[$varName];
                }
                
                preg_match_all('/(?:->|\\?->)([a-zA-Z0-9_]+)/', $chainStr, $props);
                $chain = $props[1];
                
                $node = $symbolTable[$varName];
                foreach ($chain as $prop) {
                    $node = [
                        'kind' => 'property_access',
                        'target' => $node,
                        'property' => $prop
                    ];
                }
                return $node;
            }
        }
        
        $valLower = strtolower($text);
        if ($valLower === 'null') return ['kind' => 'primitive', 'type' => 'null', 'confidence' => 100, 'source' => 'ast:literal'];
        if ($valLower === 'true' || $valLower === 'false') return ['kind' => 'primitive', 'type' => 'boolean', 'confidence' => 100, 'source' => 'ast:literal'];
        if (is_numeric($valLower)) return ['kind' => 'primitive', 'type' => 'number', 'confidence' => 100, 'source' => 'ast:literal'];
        if (preg_match('/^[\\'"].*[\\'"]$/', $text)) return ['kind' => 'primitive', 'type' => 'string', 'confidence' => 100, 'source' => 'ast:literal'];
        if (str_contains($text, '?') && str_contains($text, ':')) {
            if (preg_match('/[\\'"]/', $text)) return ['kind' => 'primitive', 'type' => 'string', 'confidence' => 90, 'source' => 'ast:ternary_string'];
        }
        
        if (str_contains($valLower, '(int)') || str_contains($valLower, '(float)')) return ['kind' => 'primitive', 'type' => 'number', 'confidence' => 100, 'source' => 'ast:cast'];
        if (str_contains($valLower, '(string)')) return ['kind' => 'primitive', 'type' => 'string', 'confidence' => 100, 'source' => 'ast:cast'];
        if (str_contains($valLower, '(bool)')) return ['kind' => 'primitive', 'type' => 'boolean', 'confidence' => 100, 'source' => 'ast:cast'];
        if (str_contains($valLower, '(array)')) return ['kind' => 'primitive', 'type' => 'array', 'confidence' => 100, 'source' => 'ast:cast'];
        if (str_contains($valLower, '(object)')) return ['kind' => 'primitive', 'type' => 'object', 'confidence' => 100, 'source' => 'ast:cast'];
        
        return ['kind' => 'primitive', 'type' => 'unknown', 'confidence' => 0, 'source' => 'unresolved: ' . substr(str_replace("\\n", ' ', $text), 0, 50)];
    }

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
                        continue;
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
                    $currentKey = trim($text, "'\\"");
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
                if (is_string($token) && $token === '[') {
                    $index++;
                    $fields[$currentKey] = [
                        'kind' => 'object',
                        'fields' => parseArrayTokens($tokens, $index, $symbolTable)
                    ];
                    $currentKey = null;
                    $expectingKey = true;
                    continue;
                }
                
                $valueTokens = [];
                $bracketDepth = 0;
                $parenDepth = 0;
                while ($index < count($tokens)) {
                    $t = $tokens[$index];
                    if (is_string($t)) {
                        if ($t === '[') $bracketDepth++;
                        elseif ($t === ']') $bracketDepth--;
                        elseif ($t === '(') $parenDepth++;
                        elseif ($t === ')') $parenDepth--;
                    }
                    
                    if ($bracketDepth <= 0 && $parenDepth <= 0 && is_string($t) && ($t === ',' || $t === ']')) {
                        break;
                    }
                    if (!(is_array($t) && ($t[0] === T_WHITESPACE || $t[0] === T_COMMENT || $t[0] === T_DOC_COMMENT))) {
                        $valueTokens[] = $t;
                    }
                    $index++;
                }
                
                if ($currentKey !== null) {
                    $evalRes = evaluateTokens($valueTokens, $symbolTable);
                    if ($evalRes) {
                        $fields[$currentKey] = $evalRes;
                    }
                }
                $currentKey = null;
            }
        }
        
        return (object)$fields;
    }
    
    function parseMethodBody($methodSource, $initialSymbolTable) {
        $tokens = token_get_all("<?php\\n" . $methodSource);
        $symbolTable = $initialSymbolTable;
        $index = 0;
        
        // Pass 1: analyze assignments
        while ($index < count($tokens)) {
            $token = $tokens[$index];
            if (is_array($token) && $token[0] === T_RETURN) {
                break;
            }
            if (is_array($token) && $token[0] === T_VARIABLE) {
                $varName = ltrim($token[1], '$');
                if ($varName === 'this') { $index++; continue; }
                
                $lookIdx = $index + 1;
                while ($lookIdx < count($tokens) && is_array($tokens[$lookIdx]) && $tokens[$lookIdx][0] === T_WHITESPACE) $lookIdx++;
                
                if ($lookIdx < count($tokens) && is_string($tokens[$lookIdx]) && $tokens[$lookIdx] === '=') {
                    $rhsIdx = $lookIdx + 1;
                    $valueTokens = [];
                    $bracketDepth = 0;
                    $parenDepth = 0;
                    while ($rhsIdx < count($tokens)) {
                        $t = $tokens[$rhsIdx];
                        if (is_string($t)) {
                            if ($t === '[') $bracketDepth++;
                            elseif ($t === ']') $bracketDepth--;
                            elseif ($t === '(') $parenDepth++;
                            elseif ($t === ')') $parenDepth--;
                            elseif ($t === ';' && $bracketDepth <= 0 && $parenDepth <= 0) {
                                break;
                            }
                        }
                        if (!(is_array($t) && ($t[0] === T_WHITESPACE || $t[0] === T_COMMENT || $t[0] === T_DOC_COMMENT))) {
                            $valueTokens[] = $t;
                        }
                        $rhsIdx++;
                    }
                    
                    if (!empty($valueTokens)) {
                        $val = evaluateTokens($valueTokens, $symbolTable);
                        if ($val) {
                            $symbolTable[$varName] = $val;
                        }
                    }
                    $index = $rhsIdx;
                    continue;
                }
            }
            $index++;
        }
        
        // Pass 2: parse return statement
        while ($index < count($tokens)) {
            $token = $tokens[$index];
            if (is_array($token) && $token[0] === T_RETURN) {
                $lookIdx = $index + 1;
                while ($lookIdx < count($tokens) && is_array($tokens[$lookIdx]) && ($tokens[$lookIdx][0] === T_WHITESPACE || $tokens[$lookIdx][0] === T_COMMENT || $tokens[$lookIdx][0] === T_DOC_COMMENT)) $lookIdx++;
                
                if ($lookIdx < count($tokens) && is_string($tokens[$lookIdx]) && $tokens[$lookIdx] === '[') {
                    $idx = $lookIdx + 1;
                    return ['kind' => 'object', 'fields' => parseArrayTokens($tokens, $idx, $symbolTable)];
                }
                if ($lookIdx < count($tokens) && is_array($tokens[$lookIdx]) && $tokens[$lookIdx][0] === T_ARRAY) {
                    $parenIdx = $lookIdx + 1;
                    while ($parenIdx < count($tokens) && is_array($tokens[$parenIdx]) && ($tokens[$parenIdx][0] === T_WHITESPACE || $tokens[$parenIdx][0] === T_COMMENT)) $parenIdx++;
                    if ($parenIdx < count($tokens) && is_string($tokens[$parenIdx]) && $tokens[$parenIdx] === '(') {
                        $idx = $parenIdx + 1;
                        return ['kind' => 'object', 'fields' => parseArrayTokens($tokens, $idx, $symbolTable)];
                    }
                }
                
                // response()->json([...]) or response()->json(array(...))
                $jsonIdx = $lookIdx;
                $isResponseJson = false;
                $jsonStartIdx = 0;
                while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && ($tokens[$jsonIdx][0] === T_WHITESPACE || $tokens[$jsonIdx][0] === T_COMMENT)) $jsonIdx++;
                
                // check for response
                if ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][1] === 'response') {
                    $jsonIdx++;
                    while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                    if ($jsonIdx < count($tokens) && is_string($tokens[$jsonIdx]) && $tokens[$jsonIdx] === '(') {
                        $jsonIdx++;
                        while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                        if ($jsonIdx < count($tokens) && is_string($tokens[$jsonIdx]) && $tokens[$jsonIdx] === ')') {
                            $jsonIdx++;
                            while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                            if ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_OBJECT_OPERATOR) {
                                $jsonIdx++;
                                while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                                if ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][1] === 'json') {
                                    $jsonIdx++;
                                    while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                                    if ($jsonIdx < count($tokens) && is_string($tokens[$jsonIdx]) && $tokens[$jsonIdx] === '(') {
                                        $isResponseJson = true;
                                        $jsonStartIdx = $jsonIdx + 1;
                                    }
                                }
                            }
                        }
                    }
                }
                
                if ($isResponseJson) {
                    $jsonIdx = $jsonStartIdx;
                    while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                    if ($jsonIdx < count($tokens) && is_string($tokens[$jsonIdx]) && $tokens[$jsonIdx] === '[') {
                        $idx = $jsonIdx + 1;
                        return ['kind' => 'object', 'fields' => parseArrayTokens($tokens, $idx, $symbolTable)];
                    }
                    if ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_ARRAY) {
                        $jsonIdx++;
                        while ($jsonIdx < count($tokens) && is_array($tokens[$jsonIdx]) && $tokens[$jsonIdx][0] === T_WHITESPACE) $jsonIdx++;
                        if ($jsonIdx < count($tokens) && is_string($tokens[$jsonIdx]) && $tokens[$jsonIdx] === '(') {
                            $idx = $jsonIdx + 1;
                            return ['kind' => 'object', 'fields' => parseArrayTokens($tokens, $idx, $symbolTable)];
                        }
                    }
                }
                
                $valueTokens = [];
                $bracketDepth = 0; $parenDepth = 0;
                while ($lookIdx < count($tokens)) {
                    $t = $tokens[$lookIdx];
                    if (is_string($t)) {
                        if ($t === '[') $bracketDepth++;
                        elseif ($t === ']') $bracketDepth--;
                        elseif ($t === '(') $parenDepth++;
                        elseif ($t === ')') $parenDepth--;
                        elseif ($t === ';' && $bracketDepth <= 0 && $parenDepth <= 0) break;
                    }
                    if (!(is_array($t) && ($t[0] === T_WHITESPACE || $t[0] === T_COMMENT || $t[0] === T_DOC_COMMENT))) {
                        $valueTokens[] = $t;
                    }
                    $lookIdx++;
                }
                
                if (!empty($valueTokens)) {
                    return evaluateTokens($valueTokens, $symbolTable);
                }
            }
            $index++;
        }
        
        return null;
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
        if (is_string($mw) && (str_contains($mw, 'auth') || str_contains($mw, 'sanctum'))) $auth = true;
    }
    $schema = [];
    $action = $route->getAction();
    $responseMetadata = null;
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
                            if (method_exists($request, 'rules')) $schema = $request->rules();
                        }
                    }
                }
                
                $fileName = $reflector->getFileName();
                $startLine = $reflector->getStartLine();
                $endLine = $reflector->getEndLine();
                if ($fileName && $startLine && $endLine) {
                    $lines = file($fileName);
                    $methodSource = implode("", array_slice($lines, $startLine - 1, $endLine - $startLine + 1));
                    $symbolTable = [];
                    $responseMetadata = parseMethodBody($methodSource, $symbolTable);
                }
            } catch (\Exception $e) {}
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

// Extract Models
$extractModels = ${extractModels};
if ($extractModels) {
    $modelsPath = app_path('Models');
    if (is_dir($modelsPath)) {
        $files = \\Illuminate\\Support\\Facades\\File::allFiles($modelsPath);
        foreach ($files as $file) {
            $class = 'App\\Models\\\\' . str_replace('/', '\\\\', $file->getRelativePathname());
            $class = preg_replace('/\\.php$/', '', $class);
            if (class_exists($class) && is_subclass_of($class, 'Illuminate\\Database\\Eloquent\\Model')) {
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
                    
                    // Basic Relations and Accessors inference from methods
                    $relations = [];
                    $accessors = [];
                    foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC | ReflectionMethod::IS_PROTECTED) as $m) {
                        if ($m->class !== $class) continue;
                        $mName = $m->getName();
                        
                        $isLegacyAccessor = preg_match('/^get(.+)Attribute$/', $mName, $accessorMatch);
                        $rt = $m->getReturnType();
                        $isModernAccessor = $rt && $rt->getName() === 'Illuminate\\\\Database\\\\Eloquent\\\\Casts\\\\Attribute';

                        if (!$isLegacyAccessor && !$isModernAccessor) {
                            $source = file($m->getFileName());
                            $body = implode('', array_slice($source, $m->getStartLine()-1, $m->getEndLine() - $m->getStartLine() + 1));
                            if (preg_match('/return\\s+\\$this->(hasOne|hasMany|belongsTo|belongsToMany)\\(\\s*([A-Z][a-zA-Z0-9_]+)::class/', $body, $relMatch)) {
                                $relations[$mName] = ['model' => $relMatch[2], 'type' => ucfirst($relMatch[1])];
                            }
                            continue;
                        }

                        $attrName = $isLegacyAccessor ? \\Illuminate\\Support\\Str::snake($accessorMatch[1]) : \\Illuminate\\Support\\Str::snake($mName);
                        
                        // Phase 6B & 6C: Accessor Type & Dependency Resolution
                        $source = file($m->getFileName());
                        $body = implode('', array_slice($source, $m->getStartLine()-1, $m->getEndLine() - $m->getStartLine() + 1));
                        
                        $tokens = token_get_all('<?php ' . $body);
                        $filtered = [];
                        foreach ($tokens as $t) {
                            if (is_array($t)) {
                                if ($t[0] === T_WHITESPACE || $t[0] === T_COMMENT || $t[0] === T_DOC_COMMENT || $t[0] === T_OPEN_TAG) continue;
                                $filtered[] = $t;
                            } else {
                                $filtered[] = $t;
                            }
                        }
                        
                        $expression = null;
                        $confidence = 50;
                        
                        $exprTokens = [];
                        $inExpr = false;
                        $afterClosure = false;
                        $depth = 0;
                        foreach ($filtered as $t) {
                            if (is_array($t) && ($t[0] === T_RETURN || $t[0] === T_DOUBLE_ARROW)) {
                                if (!$inExpr) {
                                    $inExpr = true;
                                    $depth = 0;
                                    continue;
                                } else {
                                    // If we are inside an expression and see T_DOUBLE_ARROW (=>), it's probably fn() =>
                                    $afterClosure = true;
                                    $exprTokens = [];
                                    $depth = 0;
                                    continue;
                                }
                            }
                            if ($inExpr) {
                                if ($t === ';' || $t === '}') break;
                                
                                if ($t === '(') $depth++;
                                if ($t === ')') {
                                    $depth--;
                                    if ($depth < 0) break; // Reached closing paren of Attribute::make()
                                }
                                
                                if (!$afterClosure && is_array($t) && $t[0] === T_RETURN) {
                                    $afterClosure = true;
                                    $exprTokens = [];
                                    $depth = 0;
                                    continue;
                                }
                                
                                $exprTokens[] = $t;
                            }
                        }
                        
                        if (!empty($exprTokens)) {
                            $symbolTable['this'] = ['kind' => 'this'];
                            $expression = evaluateTokens($exprTokens, $symbolTable);
                            if ($expression) $confidence = 90;
                        }
                        
                        $accessors[$attrName] = [
                            'expression' => $expression,
                            'confidence' => $confidence
                        ];
                    }

                    $appendTypes = [];
                    $docComment = $reflection->getDocComment();
                    if ($docComment) {
                        preg_match_all('/@property\\s+([a-zA-Z0-9_|\\[\\]]+)\\s+\\$([a-zA-Z0-9_]+)/', $docComment, $matches, PREG_SET_ORDER);
                        foreach ($matches as $m) {
                            $typeStr = strtolower($m[1]);
                            $mappedType = 'string';
                            if (str_contains($typeStr, 'int') || str_contains($typeStr, 'float')) $mappedType = 'integer';
                            if (str_contains($typeStr, 'bool')) $mappedType = 'boolean';
                            if (str_contains($typeStr, 'array') || str_contains($typeStr, '[')) $mappedType = 'array';
                            $appendTypes[$m[2]] = $mappedType;
                        }
                    }
                    
                    foreach ($model->getAppends() as $append) {
                        if (isset($appendTypes[$append])) continue;
                        $camelMethod = 'get' . str_replace(' ', '', ucwords(str_replace('_', ' ', $append))) . 'Attribute';
                        if ($reflection->hasMethod($camelMethod)) {
                            $m = $reflection->getMethod($camelMethod);
                            $rt = $m->getReturnType();
                            if ($rt) {
                                $rtName = $rt->getName();
                                if ($rtName === 'int' || $rtName === 'float') $appendTypes[$append] = 'integer';
                                elseif ($rtName === 'bool') $appendTypes[$append] = 'boolean';
                                elseif ($rtName === 'array') $appendTypes[$append] = 'array';
                                else $appendTypes[$append] = 'string';
                            }
                        }
                    }

                    $result['models'][] = [
                        'name' => class_basename($class),
                        'table' => $table,
                        'columns' => $parsedColumns,
                        'hidden' => $model->getHidden(),
                        'appends' => $model->getAppends(),
                        'append_types' => $appendTypes,
                        'casts' => $model->getCasts(),
                        'relations' => $relations,
                        'accessors' => $accessors
                    ];
                } catch (\\Throwable $e) {
                    file_put_contents('routesync-err.log', "Error on Model $class: " . $e->getMessage() . "\\n" . $e->getTraceAsString() . "\\n", FILE_APPEND);
                }
            }
        }
    }

    $resourcesPath = app_path('Http/Resources');
    if (is_dir($resourcesPath)) {
        $files = \\Illuminate\\Support\\Facades\\File::allFiles($resourcesPath);
        foreach ($files as $file) {
            $class = 'App\\Http\\Resources\\\\' . str_replace('/', '\\\\', $file->getRelativePathname());
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
                        
                        $symbolTable = [];
                        $docComment = $reflection->getDocComment();
                        if ($docComment && preg_match('/@mixin\\s+([\\w\\\\\\]+)/', $docComment, $m)) {
                            $symbolTable['this'] = ['kind' => 'model', 'model' => trim(class_basename($m[1]))];
                        } else {
                            $symbolTable['this'] = ['kind' => 'model', 'model' => str_replace('Resource', '', class_basename($class))];
                        }
                        
                        $fields = parseMethodBody($methodSource, $symbolTable);
                        if ($fields) {
                            if (is_array($fields) && isset($fields['kind']) && $fields['kind'] === 'object' && isset($fields['fields'])) {
                                $fields = $fields['fields'];
                            } else if (is_object($fields) && property_exists($fields, 'kind') && $fields->kind === 'object' && property_exists($fields, 'fields')) {
                                $fields = $fields->fields;
                            }
                            $result['resources'][] = [
                                'name' => class_basename($class),
                                'fields' => $fields
                            ];
                        }
                    }
                } catch (\\Exception $e) {}
            }
        }
    }
}

echo json_encode($result);
