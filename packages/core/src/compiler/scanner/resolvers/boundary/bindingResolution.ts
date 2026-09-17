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
    const formRequests = params.formRequests.map(formRequest =>
        typeof formRequest === "string"
            ? Object.freeze({
                name: formRequest,
                sourceFile: `app/Http/Requests/${formRequest}.php`
            })
            : formRequest
    );

    return Object.freeze({
        formRequests: Object.freeze(formRequests)
    });
}
