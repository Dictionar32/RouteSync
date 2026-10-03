import type { PhpAstValue, PhpArrayEntry } from '../../lexer/PhpAst';
import type { ResourceField, ResourceFieldMeaning, ResourceFieldOutput, ResourceFieldPresence, ResourceDynamicEntry, ResourceDynamicEntries } from '../../../../types/upstream/resource';
import type { ExpressionAst } from '../../../../types/upstream/ast';
import type { Expression } from '../../../../types/upstream/expression';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { ResourceOperationDefault, ResourceOperationValue } from '../../../../types/upstream/resourceVocabulary';
import type { RelationName, PropertyName } from '../../../../types/upstream/names';
import { createSourceFile } from '../../../../types/upstream/names';
import type { OriginModelSymbol } from '../../symbols/model/originModelSymbol';
import { resolveAstValueToExpression } from './resourceAstExpressionMapper';
import { resourceOperationKindForMethod } from '../../../../types/upstream/resourceVocabulary';
import { semanticType } from '../model/semanticTypeCanonical';
import { sourceSpanFromRange } from './resourceUpstreamExpressionMappings';
import { expressionAstFromPhpAst } from '../expressionAstCanonical';
import { relationAll, relationEqual, relationGate, relationOptionFold, relationFirstOption, relationProject, relationExpand, relationOptionMap, } from '../../../../semantic/kernel/relationalSequence';
import { solveCandidate, solveRewriteCandidate } from '../../../../semantic/kernel/requirementSolver';

const str = (value: string) => ({ kind: 'string_value' as const, value });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const propertyRef = (value: string) => ({ kind: 'property_reference' as const, name: propertyName(value) });
const modelRef = (value: string) => ({ kind: 'model_reference' as const, name: { kind: 'model_name' as const, value: str(value) } });
const resourceRef = (value: string) => ({ kind: 'resource_reference' as const, name: { kind: 'resource_name' as const, value: str(value) } });
const seq = <T>(items: readonly T[], index = 0): { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: ReturnType<typeof seq<T>> } => relationGate(index >= items.length, () => ({ kind: 'empty' as const }), () => ({ kind: 'cons' as const, head: items[index], tail: seq(items, index + 1) }));

function modelRelation(relationName: RelationName, model: OriginModelSymbol) { return model.relation(relationName); }

function argumentAt(
    argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[],
    index: number,
): import('../../../../semantic/kernel/relationalSequence').RelationOption<import('../../lexer/phpAstTypes').PhpArgument> {
    return relationFirstOption(argumentsAst, (_, position) => relationEqual(position, index));
}

function operationDefault(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationDefault {
    return relationOptionFold(
        argumentAt(argumentsAst, index),
        () => ({ kind: 'missing_value' }),
        argument => ({ kind: 'expression', expression: resolveAstValueToExpression(argument.value, file).upstream }),
    );
}

function operationExpression(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): Expression {
    return relationOptionFold(solveRewriteCandidate([
        { id: 'arrow', rewrite: () => resolveAstValueToExpression(value.body, file).upstream, requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'arrow_function') }] },
        {
            id: 'closure',
            rewrite: () => relationOptionFold(
                relationFirstOption(value.body.statements, statement => relationEqual(statement.kind, 'return_with_value')) as import('../../../../semantic/kernel/relationalSequence').RelationOption<Extract<import('../../lexer/phpAstTypes').PhpStatement, { kind: 'return_with_value' }>>,
                () => resolveAstValueToExpression(value, file).upstream,
                statement => resolveAstValueToExpression(statement.expression, file).upstream,
            ),
            requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'closure') }],
        },
    ]), () => resolveAstValueToExpression(value, file).upstream, result => result);
}

