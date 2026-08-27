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
                // NOTE: this block is now dead code as of the Resource Discovery
                // fix below — $responseMetadata is never set yet at this point in
                // execution (Resource Discovery, which sets it, runs AFTER this).
                // It's harmless (the guard below just never becomes true), but its
                // class-resolution logic (use-statement/alias resolution, the
                // DB::transaction(...) pattern) is more robust than the inline
                // version now inside Resource Discovery. Left in place rather than
                // silently deleted — worth consolidating into a single WrapResolver
                // that Resource Discovery calls, as a separate, deliberate cleanup
                // (not folded into this fix to keep this change narrowly scoped to
                // the actual bug: the attribute short-circuiting Resource Discovery).
                //
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

                // Incremental array construction: $response['key'] = value; — the
                // scanner above structurally cannot match this (its regex requires
                // '=' immediately after the variable name; '[...]' in between means
                // no match at all), so a shape built up field-by-field across
                // several statements was invisible to $assignments entirely.
                $incrementalAssignments = [];
                if ($methodSource) {
                    if (preg_match_all('/\$([a-zA-Z0-9_]+)\[\s*[\'"]([a-zA-Z0-9_]+)[\'"]\s*\]\s*=\s*([^;]+);/s', $methodSource, $incMatches)) {
                        foreach ($incMatches[1] as $idx => $varName) {
                            $key = $incMatches[2][$idx];
                            $expr = trim($incMatches[3][$idx]);
                            if (str_starts_with($expr, 'return')) continue;
                            $expr = preg_replace('/\s+/', ' ', $expr);
                            if (!isset($incrementalAssignments[$varName])) {
                                $incrementalAssignments[$varName] = [];
                            }
                            $incrementalAssignments[$varName][] = "'" . $key . "' => " . $expr;
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

if (!function_exists('deriveTransportAndShape')) {
    // Phase 1 of the ResponseDescriptor proposal (see
    // ISSUE-manifest-resource-linkage.md): derive 'transport' and 'shape' from
    // data the manifest already has (kind/model/resource/collection/paginated),
    // rather than resolving anything new. Purely additive — ReadEmitter doesn't
    // read these fields yet, so this cannot change any existing output.
    // 'transport' answers "what wire format" (resource/model/json/primitive/...),
    // 'shape' answers "single, collection, or paginated" — kept orthogonal per
    // the design discussion, instead of collapsing both into one enum
    // (the old responseType draft had 'resourceCollection' AND a separate
    // 'shape:collection' saying the same thing twice).
    function deriveTransportAndShape($meta) {
        if (!is_array($meta) || !isset($meta['kind'])) {
            return ['transport' => 'json', 'shape' => 'single'];
        }

        $transport = 'json';
        if ($meta['kind'] === 'resource') {
            $transport = 'resource';
        } elseif ($meta['kind'] === 'model') {
            $transport = 'model';
        } elseif ($meta['kind'] === 'object') {
            $transport = 'json';
        }

        $shape = 'single';
        if (!empty($meta['paginated'])) {
            $shape = 'paginated';
        } elseif (!empty($meta['collection'])) {
            $shape = 'collection';
        }

        return ['transport' => $transport, 'shape' => $shape];
    }
}

if (!function_exists('deriveStatusAndContentType')) {
    // Last piece of the ResponseDescriptor proposal: status + contentType.
    // Defaults come from transport (a JSON resource/model/object response is
    // 200 unless told otherwise; redirect is 302; empty is 204; binary
    // transports are octet-stream). An explicit status passed to
    // response()->json($data, XXX) overrides the default when present —
    // this is a bounded, best-effort scan of $methodSource for that one
    // pattern, not a full evaluation of every branch/early-return in the
    // method, so a method with multiple response()->json(..., N) calls for
    // different branches only reflects whichever one this regex matches.
    function deriveStatusAndContentType($transport, $methodSource) {
        $status = null;
        $contentType = null;

        switch ($transport) {
            case 'resource':
            case 'model':
            case 'json':
                $contentType = 'application/json';
                $status = 200;
                break;
            case 'download':
            case 'binary':
            case 'stream':
                $contentType = 'application/octet-stream';
                $status = 200;
                break;
            case 'redirect':
                $status = 302;
                break;
            case 'empty':
                $status = 204;
                break;
        }

        if ($methodSource && preg_match('/response\\(\\)->json\\([^;]*?,\\s*(\\d{3})\\s*\\)/s', $methodSource, $m)) {
            $status = (int) $m[1];
        }

        return ['status' => $status, 'contentType' => $contentType];
    }
}

if (!function_exists('mergeAssignmentShape')) {
    // Fixes the "incremental array construction" gap: $response = ['message' => 'ok'];
    // followed by $response['reset_token'] = $token; — two different statements
    // that together build the shape actually passed to response()->json($response).
    // Rather than text-splicing new keys into the original "$response = [...]"
    // source (fragile — the closing bracket could be on any line, nested arrays
    // make find-the-real-closing-bracket ambiguous), this builds a FRESH array
    // literal string: inner content of the base assignment (if it looks like an
    // array literal) plus each incremental 'key' => expr entry appended after,
    // in the order they were scanned. That fresh literal is what
    // token_get_all() downstream tokenizes, same as any other array-literal
    // response shape.
    function mergeAssignmentShape($varName, $assignments, $incrementalAssignments) {
        $base = $assignments[$varName] ?? null;
        $incremental = $incrementalAssignments[$varName] ?? [];

        $baseInner = '';
        if ($base !== null) {
            $trimmed = trim($base);
            if (str_starts_with($trimmed, '[') && str_ends_with($trimmed, ']')) {
                $baseInner = trim(substr($trimmed, 1, -1));
                $baseInner = rtrim($baseInner, " \t\n\r\0\x0B,");
            }
        }

        $parts = [];
        if ($baseInner !== '') {
            $parts[] = $baseInner;
        }
        foreach ($incremental as $entry) {
            $entryClean = rtrim(trim($entry), " \t\n\r\0\x0B,");
            if ($entryClean !== '') {
                $parts[] = $entryClean;
            }
        }

        if (empty($parts)) {
            return null;
        }

        return '[' . implode(', ', $parts) . ']';
    }
}

if (!function_exists('parseArrayTokens')) {
    function skipArrayTrivia($tokens, &$index) {
        while ($index < count($tokens) && is_array($tokens[$index]) && in_array($tokens[$index][0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
            $index++;
        }
    }

    function tokensToCode($tokens) {
        $code = '';
        foreach ($tokens as $token) {
            $code .= is_array($token) ? $token[1] : $token;
        }
        return trim(preg_replace('/\\s+/', ' ', $code));
    }

    function descriptorFromExpression($code, $symbolTable = []) {
        $lower = strtolower($code);
        if ($lower === 'true' || $lower === 'false') return ['kind' => 'primitive', 'type' => 'boolean'];
        if ($lower === 'null') return ['kind' => 'primitive', 'type' => 'null'];
        if (is_numeric($code)) return ['kind' => 'primitive', 'type' => 'number'];
        if (preg_match('/^[\\\'\\"].*[\\\'\\"]$/s', $code)) return ['kind' => 'primitive', 'type' => 'string'];

        // Inline JSON can contain a variable assigned by Eloquent get() or
        // paginate(). The response scanner already records those values in
        // $symbolTable; keep that collection metadata in the manifest.
        if (preg_match('/^\\$([A-Za-z_][A-Za-z0-9_]*)$/', $code, $matches)
            && isset($symbolTable[$matches[1]])) {
            $symbol = $symbolTable[$matches[1]];
            $elementFromCollection = function ($collection) {
                $element = $collection;
                $element['collection'] = false;
                unset($element['paginated']);
                return $element;
            };
            if (($symbol['kind'] ?? null) === 'model' && !empty($symbol['paginated'])) {
                // Laravel paginator JSON is an object with an array in data.
                return [
                    'kind' => 'object',
                    'paginated' => true,
                    'fields' => (object)[
                        'data' => [
                            'kind' => 'array',
                            'element' => $elementFromCollection($symbol)
                        ]
                    ]
                ];
            }
            if (($symbol['kind'] ?? null) === 'model' && !empty($symbol['collection'])) {
                return [
                    'kind' => 'array',
                    'element' => $elementFromCollection($symbol)
                ];
            }
            return $symbol;
        }

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
        return ['kind' => 'raw_code', 'code' => $code, 'hints' => (object)$hints];
    }

    function parseArrayExpression($tokens, &$index, $symbolTable) {
        skipArrayTrivia($tokens, $index);
        if ($index < count($tokens) && $tokens[$index] === '[') {
            return parseArrayValue($tokens, $index, $symbolTable);
        }

        $valueTokens = [];
        $bracketDepth = 0;
        $parenDepth = 0;
        while ($index < count($tokens)) {
            $token = $tokens[$index];
            if (is_string($token)) {
                if ($token === '[') $bracketDepth++;
                if ($token === ']') {
                    if ($bracketDepth === 0 && $parenDepth === 0) break;
                    $bracketDepth--;
                }
                if ($token === '(') $parenDepth++;
                if ($token === ')' && $parenDepth > 0) $parenDepth--;
                if ($token === ',' && $bracketDepth === 0 && $parenDepth === 0) break;
            }
            $valueTokens[] = $token;
            $index++;
        }

        return descriptorFromExpression(tokensToCode($valueTokens), $symbolTable);
    }

    function parseArrayValue($tokens, &$index, $symbolTable) {
        skipArrayTrivia($tokens, $index);
        if ($index < count($tokens) && $tokens[$index] === '[') $index++;

        $entries = [];
        $isAssociative = false;

        while ($index < count($tokens)) {
            skipArrayTrivia($tokens, $index);
            if ($index >= count($tokens)) break;
            if ($tokens[$index] === ']') {
                $index++;
                break;
            }

            // Detect a key/value pair before the next top-level comma or closing bracket.
            $scan = $index;
            $bracketDepth = 0;
            $parenDepth = 0;
            $arrowIndex = null;
            while ($scan < count($tokens)) {
                $token = $tokens[$scan];
                if (is_string($token)) {
                    if ($token === '[') $bracketDepth++;
                    if ($token === ']') {
                        if ($bracketDepth === 0 && $parenDepth === 0) break;
                        $bracketDepth--;
                    }
                    if ($token === '(') $parenDepth++;
                    if ($token === ')' && $parenDepth > 0) $parenDepth--;
                    if ($token === ',' && $bracketDepth === 0 && $parenDepth === 0) break;
                }
                if (is_array($token) && $token[0] === T_DOUBLE_ARROW && $bracketDepth === 0 && $parenDepth === 0) {
                    $arrowIndex = $scan;
                    break;
                }
                $scan++;
            }

            if ($arrowIndex !== null) {
                $key = tokensToCode(array_slice($tokens, $index, $arrowIndex - $index));
                $key = trim($key, "'\\\"");
                $index = $arrowIndex + 1;
                $entries[$key] = parseArrayExpression($tokens, $index, $symbolTable);
                $isAssociative = true;
            } else {
                $entries[] = parseArrayExpression($tokens, $index, $symbolTable);
            }

            skipArrayTrivia($tokens, $index);
            if ($index < count($tokens) && $tokens[$index] === ',') $index++;
        }

        if ($isAssociative) {
            return ['kind' => 'object', 'fields' => (object)$entries];
        }

        return [
            'kind' => 'array',
            'element' => $entries[0] ?? ['kind' => 'unknown']
        ];
    }

    function parseArrayTokens($tokens, &$index, $symbolTable) {
        $descriptor = parseArrayValue($tokens, $index, $symbolTable);
        return $descriptor['kind'] === 'object' ? $descriptor['fields'] : (object)[];
    }
}

if (!function_exists('readValidationRuleProperty')) {
    function readValidationRuleProperty($rule, $property, $default = null) {
        try {
            $reflection = new ReflectionObject($rule);
            while ($reflection) {
                if ($reflection->hasProperty($property)) {
                    $reflectedProperty = $reflection->getProperty($property);
                    $reflectedProperty->setAccessible(true);
                    return $reflectedProperty->getValue($rule);
                }
                $reflection = $reflection->getParentClass();
            }
        } catch (\Throwable $e) {
            // A rule we cannot inspect remains unsupported rather than aborting a scan.
        }
        return $default;
    }

    function normalizeManifestValidationRules($rules) {
        if (!is_array($rules)) return [];

        $normalized = [];
        foreach ($rules as $field => $fieldRules) {
            $ruleList = is_array($fieldRules) ? $fieldRules : [$fieldRules];
            $tokens = [];

            foreach ($ruleList as $rule) {
                if (is_string($rule)) {
                    $tokens[] = $rule;
                    continue;
                }

                if (is_object($rule) && is_a($rule, 'Illuminate\\Validation\\Rules\\File')) {
                    // Laravel's fluent File rule keeps its useful state in protected
                    // properties, which json_encode() otherwise emits as an empty object.
                    $tokens[] = 'file';
                    $isImage = is_a($rule, 'Illuminate\\Validation\\Rules\\ImageFile')
                        || readValidationRuleProperty($rule, 'image', false) === true;
                    if ($isImage) $tokens[] = 'image';

                    $allowedMimetypes = readValidationRuleProperty($rule, 'allowedMimetypes', []);
                    if (is_array($allowedMimetypes) && !empty($allowedMimetypes)) {
                        // File::types() accepts either extensions or MIME types.
                        // Preserve that distinction so downstream schema generation
                        // can emit the correct browser File validation.
                        $extensions = [];
                        $mimeTypes = [];
                        foreach ($allowedMimetypes as $allowedMimetype) {
                            if (!is_string($allowedMimetype)) continue;
                            if (str_contains($allowedMimetype, '/')) {
                                $mimeTypes[] = $allowedMimetype;
                            } else {
                                $extensions[] = $allowedMimetype;
                            }
                        }
                        if (!empty($extensions)) $tokens[] = 'mimes:' . implode(',', $extensions);
                        if (!empty($mimeTypes)) $tokens[] = 'mimetypes:' . implode(',', $mimeTypes);
                    }

                    $allowedExtensions = readValidationRuleProperty($rule, 'allowedExtensions', []);
                    if (is_array($allowedExtensions) && !empty($allowedExtensions)) {
                        $tokens[] = 'mimes:' . implode(',', $allowedExtensions);
                    }

                    $maximumFileSize = readValidationRuleProperty($rule, 'maximumFileSize');
                    if (is_numeric($maximumFileSize)) {
                        $tokens[] = 'max:' . $maximumFileSize;
                    }
                    continue;
                }

                if (is_object($rule) && method_exists($rule, '__toString')) {
                    $tokens[] = (string)$rule;
                }
            }

            $normalized[$field] = is_array($fieldRules) ? $tokens : ($tokens[0] ?? '');
        }
        return $normalized;
    }

    function extractInlineValidationRules($methodSource) {
        if (!preg_match('/\\$[A-Za-z_][A-Za-z0-9_]*->validate\\s*\\(\\s*(\\[.*?\\])\\s*\\)/s', $methodSource, $matches)) {
            return [];
        }

        $rules = [];
        if (!preg_match_all('/[\\\'\\"]([^\\\'\\"]+)[\\\'\\"]\\s*=>\\s*(\\[[^\\]]*\\]|[\\\'\\"][^\\\'\\"]*[\\\'"])/s', $matches[1], $fieldMatches, PREG_SET_ORDER)) {
            return $rules;
        }

        foreach ($fieldMatches as $fieldMatch) {
            $field = $fieldMatch[1];
            $value = trim($fieldMatch[2]);
            if (str_starts_with($value, '[')) {
                preg_match_all('/[\\\'\\"]([^\\\'\\"]+)[\\\'"]/', $value, $ruleMatches);
                $rules[$field] = $ruleMatches[1];
            } else {
                $rules[$field] = trim($value, "'\\\"");
            }
        }

        return $rules;
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
                                $schema = normalizeManifestValidationRules($request->rules());
                            }
                        }
                    }
                }

                // Parse PHP 8 Attributes for a MODEL hint — NOT the final response
                // shape. #[Response(Order::class)] only tells us which model the
                // endpoint is about; it says nothing about whether the actual
                // return statement wraps that model in a Resource class. Used to
                // commit straight to $responseMetadata here, which meant Resource
                // Discovery below (gated on '!$responseMetadata') never ran for any
                // method carrying this attribute — so 'return new OrderResource(...)'
                // was never read, and the manifest silently downgraded every
                // Resource-wrapped response to a bare model. Now it's just a hint
                // ($attributeModel) that gets merged into whatever Resource
                // Discovery finds, instead of overwriting it.
                $attributeModel = null;
                $attributeCollection = false;
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
                            $attributeModel = class_basename($type);
                            $attributeCollection = $collection;
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

                if (empty($schema) && $methodSource) {
                    $schema = extractInlineValidationRules($methodSource);
                }

${wrapDetectionPhp}

${assignmentsScannerPhp}

                // Resource Discovery — ALWAYS runs now, regardless of whether the
                // #[Response(...)] attribute already gave us a model hint. The
                // attribute and the actual return statement answer two different
                // questions (which model vs. what wire shape) and need to be
                // merged, not left to overwrite each other. See $attributeModel
                // above for why this changed.
                if ($methodSource) {
                    $resourceName = null;
                    $resourceClass = null;
                    $collection = $attributeCollection;

                    // FQCN-aware matching: [^\\s(]+ menangkap FQCN
                    // (\\App\\Http\\Resources\\OrderResource), short name (OrderResource),
                    // dan alias (OrderRes — tidak harus berakhiran "Resource").
                    // Tanpa ini, return new \\App\\Http\\Resources\\OrderResource(...)
                    // jatuh ke fallback bare-model dan deteksi $wrap ($wrapped) hilang.
                    if (preg_match('/return\\s+new\\s+([^\\s(]+)\\s*\\(/', $methodSource, $matches)
                        || preg_match('/return\\s+([^\\s(]+Resource)::(?:collection|make)\\s*\\(/', $methodSource, $matches)
                        || preg_match('/([^\\s(]+Resource)::collection\\s*\\(/', $methodSource, $matches)
                        || preg_match('/new\\s+([^\\s(]+)\\s*\\(/', $methodSource, $matches)) {
                        $rawName = ltrim($matches[1], '\\\\');
                        if (str_contains($matches[0], '::collection')) {
                            $collection = true;
                        }
                        if (str_contains($rawName, '\\\\')) {
                            // FQCN — pakai langsung, resource name = basename
                            $resourceClass = $rawName;
                            $resourceName = class_basename($rawName);
                        } else {
                            $candidate = 'App\\\\Http\\\\Resources\\\\' . $rawName;
                            if (class_exists($candidate)) {
                                $resourceClass = $candidate;
                                $resourceName = $rawName;
                            } else {
                                // Short name / alias — resolve via use statements di file controller
                                $ctrlFile = $reflector->getFileName();
                                if ($ctrlFile && file_exists($ctrlFile)) {
                                    $ctrlSource = file_get_contents($ctrlFile);
                                    $esc = preg_quote($rawName, '#');
                                    if (preg_match('#^\\s*use\\s+([\\w\\\\]+\\\\' . $esc . ')\\s*;#m', $ctrlSource, $um)) {
                                        $resourceClass = $um[1];
                                        $resourceName = class_basename($um[1]);
                                    } elseif (preg_match('#^\\s*use\\s+([^\\s;]+)\\s+as\\s+' . $esc . '\\s*;#m', $ctrlSource, $um)) {
                                        $resourceClass = $um[1];
                                        $resourceName = class_basename($um[1]);
                                    }
                                }
                            }
                        }
                    }

                    if ($resourceClass) {
                        if (class_exists($resourceClass)) {
                            $resReflector = new ReflectionClass($resourceClass);

                            // The model comes from the #[Response(...)] attribute
                            // hint when present — otherwise fall back to inspecting
                            // the Resource class's own attribute/@mixin.
                            $resolvedModel = $attributeModel;
                            if (!$resolvedModel) {
                                $resAttrs = $resReflector->getAttributes();
                                foreach ($resAttrs as $attr) {
                                    $shortName = class_basename($attr->getName());
                                    if (in_array($shortName, ['Response', 'RouteSyncResponse'])) {
                                        $args = $attr->getArguments();
                                        $type = $args[0] ?? $args['type'] ?? $args['model'] ?? $args['response'] ?? null;
                                        if ($type) {
                                            $resolvedModel = class_basename($type);
                                        }
                                    }
                                }
                            }
                            if (!$resolvedModel) {
                                $docComment = $resReflector->getDocComment();
                                if ($docComment && preg_match('/@mixin\\s+([\\\\a-zA-Z0-9_]+)/', $docComment, $mixinMatches)) {
                                    $resolvedModel = class_basename($mixinMatches[1]);
                                }
                            }

                            $responseMetadata = [
                                'kind' => 'resource',
                                'resource' => $resourceName,
                                'model' => $resolvedModel,
                                'collection' => $collection
                            ];
                            $responseMetadata = array_merge($responseMetadata, deriveTransportAndShape($responseMetadata));
                            $responseMetadata = array_merge($responseMetadata, deriveStatusAndContentType($responseMetadata['transport'], $methodSource));

                            // Detect Laravel JsonResource $wrap behavior automatically.
                            // Laravel wraps single resources in { data: ... } by default.
                            // The SDK handles this transparently — developers do not need
                            // to know about $wrap = null. We inspect the class via reflection:
                            // if this specific class does NOT declare a $wrap property set to
                            // null, the response is wrapped and we mark it in the manifest so
                            // ZodTierGenerator generates z.object({ data: schema }) accordingly.
                            if (!$collection) {
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

                // Fallback: Resource Discovery found nothing (return statement isn't
                // a recognized Resource pattern — e.g. WishlistController returning
                // a bare Eloquent collection), but the attribute gave us a model.
                // That's a genuine bare-model response, not a missed Resource.
                if (!$responseMetadata && $attributeModel) {
                    $responseMetadata = [
                        'kind' => 'model',
                        'model' => $attributeModel,
                        'collection' => $attributeCollection
                    ];
                    $responseMetadata = array_merge($responseMetadata, deriveTransportAndShape($responseMetadata));
                    $responseMetadata = array_merge($responseMetadata, deriveStatusAndContentType($responseMetadata['transport'], $methodSource));
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
                    } elseif (
                        preg_match('/return\\\\s+response\\\\(\\\\)->json\\\\(\\\\s*\\\\$([A-Za-z0-9_]+)\\\\s*[,)]/s', $methodSource, $varMatches)
                        && ($mergedShape = mergeAssignmentShape($varMatches[1], $assignments, $incrementalAssignments)) !== null
                    ) {
                        // return response()->json($response) where $response's shape
                        // comes from a plain "$response = [...]" assignment and/or
                        // incremental "$response['key'] = ...;" statements earlier in
                        // the method — both scanned above ($assignments /
                        // $incrementalAssignments), previously only ever written into
                        // the manifest's 'assignments' field, never read back for this.
                        $arrayContent = $mergedShape;
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
                                $responseMetadata = array_merge($responseMetadata, deriveTransportAndShape($responseMetadata));
                                $responseMetadata = array_merge($responseMetadata, deriveStatusAndContentType($responseMetadata['transport'], $methodSource));
                            }
                        } catch (\\Throwable $e) {
                            file_put_contents(__DIR__ . '/routesync-error.log', "Error: " . $e->getMessage() . " on line " . $e->getLine() . "\\n", FILE_APPEND);
                        }
                    }
                }

                // Fallback: non-JSON transports (Phase 3 of ResponseDescriptor).
                // These never produce a data shape for api-read.ts to generate —
                // detecting them here just means the manifest correctly records
                // *why* there's no shape (download/redirect/empty), instead of
                // $responseMetadata staying null and the route reporting
                // "Response type could not be inferred" as if it were a parser
                // failure. Order matters: more specific patterns first.
                if (!$responseMetadata && $methodSource) {
                    if (preg_match('/->\\s*download\\s*\\(/', $methodSource) ||
                        preg_match('/->\\s*streamDownload\\s*\\(/', $methodSource)) {
                        $responseMetadata = ['kind' => 'binary', 'transport' => 'download', 'shape' => 'single'];
                    } elseif (preg_match('/response\\(\\)\\s*->\\s*file\\s*\\(/', $methodSource) ||
                              preg_match('/->\\s*stream\\s*\\(/', $methodSource)) {
                        $responseMetadata = ['kind' => 'binary', 'transport' => 'stream', 'shape' => 'single'];
                    } elseif (preg_match('/\\bredirect\\s*\\(/', $methodSource) ||
                              preg_match('/\\bRedirect::/', $methodSource) ||
                              preg_match('/->\\s*route\\s*\\(/', $methodSource) ||
                              preg_match('/\\bback\\s*\\(\\s*\\)/', $methodSource)) {
                        $responseMetadata = ['kind' => 'redirect', 'transport' => 'redirect', 'shape' => 'single'];
                    } elseif (preg_match('/->\\s*noContent\\s*\\(/', $methodSource) ||
                              preg_match('/\\babort\\s*\\(\\s*204/', $methodSource)) {
                        $responseMetadata = ['kind' => 'empty', 'transport' => 'empty', 'shape' => 'single'];
                    }
                    if ($responseMetadata) {
                        $responseMetadata = array_merge($responseMetadata, deriveStatusAndContentType($responseMetadata['transport'], $methodSource));
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

                    $parsedColumns = [];
                    try {
                        $columns = \\Illuminate\\Support\\Facades\\Schema::getColumns($table);
                        foreach ($columns as $col) {
                            $parsedColumns[] = [
                                'name' => $col['name'],
                                'type' => $col['type'],
                                'nullable' => $col['nullable']
                            ];
                        }
                    } catch (\\Throwable $schemaErr) {
                        if ($reflection->hasProperty('fillable')) {
                            $fillableProp = $reflection->getProperty('fillable');
                            $fillableProp->setAccessible(true);
                            $fillable = $fillableProp->getValue($model);
                            if (is_array($fillable)) {
                                foreach ($fillable as $colName) {
                                    $parsedColumns[] = [
                                        'name' => $colName,
                                        'type' => 'varchar',
                                        'nullable' => true
                                    ];
                                }
                            }
                        }
                        $hasId = false;
                        foreach ($parsedColumns as $pc) {
                            if ($pc['name'] === 'id') { $hasId = true; break; }
                        }
                        if (!$hasId) {
                            array_unshift($parsedColumns, ['name' => 'id', 'type' => 'bigint', 'nullable' => false]);
                        }
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
