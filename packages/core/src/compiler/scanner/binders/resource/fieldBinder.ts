/**
 * fieldBinder.ts
 *
 * Central dispatcher for binding an individual array entry AST value directly into Bound AST & field descriptor.
 *
 * @module core/compiler/scanner/binders/resource/fieldBinder
 */

import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { PhpAstValue } from "../../lexer/PhpAst";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import { bindWhenLoadedField } from "./whenLoadedBinder";
import { bindPropertyAccessField } from "./propertyAccessBinder";
import {
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindFallbackField
} from "./compositeBinders";

export function bindField({
    key,
    value,
    rawExpression,
    modelSymbol,
    modelSymbolTable
}: {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly rawExpression: string;
    readonly modelSymbol?: OriginModelSymbol;
    readonly modelSymbolTable: ModelSymbolTable;
}): BoundResourceFieldResult {
    // 1. whenLoaded Method Call
    if (value.kind === 'method_chain' && value.property === 'whenLoaded') {
        return bindWhenLoadedField(key, rawExpression, modelSymbol);
    }

    // 2. Property Access or regular Method Chain
    if (value.kind === 'property_access' || value.kind === 'method_chain') {
        return bindPropertyAccessField(key, value.property, value.nullsafe, modelSymbol);
    }

    // 3. Direct Resource Single / Collection
    if (value.kind === 'resource_single' || value.kind === 'resource_collection') {
        return bindResourceCollectionField(key, value, modelSymbol);
    }

    // 4. Nested Array
    if (value.kind === 'nested_array') {
        return bindNestedArrayField(key, value, modelSymbol, modelSymbolTable, bindField);
    }

    // 5. Literals
    if (value.kind === 'literal') {
        return bindLiteralField(key, value);
    }

    // 6. Ternary Expression
    if (value.kind === 'ternary_expression') {
        return bindTernaryField(key, value, modelSymbol, modelSymbolTable, bindField);
    }

    // 7. Fallback / Raw Expression
    return bindFallbackField(key, rawExpression);
}
