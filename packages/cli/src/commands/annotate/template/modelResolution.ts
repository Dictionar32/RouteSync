/**
 * modelResolution.ts
 *
 * PHP code snippet for Model class resolution and final result encoding.
 *
 * @module cli/commands/annotate/template
 */

export function buildModelResolutionSnippet(): string {
    return `        // Resolve model from Resource @mixin docblock or from manifest
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
`;
}
