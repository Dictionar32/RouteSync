/**
 * resourceDiscovery.ts
 *
 * PHP code snippet for resource patterns regex matching and manifest fallback.
 *
 * @module cli/commands/annotate/template
 */

export function buildResourceDiscoverySnippet(): string {
    return `        // Resource discovery is downstream projection only.
        // The manifest is the materialized upstream semantic contract; source
        // regexes must not reconstruct Resource/Response meaning in the CLI.
        $resourceName = null;
        $collection = false;
        $modelFromManifest = null;

        $manifestPath = getcwd() . '/routesync.manifest.json';
        if (file_exists($manifestPath)) {
            $manifest = json_decode(file_get_contents($manifestPath), true);
            if (isset($manifest['routes'])) {
                $routeUri = '/' . preg_replace('/^api\\//', '', $route->uri());
                foreach ($manifest['routes'] as $mr) {
                    $manifestRoutePath = preg_replace('/\\{[^}]+\\}/', '{}', $mr['path']);
                    $routePath = preg_replace('/\\{[^}]+\\}/', '{}', $routeUri);
                    if ($manifestRoutePath !== $routePath || !in_array(strtoupper($mr['method']), $methods)) continue;

                    $resolved = $mr['response']['resolved'] ?? $mr['response']['semantic'] ?? null;
                    if (!$resolved || ($resolved['status'] ?? null) !== 'resolved') continue;

                    $resourceName = $resolved['resource'] ?? null;
                    $modelFromManifest = $resolved['model'] ?? null;
                    $collection = !empty($resolved['collection']) || !empty($mr['response']['collection']);
                    break;
                }
            }
        }

        if (!$resourceName && !$modelFromManifest) continue;
`;
}
