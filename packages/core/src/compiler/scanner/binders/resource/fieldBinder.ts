/**
 * Relational field binder boundary.
 * Variable receiver expansion is expressed as algebraic relation matching;
 * binding dispatch is a closed semantic catalog, not host-language control flow.
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
import { relationAll, relationGate, relationProject, relationEqual } from "../../../../semantic/foundation/semanticRelations";
import { relationContains, relationInsert, relationIndexLookup, type RelationMembership, type RelationIndex } from "../../../../semantic/foundation/relationMembership";
import { relationOptionFold, relationRefine } from "../../../../semantic/foundation/relationalSequence";
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

type KeyedPhpArrayEntry = Extract<import('../../lexer/phpAstTypes').PhpArrayEntry, { readonly kind: 'keyed' }>;
const keyedEntry = (entry: import('../../lexer/phpAstTypes').PhpArrayEntry) =>
    relationRefine(entry, (candidate): candidate is KeyedPhpArrayEntry => relationEqual(candidate.kind, 'keyed'));
const expressionKey = (key: import('../../lexer/phpAstTypes').PhpArrayKey) =>
    relationRefine(key, (candidate): candidate is Extract<import('../../lexer/phpAstTypes').PhpArrayKey, { readonly kind: 'expression' }> => relationEqual(candidate.kind, 'expression'));

const resolvedNestedEntry = (entry: import('../../lexer/phpAstTypes').PhpArrayEntry, definitions: RelationIndex<string, PhpAstValue>, visited: RelationMembership<string>) =>
    relationOptionFold(keyedEntry(entry),
        () => ({ ...entry, value: resolveVariableReceivers(entry.value, definitions, visited) }),
        keyed => ({ ...keyed, value: resolveVariableReceivers(keyed.value, definitions, visited), key: relationOptionFold(expressionKey(keyed.key), () => keyed.key, key => ({ ...key, value: resolveVariableReceivers(key.value, definitions, visited) })) }),
    );

function bindPropertyAccessWithAccess(
    key: string,
    property: string,
    access: import("../../lexer/phpAstExpressionTypes").PhpAccessMode,
    modelSymbol: OriginModelSymbol
): BoundResourceFieldResult {
    return matchPhpAccessMode(access, {
        direct: mode => bindPropertyAccessField(key, property, mode, modelSymbol),
        nullsafe: mode => bindPropertyAccessField(key, property, mode, modelSymbol),
    });
}

function resolveVariableRoot(
    value: PhpAstValue,
    definitions: RelationIndex<string, PhpAstValue>,
    visited: RelationMembership<string> = []
): PhpAstValue {
    const identity = (current: PhpAstValue): PhpAstValue => current;
    return matchPhpAstValue(value, {
        literal: identity,
        interpolatedString: identity,
        resourceSingle: identity,
        resourceCollection: identity,
        methodChain: identity,
        propertyAccess: identity,
        arrayAccess: identity,
        functionCall: identity,
        callableCall: identity,
        variableReference: current => relationGate(
            relationAll([relationEqual(relationIndexLookup(definitions, current.name).kind, 'some'), relationEqual(relationContains(visited, current.name), false)]),
            () => relationOptionFold(relationIndexLookup(definitions, current.name), () => current, value => resolveVariableRoot(value, definitions, relationInsert(visited, current.name))),
            () => current
        ),
        magicConstant: identity,
        constantReference: identity,
        shortTernary: identity,
        nullCoalesce: identity,
        binaryExpression: identity,
        unaryExpression: identity,
        castExpression: identity,
        ternaryExpression: identity,
        nestedArray: identity,
        staticCall: identity,
        classReference: identity,
        classConstant: identity,
        construct: identity,
        assignmentExpression: identity,
        dynamicConstruct: identity,
        anonymousClassConstruct: identity,
        instanceOf: identity,
        closure: identity,
        arrowFunction: identity,
        matchExpression: identity,
        unsupported: identity,
    });
}

function resolveVariableReceivers(
    value: PhpAstValue,
    definitions: RelationIndex<string, PhpAstValue>,
    visited: RelationMembership<string> = []
): PhpAstValue {
    const identity = (current: PhpAstValue): PhpAstValue => current;
    return matchPhpAstValue(value, {
        literal: identity,
        interpolatedString: identity,
        resourceSingle: identity,
        resourceCollection: identity,
        variableReference: current => resolveVariableRoot(current, definitions, visited),
        magicConstant: identity,
        constantReference: identity,
        propertyAccess: current => ({ ...current, receiver: resolveVariableRoot(current.receiver, definitions, visited) }),
        methodChain: current => ({ ...current, receiver: resolveVariableRoot(current.receiver, definitions, visited) }),
        arrayAccess: current => ({ ...current, target: resolveVariableReceivers(current.target, definitions, visited), index: resolveVariableReceivers(current.index, definitions, visited) }),
        functionCall: current => ({ ...current, arguments: relationProject(current.arguments, argument => ({ ...argument, value: resolveVariableReceivers(argument.value, definitions, visited) })) }),
        callableCall: current => ({ ...current, arguments: relationProject(current.arguments, argument => ({ ...argument, value: resolveVariableReceivers(argument.value, definitions, visited) })) }),
        shortTernary: current => ({ ...current, condition: resolveVariableReceivers(current.condition, definitions, visited), falseBranch: resolveVariableReceivers(current.falseBranch, definitions, visited) }),
        nullCoalesce: current => ({ ...current, left: resolveVariableReceivers(current.left, definitions, visited), right: resolveVariableReceivers(current.right, definitions, visited) }),
        binaryExpression: current => ({ ...current, left: resolveVariableReceivers(current.left, definitions, visited), right: resolveVariableReceivers(current.right, definitions, visited) }),
        unaryExpression: current => ({ ...current, operand: resolveVariableReceivers(current.operand, definitions, visited) }),
        castExpression: current => ({ ...current, operand: resolveVariableReceivers(current.operand, definitions, visited) }),
        ternaryExpression: current => ({ ...current, condition: resolveVariableReceivers(current.condition, definitions, visited), trueBranch: resolveVariableReceivers(current.trueBranch, definitions, visited), falseBranch: resolveVariableReceivers(current.falseBranch, definitions, visited) }),
        nestedArray: current => ({ ...current, entries: relationProject(current.entries, entry => resolvedNestedEntry(entry, definitions, visited)) }),
        staticCall: current => ({ ...current, arguments: relationProject(current.arguments, argument => ({ ...argument, value: resolveVariableReceivers(argument.value, definitions, visited) })) }),
        classReference: identity,
        classConstant: identity,
        construct: current => ({ ...current, arguments: relationProject(current.arguments, argument => ({ ...argument, value: resolveVariableReceivers(argument.value, definitions, visited) })) }),
        assignmentExpression: current => ({ ...current, value: resolveVariableReceivers(current.value, definitions, visited) }),
        dynamicConstruct: identity,
        anonymousClassConstruct: identity,
        instanceOf: current => ({ ...current, expression: resolveVariableReceivers(current.expression, definitions, visited) }),
        closure: identity,
        arrowFunction: identity,
        matchExpression: identity,
        unsupported: identity,
    });
}


export function bindField({
    key,
    value,
    modelSymbol,
    modelSymbolTable,
    variableDefinitions = Object.freeze([]),
}: {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly modelSymbol: OriginModelSymbol;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly variableDefinitions?: RelationIndex<string, PhpAstValue>;
}): BoundResourceFieldResult {
    const semanticValue = resolveVariableReceivers(value, variableDefinitions);
    return matchPhpAstValue(semanticValue, {
        methodChain: val => matchResourceOperationKind(resourceOperationKindForMethod(val.property), {
            when: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            unless: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            merge_when: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            merge_unless: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            merge: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            transform: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            attributes: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_has: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_null: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_not_null: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_appended: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_loaded: () => matchLookup(readWhenLoadedRelation(val.arguments), {
                found: relation => bindWhenLoadedField(key, relation.value, modelSymbol),
                missing: () => bindFallbackField(key),
            }),
            when_counted: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_aggregated: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_exists_loaded: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_pivot_loaded: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            when_pivot_loaded_as: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            additional: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            with: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            ordinary: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
        }),
        propertyAccess: val => matchPhpPropertyPath(val.target, {
            single: () => bindPropertyAccessWithAccess(key, val.property, val.access, modelSymbol),
            chain: () => bindPropertyPathField(key, val, modelSymbol, modelSymbolTable),
        }),
        resourceSingle: val => bindResourceCollectionField(key, val, modelSymbol),
        resourceCollection: val => bindResourceCollectionField(key, val, modelSymbol),
        nestedArray: val => bindNestedArrayField(key, val, modelSymbol, modelSymbolTable, bindField),
        literal: val => bindLiteralField(key, val),
        interpolatedString: () => bindFallbackField(key),
        ternaryExpression: val => bindTernaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        arrayAccess: () => bindFallbackField(key),
        functionCall: () => bindFallbackField(key),
        callableCall: () => bindFallbackField(key),
        shortTernary: val => bindShortTernaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        nullCoalesce: val => bindNullCoalesceField(key, val, modelSymbol, modelSymbolTable, bindField),
        binaryExpression: val => bindBinaryField(key, val, modelSymbol, modelSymbolTable, bindField),
        unaryExpression: () => bindFallbackField(key),
        castExpression: val => bindCastField(key, val, modelSymbol, modelSymbolTable, bindField),
        assignmentExpression: () => bindFallbackField(key),
        matchExpression: () => bindFallbackField(key),
        magicConstant: () => bindFallbackField(key),
        constantReference: () => bindFallbackField(key),
        variableReference: () => bindFallbackField(key),
        staticCall: () => bindFallbackField(key),
        construct: () => bindFallbackField(key),
        dynamicConstruct: () => bindFallbackField(key),
        anonymousClassConstruct: () => bindFallbackField(key),
        instanceOf: () => bindFallbackField(key),
        classConstant: () => bindFallbackField(key),
        classReference: () => bindFallbackField(key),
        closure: () => bindFallbackField(key),
        arrowFunction: () => bindFallbackField(key),
        unsupported: () => bindFallbackField(key),
    });
}
