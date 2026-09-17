/**
 * routePathParser.ts
 *
 * Resolves raw Laravel route paths into one canonical route-path value.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import type { RouteParameter } from "../../../../types/route";
import { createRoutePath, type RoutePath } from "../../../../types/domain/routeEntityDefinition";
import { ScannedRouteParameterDescriptor } from "../../descriptors/routeDescriptors";

export interface ResolvedRoutePath {
    readonly path: RoutePath;
    readonly resourceName: string;
    readonly parameters: readonly RouteParameter[];
}

export function resolveRoutePath(
    rawPath: string,
    prefixStack: readonly string[]
): ResolvedRoutePath {
    const cleanRaw = rawPath.replace(/^\/+|\/+$/g, '');
    const combinedPrefix = prefixStack.filter(Boolean).join('/');
    const fullPath = combinedPrefix ? `/${combinedPrefix}/${cleanRaw}` : `/${cleanRaw}`;
    const normalizedPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;
    const segments = normalizedPath.split('/').filter(
        segment => segment && segment !== 'api' && !segment.startsWith('{')
    );
    const resourceName = segments[0] || 'general';
    const path = createRoutePath(normalizedPath);

    return Object.freeze({
        path,
        resourceName,
        parameters: extractPathParams(path)
    });
}

export function extractPathParams(routePath: string): readonly RouteParameter[] {
    const matches = [...routePath.matchAll(/\{([^}]+)\}/g)];
    return Object.freeze(matches.map(match => ScannedRouteParameterDescriptor.fromPathSegment(match[1])));
}

/** @deprecated Use resolveRoutePath. */
export function normalizeRoutePath(
    rawPath: string,
    prefixStack: readonly string[]
): { normalizedPath: RoutePath; resourceName: string } {
    const resolved = resolveRoutePath(rawPath, prefixStack);
    return { normalizedPath: resolved.path, resourceName: resolved.resourceName };
}