function operationValue(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationValue {
    return relationOptionFold(
        argumentAt(argumentsAst, index),
        () => ({ kind: 'implicit_resource_value' }),
        argument => ({ kind: 'expression', expression: operationExpression(argument.value, file) }),
    );
}

function relationArgument(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): RelationName {
    return relationOptionFold(
        argumentAt(argumentsAst, index),
        () => { throw Error('Resource operation relation must be a literal relation name at the AST boundary'); },
        argument => relationOptionFold(
            solveCandidate([
                { id: 'literal_relation', value: argument.value.value, requirements: [{ id: 'literal', satisfied: relationAll([relationEqual(argument.value.kind, 'literal'), relationEqual(argument.value.literalType, 'string')]) }] },
            ]),
            () => { throw Error('Resource operation relation must be a literal relation name at the AST boundary'); },
            literal => ({ kind: 'relation_name', value: { kind: 'string_value', value: literal } }),
        ),
    );
}

function operationForField(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): import('../../../../semantic/kernel/relationalSequence').RelationOption<ResourceFieldOutput> {
    return relationGate(relationEqual(value.kind, 'method_chain'), () => relationOptionMap(
        relationOperationCandidates(value.property, value.arguments, file),
        operation => ({ kind: 'operation', operation }),
    ), () => ({ kind: 'none' }));
}



function relationOperationCandidates(property: string, argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], file: string) {
    const kind = resourceOperationKindForMethod(property);
    return solveRewriteCandidate([
        { id: 'when_loaded', rewrite: () => ({ kind: 'when_loaded', relation: relationArgument(argumentsAst, 0), value: operationValue(argumentsAst, 1, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_loaded') }] },
        { id: 'when_counted', rewrite: () => ({ kind: 'when_counted', relation: relationArgument(argumentsAst, 0), value: operationValue(argumentsAst, 1, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_counted') }] },
        { id: 'when_exists_loaded', rewrite: () => ({ kind: 'when_exists_loaded', relation: relationArgument(argumentsAst, 0), value: operationValue(argumentsAst, 1, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_exists_loaded') }] },
        { id: 'when_pivot_loaded', rewrite: () => ({ kind: 'when_pivot_loaded', table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(argumentsAst, 0) } }, value: operationExpression(argumentsAst[1].value, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_pivot_loaded') }] },
        { id: 'when_pivot_loaded_as', rewrite: () => ({ kind: 'when_pivot_loaded_as', accessor: { kind: 'property_name', value: { kind: 'string_value', value: literalString(argumentsAst, 0) } }, table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(argumentsAst, 1) } }, value: operationExpression(argumentsAst[2].value, file), default: operationDefault(argumentsAst, 3, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_pivot_loaded_as') }] },
        { id: 'when_aggregated', rewrite: () => ({ kind: 'when_aggregated', relation: relationArgument(argumentsAst, 0), column: { kind: 'column_name', value: { kind: 'string_value', value: literalString(argumentsAst, 1) } }, aggregate: aggregateFunction(literalString(argumentsAst, 2)), value: operationValue(argumentsAst, 3, file), default: operationDefault(argumentsAst, 4, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_aggregated') }] },
    ]);
}


function literalString(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): string {
    return relationOptionFold(
        argumentAt(argumentsAst, index),
        () => { throw Error('Resource operation expects a literal string argument at the AST boundary'); },
        argument => relationOptionFold(
            solveCandidate([
                { id: 'literal', value: argument.value.value, requirements: [{ id: 'literal', satisfied: relationAll([relationEqual(argument.value.kind, 'literal'), relationEqual(argument.value.literalType, 'string')]) }] },
            ]),
            () => { throw Error('Resource operation expects a literal string argument at the AST boundary'); },
            value => value,
        ),
    );
}

function aggregateFunction(value: string): import('../../../../types/upstream/resourceVocabulary').ResourceAggregateFunction {
    return relationOptionFold(solveCandidate([
        { id: 'avg', value: { kind: 'avg' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'avg') }] },
        { id: 'sum', value: { kind: 'sum' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'sum') }] },
        { id: 'min', value: { kind: 'min' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'min') }] },
        { id: 'max', value: { kind: 'max' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'max') }] },
    ]), () => { throw Error(`Unsupported Laravel resource aggregate '${value}' at the AST boundary`); }, result => result);
}

function fieldOutput(value: import('../../lexer/phpAstTypes').PhpAstValue, expression: Expression, file: string, resource: string, model: import('../../symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldOutput {
    return relationOptionFold(operationForField(value, file), () => solveFieldOutput(value, expression, file, resource, model), operation => operation);
}

function solveFieldOutput(value: import('../../lexer/phpAstTypes').PhpAstValue, expression: Expression, file: string, resource: string, model: import('../../symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldOutput {
    return relationOptionFold(solveRewriteCandidate([
        { id: 'resource_single', rewrite: () => ({ kind: 'resource', resource: resourceRef(value.resourceName), expression }), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'resource_single') }] },
        { id: 'resource_collection', rewrite: () => ({ kind: 'resource_collection', resource: resourceRef(value.resourceName), expression }), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'resource_collection') }] },
        { id: 'nested_array', rewrite: () => ({ kind: 'nested_object', fields: { kind: 'resource_fields', items: seq(relationExpand(value.entries, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => [produceResourceField(entry.key.value, entry.value, file, resource, model)], () => []), () => []))) }, dynamicEntries: { kind: 'resource_dynamic_entries', items: seq([]) } }), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'nested_array') }] },
    ]), () => ({ kind: 'scalar_or_expression', expression }), result => result);
}



function dynamicEntry(entry: PhpArrayEntry, file: string): readonly ResourceDynamicEntry[] {
    const value = resolveAstValueToExpression(entry.value, file).upstream;
    const source = sourceSpanFromRange(createSourceFile(file), entry.source);
    return relationOptionFold(solveRewriteCandidate([
        { id: 'positional', rewrite: () => [{ kind: 'positional', value, source }], requirements: [{ id: 'kind', satisfied: relationEqual(entry.kind, 'positional') }] },
        { id: 'unpacked', rewrite: () => [{ kind: 'unpacked', value, source }], requirements: [{ id: 'kind', satisfied: relationEqual(entry.kind, 'unpacked') }] },
        { id: 'integer', rewrite: () => [{ kind: 'integer_key', key: { kind: 'number_value', value: entry.key.value }, value, source }], requirements: [{ id: 'kind', satisfied: relationAll([relationEqual(entry.kind, 'keyed'), relationEqual(entry.key.kind, 'integer')]) }] },
        { id: 'expression', rewrite: () => [{ kind: 'dynamic_key', key: resolveAstValueToExpression(entry.key.value, file).upstream, value, source }], requirements: [{ id: 'kind', satisfied: relationAll([relationEqual(entry.kind, 'keyed'), relationEqual(entry.key.kind, 'expression')]) }] },
    ]), () => [], result => result);
}

function fieldPresence(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): ResourceFieldPresence {
    return relationGate(relationEqual(value.kind, 'method_chain'), () => relationOptionFold(solveCandidate([
        { id: 'when_loaded', value: { kind: 'relation_loaded', relation: relationArgument(value.arguments, 0) }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_loaded') }] },
        { id: 'when_counted', value: { kind: 'relation_counted', relation: relationArgument(value.arguments, 0) }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_counted') }] },
        { id: 'when_exists_loaded', value: { kind: 'relation_exists_loaded', relation: relationArgument(value.arguments, 0) }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_exists_loaded') }] },
        { id: 'when_has', value: { kind: 'attribute_present', attribute: { kind: 'property_name', value: str(literalString(value.arguments, 0)) } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_has') }] },
        { id: 'when_appended', value: { kind: 'attribute_appended', attribute: { kind: 'property_name', value: str(literalString(value.arguments, 0)) } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_appended') }] },
        { id: 'when_pivot_loaded', value: { kind: 'pivot_loaded', table: { kind: 'table_name', value: str(literalString(value.arguments, 0)) } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_pivot_loaded') }] },
        { id: 'when_pivot_loaded_as', value: { kind: 'pivot_loaded_as', accessor: { kind: 'property_name', value: str(literalString(value.arguments, 0)) }, table: { kind: 'table_name', value: str(literalString(value.arguments, 1)) } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_pivot_loaded_as') }] },
        { id: 'when_aggregated', value: { kind: 'relation_aggregated', relation: relationArgument(value.arguments, 0), column: { kind: 'column_name', value: str(literalString(value.arguments, 1)) }, aggregate: aggregateFunction(literalString(value.arguments, 2)) }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_aggregated') }] },
    ]), () => ({ kind: 'always_present' }), result => result), () => ({ kind: 'always_present' }));
}

function directFieldMeaning(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    expression: Expression,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceFieldMeaning {
    const propertyLookup = relationGate(
        relationEqual(value.kind, 'property_access'),
        () => relationGate(
            relationEqual(value.target.kind, 'variable_reference'),
            () => model.property(propertyName(value.property)),
            () => ({ kind: 'missing' as const }),
        ),
        () => ({ kind: 'missing' as const }),
    );
    const propertyMeaning = relationOptionFold(
        relationGate(
            relationEqual(propertyLookup.kind, 'found'),
            () => ({ kind: 'some' as const, value: propertyLookup.value }),
            () => ({ kind: 'none' as const }),
        ),
        () => ({ kind: 'computed_projection' as const, expression }),
        property => relationOptionFold(
            solveCandidate([
                {
                    id: 'column',
                    value: { kind: 'property_projection' as const, property: propertyRef(property.property.value), model: modelRef(model.name.value.value) },
                    requirements: [{ id: 'origin', satisfied: relationEqual(property.kind, 'column') }],
                },
                {
                    id: 'relation',
                    value: {
                        kind: 'relation_projection' as const,
                        relation: propertyRef(property.property.value),
                        projection: { kind: 'value' as const, expression },
                    },
                    requirements: [{ id: 'origin', satisfied: relationEqual(property.kind, 'relation') }],
                },
            ]),
            () => ({ kind: 'computed_projection' as const, expression }),
            result => result,
        ),
    );
    return relationGate(
        relationEqual(value.kind, 'method_chain'),
        () => relationGate(
            relationEqual(resourceOperationKindForMethod(value.property), 'when_loaded'),
            () => ({ kind: 'computed_projection', expression }),
            () => propertyMeaning,
        ),
        () => propertyMeaning,
    );
}

function argumentOption(
    argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[],
    index: number,
): import('../../../../semantic/kernel/relationalSequence').RelationOption<import('../../lexer/phpAstTypes').PhpAstValue> {
    return relationOptionMap(relationFirstOption(argumentsAst, (_, position) => relationEqual(position, index)), argument => argument.value);
}

function operationValueType(
    argument: import('../../lexer/phpAstExpressionTypes').PhpAstValue,
    model: OriginModelSymbol
): TypeExpression {
    return relationGate(
        relationEqual(argument.kind, 'arrow_function'),
        () => directFieldType(argument.body, model),
        () => relationGate(
            relationEqual(argument.kind, 'closure'),
            () => {
                const returns = relationSelect(
                    argument.body.statements,
                    statement => relationEqual(statement.kind, 'return_with_value'),
                ) as readonly Extract<import('../../lexer/phpAstTypes').PhpStatement, { kind: 'return_with_value' }> [];
                return relationOptionFold(
                    relationFirstOption(returns, (_, index) => relationEqual(index, 0)),
                    () => ({ kind: 'mixed' }),
                    value => directFieldType(value.expression, model),
                );
            },
            () => directFieldType(argument, model),
        ),
    );
}

function resourceOperationTypeOption(
    value: import('../../lexer/phpAstExpressionTypes').PhpAstValue,
    model: OriginModelSymbol
): import('../../../../semantic/kernel/relationalSequence').RelationOption<TypeExpression> {
    return relationGate(
        relationEqual(value.kind, 'method_chain'),
        () => solveCandidate([
            { id: 'when_counted', value: { kind: 'primitive', value: { kind: 'number' } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_counted') }] },
            { id: 'when_exists_loaded', value: { kind: 'primitive', value: { kind: 'boolean' } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_exists_loaded') }] },
            { id: 'when_aggregated', value: { kind: 'nullable', value: { kind: 'primitive', value: { kind: 'number' } } }, requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_aggregated') }] },
            { id: 'when_loaded', value: operationValueType(value.arguments[1].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_loaded') }] },
            { id: 'when', value: operationValueType(value.arguments[1].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when') }] },
            { id: 'unless', value: operationValueType(value.arguments[1].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'unless') }] },
            { id: 'merge_when', value: operationValueType(value.arguments[1].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'merge_when') }] },
            { id: 'merge_unless', value: operationValueType(value.arguments[1].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'merge_unless') }] },
            { id: 'merge', value: operationValueType(value.arguments[0].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'merge') }] },
            { id: 'when_has', value: relationOptionFold(argumentOption(value.arguments, 1), () => ({ kind: 'mixed' }), argument => operationValueType(argument, model)), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_has') }] },
            { id: 'when_appended', value: relationOptionFold(argumentOption(value.arguments, 1), () => ({ kind: 'mixed' }), argument => operationValueType(argument, model)), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_appended') }] },
            { id: 'when_null', value: operationValueType(value.arguments[0].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_null') }] },
            { id: 'when_not_null', value: operationValueType(value.arguments[0].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_not_null') }] },
            { id: 'when_pivot_loaded', value: operationValueType(value.arguments[1].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_pivot_loaded') }] },
            { id: 'when_pivot_loaded_as', value: operationValueType(value.arguments[2].value, model), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(value.property), 'when_pivot_loaded_as') }] },
        ]),
        () => ({ kind: 'none' as const }),
    );
}

export function resourceOperationType(
    value: import('../../lexer/phpAstExpressionTypes').PhpAstValue,
    model: OriginModelSymbol
): TypeExpression {
    return relationOptionFold(
        resourceOperationTypeOption(value, model),
        () => ({ kind: 'mixed' }),
        result => result,
    );
}

function typeFromLiteral(value: import('../../lexer/phpAstExpressionTypes').PhpAstValue, model: OriginModelSymbol): TypeExpression {
    const literalType = relationOptionFold(solveCandidate([{ id: 'literal', value: value.literalType, requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'literal') }] }]), () => 'other', result => result);
    return relationOptionFold(solveCandidate([
        { id: 'string', value: { kind: 'primitive', value: { kind: 'string' } }, requirements: [{ id: 'kind', satisfied: relationEqual(literalType, 'string') }] },
        { id: 'number', value: { kind: 'primitive', value: { kind: 'number' } }, requirements: [{ id: 'kind', satisfied: relationEqual(literalType, 'number') }] },
        { id: 'boolean', value: { kind: 'primitive', value: { kind: 'boolean' } }, requirements: [{ id: 'kind', satisfied: relationEqual(literalType, 'boolean') }] },
        { id: 'absence', value: { kind: 'nullable', value: { kind: 'mixed' } }, requirements: [{ id: 'kind', satisfied: relationEqual(literalType, 'null') }] },
    ]), () => ({ kind: 'mixed' }), result => result);
}

function typeForPropertyAccess(value: import('../../lexer/phpAstExpressionTypes').PhpAstValue, model: OriginModelSymbol): TypeExpression {
    const lookup = relationGate(
        relationEqual(value.kind, 'property_access'),
        () => relationGate(relationEqual(value.target.kind, 'variable_reference'), () => model.property(propertyName(value.property)), () => ({ kind: 'missing' as const })),
        () => ({ kind: 'missing' as const }),
    );
    return relationOptionFold(
        relationGate(relationEqual(lookup.kind, 'found'), () => ({ kind: 'some' as const, value: lookup.value }), () => ({ kind: 'none' as const })),
        () => ({ kind: 'mixed' }),
        property => relationGate(
            relationEqual(value.access.kind, 'nullsafe'),
            () => ({ kind: 'nullable', value: semanticType(property.semanticType) }),
            () => semanticType(property.semanticType),
        ),
    );
}

function typeForNestedArray(value: import('../../lexer/phpAstExpressionTypes').PhpAstValue, model: OriginModelSymbol): TypeExpression {
    const elements = relationProject(value.entries, entry => directFieldType(entry.value, model));
    const first = relationFirstOption(elements, () => true);
    return relationOptionFold(
        first,
        () => ({ kind: 'array', element: { kind: 'mixed' } }),
        candidate => relationGate(
            relationEvery(elements, item => relationEqual(JSON.stringify(item), JSON.stringify(candidate))),
            () => ({ kind: 'array', element: candidate }),
            () => ({ kind: 'array', element: { kind: 'mixed' } }),
        ),
    );
}

function unionType(left: TypeExpression, right: TypeExpression): TypeExpression {
    return relationGate(
        relationEqual(JSON.stringify(left), JSON.stringify(right)),
        () => left,
        () => ({ kind: 'union', members: { kind: 'type_expressions', items: [left, right] } }),
    );
}

function typeForCast(value: import('../../lexer/phpAstExpressionTypes').PhpAstValue): TypeExpression {
    const castKind = value.castType.kind;
    return relationOptionFold(solveCandidate([
        { id: 'number_int', value: { kind: 'primitive', value: { kind: 'number' } }, requirements: [{ id: 'cast', satisfied: relationAll([relationEqual(castKind, 'int'), relationEqual(castKind, 'float')]) }] },
        { id: 'string', value: { kind: 'primitive', value: { kind: 'string' } }, requirements: [{ id: 'cast', satisfied: relationEqual(castKind, 'string') }] },
        { id: 'boolean', value: { kind: 'primitive', value: { kind: 'boolean' } }, requirements: [{ id: 'cast', satisfied: relationEqual(castKind, 'bool') }] },
        { id: 'array', value: { kind: 'array', element: { kind: 'mixed' } }, requirements: [{ id: 'cast', satisfied: relationEqual(castKind, 'array') }] },
        { id: 'object', value: { kind: 'object', properties: { kind: 'type_properties', items: { kind: 'empty' } } }, requirements: [{ id: 'cast', satisfied: relationEqual(castKind, 'object') }] },
    ]), () => ({ kind: 'mixed' }), result => result);
}

function typeForBinary(value: import('../../lexer/phpAstExpressionTypes').PhpAstValue): TypeExpression {
    const operator = value.operator.kind;
    return relationOptionFold(solveCandidate([
        { id: 'boolean', value: { kind: 'primitive', value: { kind: 'boolean' } }, requirements: [{ id: 'operator', satisfied: relationOptionFold(relationFirstOption(['identical', 'not_identical', 'equal', 'not_equal', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'logical_and', 'logical_or'], item => relationEqual(item, operator)), () => false, () => true) }] },
        { id: 'string', value: { kind: 'primitive', value: { kind: 'string' } }, requirements: [{ id: 'operator', satisfied: relationEqual(operator, 'concat') }] },
    ]), () => ({ kind: 'primitive', value: { kind: 'number' } }), result => result);
}

function directFieldType(
    value: import('../../lexer/phpAstExpressionTypes').PhpAstValue,
    model: OriginModelSymbol
): TypeExpression {
    const operationType = resourceOperationTypeOption(value, model);
    return relationOptionFold(
        operationType,
        () => relationOptionFold(solveRewriteCandidate([
            { id: 'literal', rewrite: () => typeFromLiteral(value, model), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'literal') }] },
            { id: 'interpolated', rewrite: () => ({ kind: 'primitive', value: { kind: 'string' } }), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'interpolatedString') }] },
            { id: 'property', rewrite: () => typeForPropertyAccess(value, model), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'property_access') }] },
            { id: 'nested', rewrite: () => typeForNestedArray(value, model), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'nestedArray') }] },
            { id: 'ternary', rewrite: () => unionType(directFieldType(value.trueBranch, model), directFieldType(value.falseBranch, model)), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'ternaryExpression') }] },
            { id: 'short', rewrite: () => ({ kind: 'nullable', value: directFieldType(value.condition, model) }), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'shortTernary') }] },
            { id: 'coalesce', rewrite: () => unionType(directFieldType(value.left, model), directFieldType(value.right, model)), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'nullCoalesce') }] },
            { id: 'cast', rewrite: () => typeForCast(value), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'castExpression') }] },
            { id: 'binary', rewrite: () => typeForBinary(value), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'binaryExpression') }] },
            { id: 'unary', rewrite: () => relationGate(relationEqual(value.operator.kind, 'not'), () => ({ kind: 'primitive', value: { kind: 'boolean' } }), () => ({ kind: 'primitive', value: { kind: 'number' } })), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'unaryExpression') }] },
        ]), () => ({ kind: 'mixed' }), result => result),
        result => result,
    );
}

export function produceResourceField(
    entryKey: string,
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    file: string,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceField {
    const mapped = resolveAstValueToExpression(value, file);
    const expression = mapped.upstream;
    const expressionAst: ExpressionAst = expressionAstFromPhpAst(value, expression, { kind: 'resource_field', resource: { kind: 'resource_name', value: str(resource) }, field: propertyName(entryKey) }, file);
    return {
        kind: 'resource_field',
        name: propertyName(entryKey),
        expression,
        expressionAst,
        meaning: directFieldMeaning(value, expression, resource, model),
        type: directFieldType(value, model),
        presence: fieldPresence(value, file),
        output: fieldOutput(value, expression, file, resource, model),
        source: expression.source,
    };
}
