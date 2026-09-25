import type { PhpAstValue, PhpArrayEntry } from '../lexer/PhpAst';
import type { ResourceField, ResourceFieldMeaning, ResourceFieldOutput, ResourceFieldPresence, ResourceDynamicEntry, ResourceDynamicEntries } from '../../../types/upstream/resource';
import type { Expression } from '../../../types/upstream/expression';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { ResourceOperationDefault, ResourceOperationValue } from '../../../types/upstream/resourceVocabulary';
import type { RelationName, PropertyName } from '../../../types/upstream/names';
import { createSourceFile } from '../../../types/upstream/names';
import type { OriginModelSymbol } from '../symbols/model/originModelSymbol';
import { mapAstValueToExpression } from './resourceAstExpressionMapper';
import { resourceOperationKindForMethod } from '../../../types/upstream/resourceVocabulary';
import { semanticType } from '../model/semanticTypeCanonical';
import { sourceSpanFromRange } from './resourceUpstreamExpressionMappings';

const str = (value: string) => ({ kind: 'string_value' as const, value });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const propertyRef = (value: string) => ({ kind: 'property_reference' as const, name: propertyName(value) });
const modelRef = (value: string) => ({ kind: 'model_reference' as const, name: { kind: 'model_name' as const, value: str(value) } });
const resourceRef = (value: string) => ({ kind: 'resource_reference' as const, name: { kind: 'resource_name' as const, value: str(value) } });
const seq = <T>(items: readonly T[]) => items.reduceRight((tail, head) => ({ kind: 'cons' as const, head, tail }), { kind: 'empty' as const });

function modelRelation(relationName: RelationName, model: OriginModelSymbol) { return model.relation(relationName); }

