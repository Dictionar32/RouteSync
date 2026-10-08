/**
 * provenanceBuilder.ts
 *
 * Builds RouteProvenanceContract from sparse route parameters.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteProvenanceContract } from "../../../../types/route";
type RouteProvenanceInput = Readonly<{
    readonly sourceFile: RouteProvenanceContract["sourceFile"];
    readonly sourceLine: RouteProvenanceContract["sourceLine"];
    readonly path: RouteProvenanceContract["uri"];
}>;

export function buildRouteProvenanceContract(params: RouteProvenanceInput): RouteProvenanceContract {
    return Object.freeze({
        sourceFile: params.sourceFile,
        sourceLine: params.sourceLine,
        uri: params.path
    });
}
