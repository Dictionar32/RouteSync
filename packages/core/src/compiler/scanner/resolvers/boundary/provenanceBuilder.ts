/**
 * provenanceBuilder.ts
 *
 * Builds RouteProvenanceContract from sparse route parameters.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import { RouteProvenanceContract } from "../../../../types/route";
import { SparseRouteParams } from "./boundaryBasics";

export function buildRouteProvenanceContract(params: SparseRouteParams): RouteProvenanceContract {
    return Object.freeze({
        sourceFile: params.sourceFile ? params.sourceFile : "",
        sourceLine: params.sourceLine ? params.sourceLine : 0,
        uri: params.path
    });
}
