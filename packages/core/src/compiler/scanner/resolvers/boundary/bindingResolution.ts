/**
 * bindingResolution.ts
 *
 * Resolves boundary binding vocabulary before contract construction.
 */

import type { RouteRequestBinding } from "../../../../types/domain/request";


export interface ResolvedRouteBinding {
    readonly request: RouteRequestBinding;
}

export function resolveRouteBinding(
    params: Readonly<{ readonly request: RouteRequestBinding }>
): ResolvedRouteBinding {
    return Object.freeze({
        request: params.request
    });
}
