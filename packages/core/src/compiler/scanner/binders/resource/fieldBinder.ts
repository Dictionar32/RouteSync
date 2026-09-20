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
import { matchPhpAccessMode, matchPhpPropertyPath } from "../../lexer/phpAstAlgebra";
import { matchResourceOperationKind, resourceOperationKindForMethod } from "../../../../types/upstream/resourceVocabulary";
import { matchLookup } from "../../../../types/upstream/collections";
import {
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindFallbackField
} from "./compositeBinders";

function bindPropertyAccessWithAccess(
    key: string,
    property: string,
    access: import("../../lexer/phpAstExpressionTypes").PhpAccessMode,
    modelSymbol: OriginModelSymbol
): BoundResourceFieldResult {
    return matchPhpAccessMode(access, {
        direct: () => bindPropertyAccessField(key, property, false, modelSymbol),
        nullsafe: () => bindPropertyAccessField(key, property, true, modelSymbol),
    });
}

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
            when_loaded: () => matchLookup(readWhenLoadedRelation(val.arguments), {
                found: relation => bindWhenLoadedField(key, relation.value, modelSymbol),
                missing: () => bindFallbackField(key),
            }),
            when_not_null: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            merge_when: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            merge: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            additional: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            with: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            ordinary: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
        }),
        propertyAccess: (val) => matchPhpPropertyPath(val.target, {
            single: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
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
        construct: () => bindFallbackField(key),
        instanceOf: () => bindFallbackField(key),
        classReference: () => bindFallbackField(key),
        closure: () => bindFallbackField(key),
        arrowFunction: () => bindFallbackField(key),
        unsupported: () => bindFallbackField(key)
    });
}