function operationDefault(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationDefault {
    const argument = argumentsAst[index];
    return argument ? { kind: 'expression', expression: mapAstValueToExpression(argument.value, file).upstream } : { kind: 'missing_value' };
}

function operationExpression(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): Expression {
    if (value.kind === 'arrow_function') return mapAstValueToExpression(value.body, file).upstream;
    if (value.kind === 'closure') {
        const returns = value.body.statements.filter((statement): statement is Extract<import('../../lexer/phpAstTypes').PhpStatement, { kind: 'return_with_value' }> => statement.kind === 'return_with_value');
        if (returns.length === 1) return mapAstValueToExpression(returns[0].expression, file).upstream;
    }
    return mapAstValueToExpression(value, file).upstream;
}

function operationValue(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationValue {
    const argument = argumentsAst[index];
    if (!argument) return { kind: 'implicit_resource_value' };
    return { kind: 'expression', expression: operationExpression(argument.value, file) };
}

function relationArgument(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): RelationName {
    const argument = argumentsAst[index];
    if (!argument || argument.value.kind !== 'literal' || argument.value.literalType !== 'string') throw new Error('Resource operation relation must be a literal relation name at the AST boundary');
    return { kind: 'relation_name', value: { kind: 'string_value', value: argument.value.value } };
}

function operationForField(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): ResourceFieldOutput | undefined {
    if (value.kind !== 'method_chain') return undefined;
    const kind = resourceOperationKindForMethod(value.property);
    if (kind === 'ordinary') return undefined;
    switch (kind) {
        case 'when_loaded':
            return { kind: 'operation', operation: { kind: 'when_loaded', relation: relationArgument(value.arguments, 0), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_counted':
            return { kind: 'operation', operation: { kind: 'when_counted', relation: relationArgument(value.arguments, 0), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_exists_loaded':
            return { kind: 'operation', operation: { kind: 'when_exists_loaded', relation: relationArgument(value.arguments, 0), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_pivot_loaded':
            return { kind: 'operation', operation: { kind: 'when_pivot_loaded', table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(value.arguments, 0) } }, value: operationExpression(value.arguments[1]?.value ?? value, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_pivot_loaded_as':
            return { kind: 'operation', operation: { kind: 'when_pivot_loaded_as', accessor: { kind: 'property_name', value: { kind: 'string_value', value: literalString(value.arguments, 0) } }, table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(value.arguments, 1) } }, value: operationExpression(value.arguments[2]?.value ?? value, file), default: operationDefault(value.arguments, 3, file) } };
        case 'when_aggregated':
            return { kind: 'operation', operation: { kind: 'when_aggregated', relation: relationArgument(value.arguments, 0), column: { kind: 'column_name', value: { kind: 'string_value', value: literalString(value.arguments, 1) } }, aggregate: aggregateFunction(literalString(value.arguments, 2)), value: operationValue(value.arguments, 3, file), default: operationDefault(value.arguments, 4, file) } };
        case 'when': return { kind: 'operation', operation: { kind: 'when', condition: operationExpression(value.arguments[0]?.value ?? value, file), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'unless': return { kind: 'operation', operation: { kind: 'unless', condition: operationExpression(value.arguments[0]?.value ?? value, file), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'merge_when': return { kind: 'operation', operation: { kind: 'merge_when', condition: operationExpression(value.arguments[0]?.value ?? value, file), value: operationExpression(value.arguments[1]?.value ?? value, file), default: operationDefault(value.arguments, 2, file) } };
        case 'merge_unless': return { kind: 'operation', operation: { kind: 'merge_unless', condition: operationExpression(value.arguments[0]?.value ?? value, file), value: operationExpression(value.arguments[1]?.value ?? value, file), default: operationDefault(value.arguments, 2, file) } };
        case 'merge': return { kind: 'operation', operation: { kind: 'merge', value: operationExpression(value.arguments[0]?.value ?? value, file) } };
        case 'transform': return { kind: 'operation', operation: { kind: 'transform', value: operationExpression(value.arguments[0]?.value ?? value, file), callback: operationExpression(value.arguments[1]?.value ?? value, file), default: operationDefault(value.arguments, 2, file) } };
        case 'attributes': {
            const argument = value.arguments[0]?.value;
            if (argument?.kind !== 'array') throw new Error(`Resource attributes() requires an array at the AST boundary`);
            const fields = argument.entries.flatMap(entry => entry.kind === 'keyed' && entry.key.kind === 'string' ? [produceResourceField(entry.key.value, entry.value, file, resource, model)] : []);
            return { kind: 'operation', operation: { kind: 'attributes', fields: { kind: 'resource_fields', items: seq(fields) } } };
        }
        case 'when_has': return { kind: 'operation', operation: { kind: 'when_has', attribute: { kind: 'property_name', value: str(literalString(value.arguments, 0)) }, value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_null': return { kind: 'operation', operation: { kind: 'when_null', value: operationExpression(value.arguments[0]?.value ?? value, file), default: operationDefault(value.arguments, 1, file) } };
        case 'when_not_null': return { kind: 'operation', operation: { kind: 'when_not_null', value: operationExpression(value.arguments[0]?.value ?? value, file), default: operationDefault(value.arguments, 1, file) } };
        case 'when_appended': return { kind: 'operation', operation: { kind: 'when_appended', attribute: { kind: 'property_name', value: str(literalString(value.arguments, 0)) }, value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'additional':
        case 'with':
            throw new Error(`Resource operation '${kind}' belongs to resource-level response customization, not a field projection`);
    }
}

function literalString(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): string {
    const value = argumentsAst[index]?.value;
    if (!value || value.kind !== 'literal' || value.literalType !== 'string') throw new Error('Resource operation expects a literal string argument at the AST boundary');
    return value.value;
}

function aggregateFunction(value: string): import('../../../../types/upstream/resourceVocabulary').ResourceAggregateFunction {
    switch (value) {
        case 'avg': return { kind: 'avg' };
        case 'sum': return { kind: 'sum' };
        case 'min': return { kind: 'min' };
        case 'max': return { kind: 'max' };
        default: throw new Error(`Unsupported Laravel resource aggregate '${value}' at the AST boundary`);
    }
}

function fieldOutput(value: import('../../lexer/phpAstTypes').PhpAstValue, expression: Expression, file: string, resource: string, model: import('../../symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldOutput {
    const operation = operationForField(value, file);
    if (operation) return operation;
    switch (value.kind) {
        case 'resource_single': return { kind: 'resource', resource: resourceRef(value.resourceName), expression };
        case 'resource_collection': return { kind: 'resource_collection', resource: resourceRef(value.resourceName), expression };
        case 'nested_array': {
            const fields = value.entries.flatMap(entry => entry.kind === 'keyed' && entry.key.kind === 'string'
                ? [produceResourceField(entry.key.value, entry.value, file, resource, model)]
                : []);
            const dynamicEntries: ResourceDynamicEntries = {
                kind: 'resource_dynamic_entries',
                items: seq(value.entries.flatMap(entry => dynamicEntry(entry, file))),
            };
            return { kind: 'nested_object', fields: { kind: 'resource_fields', items: seq(fields) }, dynamicEntries };
        }
        default: return { kind: 'scalar_or_expression', expression };
    }
}

function dynamicEntry(entry: PhpArrayEntry, file: string): readonly ResourceDynamicEntry[] {
    const value = mapAstValueToExpression(entry.value, file).upstream;
    const source = sourceSpanFromRange(createSourceFile(file), entry.source);
    switch (entry.kind) {
        case 'positional': return [{ kind: 'positional', value, source }];
        case 'unpacked': return [{ kind: 'unpacked', value, source }];
        case 'keyed':
            switch (entry.key.kind) {
                case 'string': return [];
                case 'integer': return [{ kind: 'integer_key', key: { kind: 'number_value', value: entry.key.value }, value, source }];
                case 'expression': return [{ kind: 'dynamic_key', key: mapAstValueToExpression(entry.key.value, file).upstream, value, source }];
            }
    }
}

function fieldPresence(value: import('../../lexer/phpAstTypes').PhpAstValue): ResourceFieldPresence {
    if (value.kind === 'method_chain' && resourceOperationKindForMethod(value.property) === 'when_loaded') return { kind: 'relation_loaded', relation: relationArgument(value.arguments, 0) };
    return { kind: 'always_present' };
}

function directFieldMeaning(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    expression: Expression,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceFieldMeaning {
    const property = value.kind === 'property_access' && value.target.kind === 'variable_reference'
        ? model.property(propertyName(value.property))
        : undefined;
    if (property?.kind === 'column') {
        return { kind: 'property_projection', property: propertyRef(property.property.value), model: modelRef(model.name.value.value) };
    }
    if (property?.kind === 'relation') {
        const relation = modelRelation({ kind: 'relation_name', value: str(property.property.value) }, model);
        if (relation.kind === 'found') {
            return {
                kind: 'relation_projection',
                relation: propertyRef(property.property.value),
                projection: {
                    kind: 'resource',
                    resource: resourceRef(resource),
                    targetModel: modelRef(relation.value.targetModel.value.value),
                    cardinality: relation.value.cardinality,
                    multiplicity: relation.value.multiplicity,
                    targetShape: relation.value.targetShape,
                    traversalTarget: relation.value.traversalTarget
                }
            };
        }
    }
    if (value.kind === 'method_chain' && resourceOperationKindForMethod(value.property) === 'when_loaded') {
        return { kind: 'computed_projection', expression };
    }
    return { kind: 'computed_projection', expression };
}

function directFieldType(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): TypeExpression {
    if (value.kind === 'property_access' && value.target.kind === 'variable_reference') {
        const property = model.property(propertyName(value.property));
        if (property) return semanticType(property.semanticType);
    }
    return { kind: 'error', diagnostic: str('resource_field_type_requires_upstream_typing') };
}

export function produceResourceField(
    entryKey: string,
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    file: string,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceField {
    const mapped = mapAstValueToExpression(value, file);
    const expression = mapped.upstream;
    return {
        kind: 'resource_field',
        name: propertyName(entryKey),
        expression,
        meaning: directFieldMeaning(value, expression, resource, model),
        type: directFieldType(value, model),
        presence: fieldPresence(value),
        output: fieldOutput(value, expression, file, resource, model),
        source: expression.source,
    };
}

