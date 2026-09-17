/**
 * RequestTypeDeriver.ts
 *
 * Active Consumer Orchestrator for RequestType derivation.
 * Pure flow declaration: routes + resources + models → DerivationContext → aggregate groups.
 *
 * @module core/compiler/scanner/subscanners/RequestTypeDeriver
 */

import {
    ParsedRoute,
    ParsedModel,
    ParsedResource
} from "../../../types/route";
import { RequestType } from "../../artifacts/RequestTypesArtifact";
import { TypeInterner } from "../../types/TypeInterner";
import {
    createDerivationContext,
    aggregateRequestTypeGroups
} from "./request-deriver";

export class RequestTypeDeriver {
    /**
     * Derives Canonical RequestType[] AST streams from parsed routes and resources.
     * Pure Flow Declaration (Active Consumer Orchestrator).
     */
    public static derive(
        routes: readonly ParsedRoute[] = [],
        resources: readonly ParsedResource[] = [],
        interner: TypeInterner = new TypeInterner(),
        models: readonly ParsedModel[] = []
    ): readonly RequestType[] {
        const ctx = createDerivationContext(resources, interner);
        return aggregateRequestTypeGroups(routes, resources, ctx);
    }
}

/**
 * Pure Functional Lowerer: (routes, resources, interner, models) → RequestType[]
 */
export function deriveRequestTypes(
    routes: readonly ParsedRoute[] = [],
    resources: readonly ParsedResource[] = [],
    interner: TypeInterner = new TypeInterner(),
    models: readonly ParsedModel[] = []
): readonly RequestType[] {
    return RequestTypeDeriver.derive(routes, resources, interner, models);
}
