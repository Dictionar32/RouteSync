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
import type { PhpStatement } from "../lexer/phpAstTypes";
import type { ModelName, ResourceName, SourceFile } from "../../../types/upstream/names";
import type { ResourceAst } from "../../../types/upstream/ast";
import {
    bindResource,
    bindField,
    bindWhenLoadedField,
    bindPropertyAccessField,
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindBinaryField,
    bindNullCoalesceField,
    bindFallbackField,
    bindResourceDefinition
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
    bindBinaryField,
    bindNullCoalesceField,
    bindFallbackField,
    bindResourceDefinition
};

/**
 * Orchestrator class providing static entry points for resource and field binding.
 */
export class SemanticResourceBinder {
    /**
     * Binds a full Resource definition and its AST array entries to a ModelSymbol.
     */
    public static bindResource(params: {
        readonly resourceName: ResourceName;
        readonly entries: readonly PhpArrayEntry[];
        readonly sourceFile: SourceFile;
        readonly sourceLine: number;
        readonly modelSymbolTable: ModelSymbolTable;
        readonly controllerDataflowMap?: import("../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
        readonly relationPropagationMap?: ReadonlyMap<ResourceName, ModelName>;
        readonly assignments?: readonly PhpStatement[];
    }): ParsedResource {
        return bindResource(params);
    }

    /** Canonical AST producer: binds source semantics directly into ResourceAst without ParsedResource. */
    public static bindResourceAst(params: Parameters<typeof bindResourceDefinition>[0]): ResourceAst {
        return bindResourceDefinition(params);
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
