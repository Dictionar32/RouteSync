/**
 * bindingBuilder.ts
 *
 * Builds RouteBindingContract from resolved boundary vocabulary.
 *
 * @module core/compiler/semantic/route-boundary
 */

import type { RouteBindingContract } from "../../../types/route";
import type { ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { ResolvedRouteBinding } from "../../../types/domain/routes";

function buildRouteBindingContractImplementation(
    params: ResolvedRouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    resolved: ResolvedRouteBinding
): RouteBindingContract {
    const responseTypeName = params.response.responseTypeName();

    const request = resolved.request;

    return Object.freeze({
        schema: params.schema,
        schemaEvidence: params.schemaEvidence,
        response: params.response,
        responseProjection: params.responseProjection,
        responseTypeName,
        operation: resolved.operation,
        request,
        runtimeReturn: params.runtimeReturn,
        semanticReturn: params.semanticReturn,
        assignments: Object.freeze([])
    });
}


export interface RouteBindingContractBuilderInterface {
    readonly build: (
        params: ResolvedRouteBoundaryOptions,
        basics: IntermediateRouteBoundaryBasics,
        resolved: ResolvedRouteBinding,
    ) => RouteBindingContract;
}

export const routeBindingContractBuilder: RouteBindingContractBuilderInterface = Object.freeze({
    build: buildRouteBindingContractImplementation,
});
