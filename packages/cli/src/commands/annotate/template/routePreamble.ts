/**
 * routePreamble.ts
 *
 * PHP script bootstrap and route reflection preamble.
 *
 * @module cli/commands/annotate/template
 */

export function buildRoutePreamble(forceStr: string): string {
    return `<?php
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
        if ($hasResponse && !${forceStr}) continue;

        // Get method source
        $fileName = $reflector->getFileName();
        $startLine = $reflector->getStartLine();
        $endLine = $reflector->getEndLine();
        if (!$fileName || $startLine === false) continue;

        $fileLines = file($fileName);
        $methodSource = implode('', array_slice($fileLines, $startLine - 1, $endLine - $startLine + 1));

        // Find the actual "public function" line (for correct injection point)
        $funcLine = $startLine;
        for ($i = $startLine - 1; $i >= max(0, $startLine - 10); $i--) {
            if (preg_match('/^\\s*(public|protected|private)?\\s*function\\s+' . preg_quote($methodName) . '\\s*\\(/', $fileLines[$i])) {
                $funcLine = $i + 1;
                break;
            }
        }
`;
}
