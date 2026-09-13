/**
 * routePathParser.ts
 *
 * Path parameter extraction and route path normalization.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import { RouteParameter } from "../../../../types/route";
import { ScannedRouteParameterDescriptor } from "../../descriptors/routeDescriptors";

export function extractPathParams(routePath: string): readonly RouteParameter[] {
    const matches = [...routePath.matchAll(/\{([^}]+)\}/g)];
    return matches.map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]));
}

export function normalizeRoutePath(
    rawPath: string,
    prefixStack: readonly string[]
): { normalizedPath: string; resourceName: string } {
    const cleanRaw = rawPath.replace(/^\/+|\/+$/g, '');
    const combinedPrefix = prefixStack.filter(Boolean).join('/');
    const fullPath = combinedPrefix ? `/${combinedPrefix}/${cleanRaw}` : `/${cleanRaw}`;
    const normalizedPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;

    const segments = normalizedPath.split('/').filter(s => s && s !== 'api' && !s.startsWith('{'));
    const resourceName = segments[0] || 'general';

    return { normalizedPath, resourceName };
}
