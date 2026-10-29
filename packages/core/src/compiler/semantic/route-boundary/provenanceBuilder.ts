/**
 * provenanceBuilder.ts
 *
 * Builds RouteProvenanceContract from sparse route parameters.
 *
 * @module core/compiler/semantic/route-boundary
 */

import type { RouteProvenanceContract } from "../../../types/route";
import type { SourceSpan } from "../../../types/upstream/provenance";
export type RouteProvenanceInput = Readonly<{
    readonly sourceFile: RouteProvenanceContract["sourceFile"];
    readonly sourceLine: RouteProvenanceContract["sourceLine"];
    readonly path: RouteProvenanceContract["uri"];
    readonly sourceSpan: SourceSpan;
}>;

function buildRouteProvenanceContractImplementation(params: RouteProvenanceInput): RouteProvenanceContract {
    return Object.freeze({
        sourceFile: params.sourceFile,
        sourceLine: params.sourceLine,
        uri: params.path,
        declarationSpan: params.sourceSpan
    });
}


export interface RouteProvenanceContractBuilderInterface {
    readonly build: (params: RouteProvenanceInput) => RouteProvenanceContract;
}

export const routeProvenanceContractBuilder: RouteProvenanceContractBuilderInterface = Object.freeze({
    build: buildRouteProvenanceContractImplementation,
});
