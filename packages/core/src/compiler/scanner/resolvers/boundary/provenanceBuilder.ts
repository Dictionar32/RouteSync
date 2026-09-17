/**
 * provenanceBuilder.ts
 *
 * Builds RouteProvenanceContract from sparse route parameters.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import { RouteProvenanceContract } from "../../../../types/route";
import { RouteBoundaryOptions } from "./boundaryBasics";

export function buildRouteProvenanceContract(params: RouteBoundaryOptions): RouteProvenanceContract {
    return Object.freeze({
        sourceFile: params.sourceFile,
        sourceLine: params.sourceLine,
        uri: params.path
    });
}
