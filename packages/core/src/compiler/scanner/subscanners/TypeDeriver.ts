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

import type { ModelAst } from "../../../types/upstream/ast";
import {
    ParsedRoute,
    ParsedResource
} from "../../../types/route";
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
        routes: readonly ParsedRoute[] = [],
        resources: readonly ParsedResource[] = [],
        interner: TypeInterner = new TypeInterner(),
        models: readonly ModelAst[] = []
    ): readonly RequestType[] {
        return RequestTypeDeriver.derive(routes, resources, interner);
    }

    /**
     * Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static deriveSemanticTypes(
        resources: readonly ParsedResource[] = [],
        models: readonly ModelAst[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        return SemanticTypeDeriver.derive(resources, models, interner, routes);
    }
}
