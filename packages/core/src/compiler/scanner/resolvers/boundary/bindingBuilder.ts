/**
 * bindingBuilder.ts
 *
 * Builds RouteBindingContract from resolved boundary vocabulary.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteBindingContract } from "../../../../types/route";
import type { ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { ResolvedRouteBinding } from "../../../../types/domain/routes";

export function buildRouteBindingContract(
    params: ResolvedRouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    resolved: ResolvedRouteBinding
): RouteBindingContract {
    const responseTypeName = params.response.responseTypeName();

    const request = resolved.request;

    return Object.freeze({
        schema: params.schema,
        response: params.response,
        responseTypeName,
        operation: resolved.operation,
        request,
        runtimeReturn: params.runtimeReturn,
        semanticReturn: params.semanticReturn,
        assignments: Object.freeze([])
    });
}
