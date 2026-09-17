/**
 * fieldBinder.ts
 *
 * Central dispatcher for binding an individual array entry AST value directly into Bound AST & field descriptor.
 * Pure Catamorphic Dispatcher: 0 'if', 0 'switch'.
 *
 * @module core/compiler/scanner/binders/resource/fieldBinder
 */

import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { type PhpAstValue, matchPhpAstValue } from "../../lexer/PhpAst";
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
    modelSymbol,
    modelSymbolTable
}: {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly modelSymbol?: OriginModelSymbol;
    readonly modelSymbolTable: ModelSymbolTable;
}): BoundResourceFieldResult {
    return matchPhpAstValue(value, {
        methodChain: (val) => val.property === 'whenLoaded'
            ? bindWhenLoadedField(key, val.arguments, modelSymbol)
            : bindPropertyAccessField(key, val.property, val.nullsafe, modelSymbol),
        propertyAccess: (val) => bindPropertyAccessField(key, val.property, val.nullsafe, modelSymbol),
        resourceSingle: (val) => bindResourceCollectionField(key, val, modelSymbol),
        resourceCollection: (val) => bindResourceCollectionField(key, val, modelSymbol),
        nestedArray: (val) => bindNestedArrayField(key, val, modelSymbol, modelSymbolTable, bindField),
        literal: (val) => bindLiteralField(key, val),
        ternaryExpression: (val) => bindTernaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        variableReference: () => bindFallbackField(key),
        staticCall: () => bindFallbackField(key),
        classReference: () => bindFallbackField(key),
        closure: () => bindFallbackField(key),
        arrowFunction: () => bindFallbackField(key),
        unsupported: () => bindFallbackField(key)
    });
}
