<?php

class SummaryDto {}
class PaymentService {
    /**
     * @return SummaryDto
     */
    public function getSummary() {}

    public function getStatus(): string {}
}

$symbolTable = [
    'service' => ['kind' => 'class', 'class' => 'PaymentService']
];

function extractMethodReturnType($text, $symbolTable) {
    if (preg_match('/\$([a-zA-Z0-9_]+)((?:->|\?->)[a-zA-Z0-9_]+)*->([a-zA-Z0-9_]+)\s*\(/', $text, $m)) {
        $varName = $m[1];
        $methodName = $m[3];
        
        if (isset($symbolTable[$varName]) && isset($symbolTable[$varName]['class'])) {
            $className = $symbolTable[$varName]['class'];
            if (class_exists($className)) {
                try {
                    $ref = new ReflectionMethod($className, $methodName);
                    
                    // 1. Native Return Type
                    $rt = $ref->getReturnType();
                    if ($rt) {
                        return ['kind' => 'resolved_method', 'type' => $rt->getName(), 'confidence' => 100, 'source' => "native_return:$className::$methodName"];
                    }
                    
                    // 2. PHPDoc Return Type
                    $doc = $ref->getDocComment();
                    if ($doc && preg_match('/@return\s+([a-zA-Z0-9_\\\\]+)/', $doc, $docM)) {
                        return ['kind' => 'resolved_method', 'type' => $docM[1], 'confidence' => 90, 'source' => "phpdoc_return:$className::$methodName"];
                    }
                } catch (\Exception $e) {}
            }
        }
        
        return ['kind' => 'method_call', 'variable' => $varName, 'method' => $methodName, 'confidence' => 50, 'source' => 'ast:method_call'];
    }
    return null;
}

print_r(extractMethodReturnType('$service->getSummary()', $symbolTable));
print_r(extractMethodReturnType('$service->getStatus()', $symbolTable));
print_r(extractMethodReturnType('$unknown->getSomething()', $symbolTable));
