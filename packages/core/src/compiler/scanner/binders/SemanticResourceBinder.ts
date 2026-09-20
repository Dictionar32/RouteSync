/**
 * SemanticResourceBinder.ts
 *
 * Active Consumer Orchestrator for Direct Semantic Binding for Laravel JsonResources.
 * Binds PHP AST Expressions directly to Model Symbols without downstream guessing.
 *
 * @module core/compiler/scanner/binders
 */

import type { ModelSymbolTable, OriginModelSymbol } from "../symbols/ModelSymbolTable";
import type { PhpAstValue, PhpArrayEntry } from "../lexer/PhpAst";
import type { ResourceFieldDescriptor, ParsedResource } from "../../../types/route";
import type { BoundSemanticNode } from "../../../types/domain/boundAst";
import {
    bindResource,
    bindField,
    bindWhenLoadedField,
    bindPropertyAccessField,
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindFallbackField
} from "./resource";

export interface BoundResourceFieldResult {
    readonly descriptor: ResourceFieldDescriptor;
    readonly boundAst: BoundSemanticNode;
}

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export {
    bindResource,
    bindField,
    bindWhenLoadedField,
    bindPropertyAccessField,
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindFallbackField
};

/**
 * Orchestrator class providing static entry points for resource and field binding.
 */
export class SemanticResourceBinder {
    /**
     * Binds a full Resource definition and its AST array entries to a ModelSymbol.
     */
    public static bindResource(params: {
        readonly resourceName: string;
        readonly entries: readonly PhpArrayEntry[];
        readonly sourceFile: string;
        readonly sourceLine: number;
        readonly modelSymbolTable: ModelSymbolTable;
        readonly controllerDataflowMap?: import("../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
        readonly relationPropagationMap?: ReadonlyMap<string, string>;
    }): ParsedResource {
        return bindResource(params);
    }

    /**
     * Binds an individual array entry AST value directly into a complete Bound AST node & field descriptor.
     */
    public static bindField(params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }): BoundResourceFieldResult {
        return bindField(params);
    }
}
