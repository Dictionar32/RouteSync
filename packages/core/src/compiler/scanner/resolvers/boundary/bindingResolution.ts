/**
 * bindingResolution.ts
 *
 * Resolves boundary binding vocabulary before contract construction.
 */

import type { RouteRequestBinding } from "../../../../types/domain/request";
import type { RouteBoundaryOptions } from "./boundaryBasicsTypes";

export interface ResolvedRouteBinding {
    readonly request: RouteRequestBinding;
}

export function resolveRouteBinding(
    params: RouteBoundaryOptions
): ResolvedRouteBinding {
    return Object.freeze({
        request: params.request
    });
}
