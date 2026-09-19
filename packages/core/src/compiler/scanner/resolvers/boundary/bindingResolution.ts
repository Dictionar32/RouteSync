/**
 * bindingResolution.ts
 *
 * Resolves boundary binding vocabulary before contract construction.
 */

import type { FormRequestDescriptor } from "../../../../types/route";
import type { RouteBoundaryOptions } from "./boundaryBasicsTypes";

export interface ResolvedRouteBinding {
    readonly formRequests: readonly FormRequestDescriptor[];
}

export function resolveRouteBinding(
    params: RouteBoundaryOptions
): ResolvedRouteBinding {
    return Object.freeze({
        formRequests: Object.freeze([...params.formRequests])
    });
}
