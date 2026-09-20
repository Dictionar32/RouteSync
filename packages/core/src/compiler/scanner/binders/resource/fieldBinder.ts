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
import { readWhenLoadedRelation } from "./whenLoadedRelationArgument";
import { bindPropertyAccessField } from "./propertyAccessBinder";
import { bindPropertyPathField } from "./propertyPathBinder";
import { matchPhpPropertyPath } from "../../lexer/phpAstAlgebra";
import { matchResourceOperationKind, resourceOperationForMethodChain } from "../../../../types/upstream/resourceVocabulary";
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
    readonly modelSymbol: OriginModelSymbol;
    readonly modelSymbolTable: ModelSymbolTable;
}): BoundResourceFieldResult {
    return matchPhpAstValue(value, {
        methodChain: (val) => matchResourceOperationKind(resourceOperationKindForMethod(val.property), {
            when_loaded: () => bindWhenLoadedField(key, readWhenLoadedRelation(val.arguments), modelSymbol),
            when_not_null: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
            merge_when: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
            merge: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
            additional: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
            with: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
            ordinary: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
        }),
        propertyAccess: (val) => matchPhpPropertyPath(val.target, {
            single: () => bindPropertyAccessField(key, val.property, val.access.kind === 'nullsafe', modelSymbol),
            chain: () => bindPropertyPathField(key, val, modelSymbol, modelSymbolTable),
        }),
        resourceSingle: (val) => bindResourceCollectionField(key, val, modelSymbol),
        resourceCollection: (val) => bindResourceCollectionField(key, val, modelSymbol),
        nestedArray: (val) => bindNestedArrayField(key, val, modelSymbol, modelSymbolTable, bindField),
        literal: (val) => bindLiteralField(key, val),
        ternaryExpression: (val) => bindTernaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        arrayAccess: () => bindFallbackField(key),
        functionCall: () => bindFallbackField(key),
        shortTernary: () => bindFallbackField(key),
        nullCoalesce: () => bindFallbackField(key),
        binaryExpression: () => bindFallbackField(key),
        unaryExpression: () => bindFallbackField(key),
        castExpression: () => bindFallbackField(key),
        matchExpression: () => bindFallbackField(key),
        variableReference: () => bindFallbackField(key),
        staticCall: () => bindFallbackField(key),
        classReference: () => bindFallbackField(key),
        closure: () => bindFallbackField(key),
        arrowFunction: () => bindFallbackField(key),
        unsupported: () => bindFallbackField(key)
    });
}
