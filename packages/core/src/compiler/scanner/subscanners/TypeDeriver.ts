/**
 * TypeDeriver.ts
 *
 * Canonical Facade for RequestType[] and ObjectType[] semantic AST derivation.
 * Pure thin orchestrator delegating to specialized sub-derivers:
 *   - RequestTypeDeriver (Request & form action streams)
 *   - SemanticTypeDeriver (Response & model object streams)
 *
 * @module core/compiler/scanner/subscanners/TypeDeriver
 */

import type { ModelAst, ResourceAst, RequestAst } from "../../../types/upstream/ast";
import type { RouteSemanticFlow } from "../../../types/route";
import { RequestType } from "../../artifacts/RequestTypesArtifact";
import { ObjectType } from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";

import { RequestTypeDeriver } from "./RequestTypeDeriver";
import { SemanticTypeDeriver } from "./SemanticTypeDeriver";

export class TypeDeriver {
    /**
     * Derives Canonical RequestType[] AST streams from parsed routes and resources.
     */
    public static deriveRequestTypes(
        routes: readonly RouteSemanticFlow[] = [],
        resources: readonly ResourceAst[] = [],
        requests: readonly RequestAst[] = [],
        interner: TypeInterner = TypeInterner.create()
    ): readonly RequestType[] {
        return RequestTypeDeriver.derive(routes, resources, requests, interner);
    }

    /**
     * Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static deriveSemanticTypes(
        resources: readonly ResourceAst[] = [],
        models: readonly ModelAst[] = [],
        interner: TypeInterner = TypeInterner.create(),
        routes: readonly RouteSemanticFlow[] = []
    ): readonly ObjectType[] {
        return SemanticTypeDeriver.derive(resources, models, interner, routes);
    }
}
