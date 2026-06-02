const fs = require('fs');

let content = fs.readFileSync('packages/cli/src/parsers/LaravelRouteParser.ts', 'utf8');

const oldElseBlock = `            } else {
                // We are expecting a value
                if (is_string($token) && $token === '[') {
                    continue;
                }
                
                $valLower = strtolower($text);
                if ($valLower === 'true' || $valLower === 'false') {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'boolean'];
                } elseif ($valLower === 'null') {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'null'];
                } elseif ($id === T_LNUMBER || $id === T_DNUMBER) {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'number'];
                } elseif ($id === T_CONSTANT_ENCAPSED_STRING) {
                    $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'string'];
                } elseif ($id === T_VARIABLE) {
                    $varName = ltrim($text, '$');
                    $isPropertyAccess = false;
                    $tempIdx = $index + 1;
                    while ($tempIdx < count($tokens)) {
                        $t = $tokens[$tempIdx];
                        if (is_array($t) && $t[0] === T_OBJECT_OPERATOR) {
                            $isPropertyAccess = true;
                            break;
                        } elseif (is_array($t) && $t[0] === T_WHITESPACE) {
                            $tempIdx++;
                            continue;
                        }
                        break;
                    }
                    if ($isPropertyAccess) {
                        $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'unknown'];
                    } elseif (isset($symbolTable[$varName])) {
                        $fields[$currentKey] = $symbolTable[$varName];
                    } else {
                        $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'unknown'];
                    }
                } elseif ($id === T_STRING) {
                    if ($valLower === 'auth') {
                        $fields[$currentKey] = ['kind' => 'model', 'model' => 'User', 'collection' => false];
                    } elseif (preg_match('/^[A-Z][a-zA-Z0-9_]+Resource$/', $text)) {
                        $tempIdx = $index + 1;
                        $isCollection = false;
                        while ($tempIdx < count($tokens)) {
                            $t = $tokens[$tempIdx];
                            if (is_array($t) && $t[0] === T_DOUBLE_COLON) {
                                $next = $tokens[$tempIdx+1] ?? null;
                                if ($next && is_array($next) && strtolower($next[1]) === 'collection') {
                                    $isCollection = true;
                                }
                                break;
                            } elseif (is_array($t) && $t[0] === T_WHITESPACE) {
                                $tempIdx++;
                                continue;
                            }
                            break;
                        }
                        $fields[$currentKey] = ['kind' => 'resource', 'resource' => $text, 'collection' => $isCollection];
                    } else {
                        // Fallback check for Model::...
                        if (preg_match('/^[A-Z][a-zA-Z0-9_]+$/', $text)) {
                            $tempIdx = $index + 1;
                            $isModelCall = false;
                            while ($tempIdx < count($tokens)) {
                                $t = $tokens[$tempIdx];
                                if (is_array($t) && $t[0] === T_DOUBLE_COLON) {
                                    $isModelCall = true;
                                    break;
                                } elseif (is_array($t) && $t[0] === T_WHITESPACE) {
                                    $tempIdx++;
                                    continue;
                                }
                                break;
                            }
                            if ($isModelCall) {
                                $fields[$currentKey] = ['kind' => 'model', 'model' => $text, 'collection' => false];
                            } else {
                                $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'unknown'];
                            }
                        } else {
                            $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'unknown'];
                        }
                    }
                } else {
                    // Try to guess based on structure, fallback to unknown
                    if (!isset($fields[$currentKey])) {
                        $fields[$currentKey] = ['kind' => 'primitive', 'type' => 'unknown'];
                    }
                }
                
                // Advance to comma or array end
                while ($index < count($tokens)) {
                    $t = $tokens[$index];
                    if (is_string($t) && ($t === ',' || $t === ']')) {
                        break;
                    }
                    $index++;
                }
                $currentKey = null;
            }`;

const newElseBlock = `            } else {
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
                    $fields[$currentKey] = ['kind' => 'raw_code', 'code' => $code];
                }
                
                $currentKey = null;
                continue;
            }`;

content = content.replace(oldElseBlock, newElseBlock);
if (!content.includes('raw_code')) {
    console.error("Replacement failed!");
    process.exit(1);
}

// Add stderr to spawnSync error logging
content = content.replace(
    "let outputStr = result.stdout",
    "let outputStr = result.stdout ? result.stdout.toString() : '';\\n      let stderrStr = result.stderr ? result.stderr.toString() : '';"
);
content = content.replace(
    "if (!outputStr || outputStr.trim() === '') {\\n        throw new Error('No JSON output from PHP script')",
    "if (!outputStr || outputStr.trim() === '') {\\n        throw new Error('No JSON output from PHP script. stderr: ' + stderrStr)"
);

content = content.replace(
    "const resultJson = JSON.parse(outputStr)\\n\\n      return resultJson",
    "try {\\n        return JSON.parse(outputStr)\\n      } catch (err: any) {\\n        console.log(\\"PHP OUTPUT STR WAS:\\", outputStr);\\n        throw new Error('No JSON output from PHP script: ' + err.message)\\n      }"
);


fs.writeFileSync('packages/cli/src/parsers/LaravelRouteParser.ts', content);
console.log("Success");
