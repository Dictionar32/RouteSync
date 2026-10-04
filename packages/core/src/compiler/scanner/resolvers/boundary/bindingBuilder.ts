/**
 * bindingBuilder.ts
 *
 * Builds RouteBindingContract from resolved boundary vocabulary.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteBindingContract } from "../../../../types/route";
import type { ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { ResolvedRouteBinding } from "./bindingResolution";

export function buildRouteBindingContract(
    params: ResolvedRouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    resolved: ResolvedRouteBinding
): RouteBindingContract {
    const responseTypeName = params.response.responseTypeName();

    const request = resolved.request;

    return Object.freeze({
        handler: params.handler,
        action: basics.resolvedAction,
        actionName: basics.resolvedActionName,
        controllerName: basics.resolvedControllerName,
        schema: params.schema,
        response: params.response,
        responseTypeName,
        request,
        runtimeReturn: params.runtimeReturn,
        semanticReturn: params.semanticReturn,
        assignments: Object.freeze([])
    });
}
