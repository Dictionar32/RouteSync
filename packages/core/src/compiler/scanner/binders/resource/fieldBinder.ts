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
    bindBinaryField,
    bindNullCoalesceField,
    bindShortTernaryField,
    bindCastField,
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

function resolveVariableRoot(
    value: PhpAstValue,
    definitions: ReadonlyMap<string, PhpAstValue>,
    visited: ReadonlySet<string> = new Set()
): PhpAstValue {
    if (value.kind === 'variable_reference') {
        const name = value.name.value;
        const definition = definitions.get(name);
        if (!definition || visited.has(name)) return value;
        return resolveVariableRoot(definition, definitions, new Set([...visited, name]));
    }
    return value;
}

function resolveVariableReceivers(
    value: PhpAstValue,
    definitions: ReadonlyMap<string, PhpAstValue>,
    visited: ReadonlySet<string> = new Set()
): PhpAstValue {
    switch (value.kind) {
        case 'variable_reference':
            return resolveVariableRoot(value, definitions, visited);
        case 'property_access':
            return { ...value, receiver: resolveVariableRoot(value.receiver, definitions, visited) };
        case 'method_chain':
            return { ...value, receiver: resolveVariableRoot(value.receiver, definitions, visited) };
        case 'array_access':
            return { ...value, target: resolveVariableReceivers(value.target, definitions, visited), index: resolveVariableReceivers(value.index, definitions, visited) };
        case 'function_call':
            return { ...value, arguments: value.arguments.map(argument => ({ ...argument, value: resolveVariableReceivers(argument.value, definitions, visited) })) };
        case 'resource_single':
        case 'resource_collection':
        case 'literal':
        case 'class_reference':
        case 'unsupported':
            return value;
        case 'ternary_expression':
            return { ...value, condition: resolveVariableReceivers(value.condition, definitions, visited), trueBranch: resolveVariableReceivers(value.trueBranch, definitions, visited), falseBranch: resolveVariableReceivers(value.falseBranch, definitions, visited) };
        case 'short_ternary':
            return { ...value, condition: resolveVariableReceivers(value.condition, definitions, visited), falseBranch: resolveVariableReceivers(value.falseBranch, definitions, visited) };
        case 'null_coalesce':
            return { ...value, left: resolveVariableReceivers(value.left, definitions, visited), right: resolveVariableReceivers(value.right, definitions, visited) };
        case 'binary_expression':
            return { ...value, left: resolveVariableReceivers(value.left, definitions, visited), right: resolveVariableReceivers(value.right, definitions, visited) };
        case 'unary_expression':
            return { ...value, operand: resolveVariableReceivers(value.operand, definitions, visited) };
        case 'cast_expression':
            return { ...value, operand: resolveVariableReceivers(value.operand, definitions, visited) };
        case 'nested_array':
            return { ...value, entries: value.entries.map(entry => entry.kind === 'keyed'
                ? { ...entry, value: resolveVariableReceivers(entry.value, definitions, visited), key: entry.key.kind === 'expression' ? { ...entry.key, value: resolveVariableReceivers(entry.key.value, definitions, visited) } : entry.key }
                : { ...entry, value: resolveVariableReceivers(entry.value, definitions, visited) }) };
        case 'static_call':
        case 'construct':
            return { ...value, arguments: value.arguments.map(argument => ({ ...argument, value: resolveVariableReceivers(argument.value, definitions, visited) })) };
        case 'instance_of':
            return { ...value, expression: resolveVariableReceivers(value.expression, definitions, visited) };
        case 'closure':
        case 'arrow_function':
        case 'match_expression':
            return value;
    }
}

export function bindField({
    key,
    value,
    modelSymbol,
    modelSymbolTable,
    variableDefinitions
}: {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly modelSymbol: OriginModelSymbol;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly variableDefinitions?: ReadonlyMap<string, PhpAstValue>;
}): BoundResourceFieldResult {
    const semanticValue = resolveVariableReceivers(value, variableDefinitions ?? new Map());
    return matchPhpAstValue(semanticValue, {
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
        shortTernary: (val) => bindShortTernaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        nullCoalesce: (val) => bindNullCoalesceField(key, val, modelSymbol, modelSymbolTable, bindField),
        binaryExpression: (val) => bindBinaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        unaryExpression: () => bindFallbackField(key),
        castExpression: (val) => bindCastField(key, val, modelSymbol, modelSymbolTable, bindField),
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
