/**
 * routePathParser.ts
 *
 * Resolves raw Laravel route paths into one canonical route-path value.
 *
 * @module compiler/scanner/subscanners/route-scanner
 */

import type { RouteParameter } from "../../../../types/upstream/route";
import { createRoutePath, type RoutePath } from "../../../../types/upstream/names";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { ResourceName } from "../../../../types/upstream/names";
import { RouteParameterSemanticFactory } from "../../descriptors/routeDescriptors";
import { relationGate, relationProject, relationSelect, relationResolve, relationAll } from "../../../relational/sequence";
import { relationTextStartsWith, relationTextFields, relationTextTrimChars, relationTextTrimEndChars } from "../../../../semantic/kernel/relationalSequence";
import { relationNotEqual } from "../../../../semantic/kernel/semanticRelations";

export interface ResolvedRoutePath {
    readonly path: RoutePath;
    readonly resourceName: ResourceName;
    readonly parameters: readonly RouteParameter[];
}

const boundaryPath = (rawPath: string): string => relationTextTrimEndChars(relationTextTrimChars(rawPath, ['/']), ['/']);
const prefixPath = (prefixStack: readonly string[]): string =>
    relationProject(relationSelect(prefixStack, value => value.length > 0), value => value).join('/');
const joinPath = (prefix: string, path: string): string =>
    relationGate(prefix.length > 0, () => `/${prefix}/${path}`, () => `/${path}`);
const apiPath = (path: string): string =>
    relationGate(relationTextStartsWith(path, '/api'), () => path, () => `/api${path}`);

export function resolveRoutePath(
    rawPath: string,
    prefixStack: readonly string[]
): ResolvedRoutePath {
    const cleanRaw = boundaryPath(rawPath);
    const combinedPrefix = prefixPath(prefixStack);
    const normalizedPath = apiPath(joinPath(combinedPrefix, cleanRaw));
    const segments = relationProject(
        relationSelect(
            relationTextFields(normalizedPath, '/'),
            segment => relationAll([segment.length > 0, relationNotEqual(segment, 'api'), relationNotEqual(relationTextStartsWith(segment, '{'), true)]),
        ),
        segment => segment,
    );
    const resourceName = SemanticValueFactory.resourceName(
        relationResolve(segments.length > 0, () => segments[0], () => 'general'),
    );
    const path = createRoutePath(normalizedPath);

    return Object.freeze({
        path,
        resourceName,
        parameters: extractPathParams(path),
    });
}

export function extractPathParams(routePath: RoutePath): readonly RouteParameter[] {
    const matches = [...routePath.value.value.matchAll(/\{([^}]+)\}/g)];
    return Object.freeze(relationProject(matches, match => RouteParameterSemanticFactory.fromPathSegment(match[1])));
}

/** @deprecated Use resolveRoutePath. */
export function normalizeRoutePath(
    rawPath: string,
    prefixStack: readonly string[],
): { normalizedPath: RoutePath; resourceName: ResourceName } {
    const resolved = resolveRoutePath(rawPath, prefixStack);
    return { normalizedPath: resolved.path, resourceName: resolved.resourceName };
}
