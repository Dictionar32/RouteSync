/**
 * RequestTypeDeriver.ts
 *
 * Active Consumer Orchestrator for RequestType derivation.
 * Pure flow declaration: routes + resources + models → DerivationContext → aggregate groups.
 *
 * @module core/compiler/scanner/subscanners/RequestTypeDeriver
 */

import type { RouteSemanticFlow } from "../../../types/route";
import type { ResourceAst, RequestAst } from "../../../types/upstream/ast";
import type { RequestType } from "../../artifacts/RequestTypesArtifact";
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
        routes: readonly RouteSemanticFlow[] = [],
        resources: readonly ResourceAst[] = [],
        requests: readonly RequestAst[] = [],
        interner: TypeInterner = TypeInterner.create()
    ): readonly RequestType[] {
        const ctx = createDerivationContext(resources, requests, interner);
        return aggregateRequestTypeGroups(routes, resources, ctx);
    }
}

/**
 * Pure Functional Lowerer: (routes, resources, interner) → RequestType[]
 */
export function deriveRequestTypes(
    routes: readonly RouteSemanticFlow[] = [],
    resources: readonly ResourceAst[] = [],
    requests: readonly RequestAst[] = [],
    interner: TypeInterner = TypeInterner.create()
): readonly RequestType[] {
    return RequestTypeDeriver.derive(routes, resources, requests, interner);
}
