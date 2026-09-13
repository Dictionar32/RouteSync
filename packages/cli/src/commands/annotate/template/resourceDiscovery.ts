/**
 * resourceDiscovery.ts
 *
 * PHP code snippet for resource patterns regex matching and manifest fallback.
 *
 * @module cli/commands/annotate/template
 */

export function buildResourceDiscoverySnippet(): string {
    return `        // Resource Discovery — support multiple return patterns
        $resourceName = null;
        $collection = false;

        $patterns = [
            // XxxResource::collection(...)
            '/([a-zA-Z0-9_]+Resource)::collection/' => ['collection' => true],
            // new XxxResource(...)
            '/new\\s+([a-zA-Z0-9_]+Resource)\\s*\\(/' => ['collection' => false],
            // response()->json(new XxxResource(...))
            '/response\\(\\)->json\\(\\s*new\\s+([a-zA-Z0-9_]+Resource)/' => ['collection' => false],
            // response()->json(XxxResource::collection(...))
            '/response\\(\\)->json\\(\\s*([a-zA-Z0-9_]+Resource)::collection/' => ['collection' => true],
            // JsonResponse: return new JsonResponse(new XxxResource(...))
            '/JsonResponse\\(\\s*new\\s+([a-zA-Z0-9_]+Resource)/' => ['collection' => false],
        ];

        foreach ($patterns as $pattern => $meta) {
            if (preg_match($pattern, $methodSource, $m)) {
                $resourceName = $m[1];
                $collection = $meta['collection'];
                break;
            }
        }

        // Fallback: check routesync manifest for resolved response types
        $modelFromManifest = null;
        if (!$resourceName) {
            $manifestPath = getcwd() . '/routesync.manifest.json';
            if (file_exists($manifestPath)) {
                $manifest = json_decode(file_get_contents($manifestPath), true);
                if (isset($manifest['routes'])) {
                    $routeUri = '/' . preg_replace('/^api\\//', '', $route->uri());
                    foreach ($manifest['routes'] as $mr) {
                        $manifestRoutePath = preg_replace('/\\{[^}]+\\}/', '{}', $mr['path']);
                        $routePath = preg_replace('/\\{[^}]+\\}/', '{}', $routeUri);
                        if ($manifestRoutePath === $routePath && in_array(strtoupper($mr['method']), $methods)) {
                            $resolved = $mr['response']['resolved'] ?? $mr['response']['semantic'] ?? null;
                            if ($resolved && $resolved['status'] === 'resolved' && !empty($resolved['model'])) {
                                $modelFromManifest = $resolved['model'];
                                $collection = !empty($resolved['collection']) || !empty($mr['response']['collection']);
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (!$resourceName && !$modelFromManifest) continue;
`;
}
