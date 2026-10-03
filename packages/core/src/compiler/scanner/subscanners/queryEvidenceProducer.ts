import type { ExpressionAst } from '../../../types/upstream/ast';
import type { Expression } from '../../../types/upstream/expression';
import type { QueryAst, QueryOperationAst, QuerySubqueryAst } from '../../../types/upstream/query';
import { createModelName, createPropertyName, createRelationName } from '../../../types/upstream/names';
import type { ModelName, PropertyName } from '../../../types/upstream/names';
import type { Sequence, RelationPath, Option } from '../../../types/upstream/collections';
import { RELATION_NONE, relationGate, type RelationNone, relationFirst, relationFold, relationExpand, relationProject, relationMapValueOr, relationCatalogValueOr, relationOptionFold, relationAdvanceIndex, relationLookup, relationSome, relationNone, relationVariant, relationVariantValue, type RelationOption, type RelationVariant } from '../../../semantic/kernel/relationalSequence';
import { solveCandidate, requirement } from '../../../semantic/kernel/semanticDecisionRewriteEngine';
import { relationAny, relationAll, relationEqual, relationNotEqual } from '../../../semantic/kernel/semanticRelations';
export type QueryProducerInput = {
    readonly expressions: readonly ExpressionAst[];
};
export interface QueryProducer {
    readonly produce: (input: QueryProducerInput) => readonly QueryAst[];
}
const modelFromReceiver = (expression: Expression): RelationOption<ModelName> => relationGate(relationEqual(expression.kind, 'model_reference'), () => ({ kind: 'some', value: expression.model }), () => relationGate(relationAny([
    relationEqual(expression.kind, 'method'),
    relationEqual(expression.kind, 'nullsafe_method')
]), () => modelFromReceiver(expression.receiver), () => relationGate(relationAll([
    relationEqual(expression.kind, 'static_method'), relationEqual(expression.receiver.kind, 'model')
]), () => ({ kind: 'some', value: expression.receiver.name }), () => relationGate(relationAll([
    relationEqual(expression.kind, 'static_method'), relationEqual(expression.receiver.kind, 'class')
]), () => relationOptionFold(modelStaticOperationFromExpression(expression), () => ({ kind: 'none' }), () => ({ kind: 'some', value: createModelName(expression.receiver.name.value.value) })), () => ({ kind: 'none' })))));
const positionalArgumentsFromItems = (items: import('../../../types/upstream/collections').ExpressionArguments['items'], output: Expression[] = []): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => output, () => relationGate(relationEqual(items.head.kind, 'positional'), () => positionalArgumentsFromItems(items.tail, output.concat([items.head.value])), () => positionalArgumentsFromItems(items.tail, output)));
const positionalArguments = (expression: RelationVariant<Expression, 'method' | 'nullsafe_method'>): readonly Expression[] => positionalArgumentsFromItems(expression.arguments.items);
const propertyArgument = (expression: Expression | RelationNone): import('../../../types/upstream/names').PropertyName | RelationNone => relationOptionFold(
    relationVariant(expression, 'literal'),
    () => RELATION_NONE,
    literal => relationGate(relationEqual(literal.value.kind, 'string_literal'), () => createPropertyName(literal.value.value.value), () => RELATION_NONE),
);
const relationArgument = (expression: Expression | RelationNone): import('../../../types/upstream/names').RelationName | RelationNone => relationOptionFold(
    relationVariant(expression, 'literal'),
    () => RELATION_NONE,
    literal => relationGate(relationEqual(literal.value.kind, 'string_literal'), () => createRelationName(literal.value.value.value), () => RELATION_NONE),
);
const relationSegments = (names: readonly string[], index = names.length - 1, tail: RelationPath['segments'] = { kind: 'empty' }): RelationPath['segments'] => relationGate(index < 0, () => tail, () => relationSegments(names, index - 1, { kind: 'cons', head: createRelationName(names[index]), tail }));
const propertySegments = (columns: readonly string[], index = columns.length - 1, tail: import('../../../types/upstream/collections').PropertyNames['items'] = { kind: 'empty' }): import('../../../types/upstream/collections').PropertyNames['items'] => relationGate(index < 0, () => tail, () => propertySegments(columns, index - 1, { kind: 'cons', head: createPropertyName(columns[index]), tail }));
const relationPathArgument = (expression: Expression | RelationNone): RelationOption<RelationPath> => relationOptionFold(
    relationVariant(expression, 'literal'),
    () => relationNone(),
    literal => relationGate(relationEqual(literal.value.kind, 'string_literal'), () => {
    const raw = literal.value.value.value;
    const parts = raw.split(':');
    return relationOptionFold(relationFirst(parts, () => true), () => relationNone(), pathText => {
        const selectionText = relationLookup(relationProject(parts, (value, index) => [index, value] as const), 1);
        const names = pathText.split('.');
        const validNames = relationAll([names.length > 0, relationAll(relationProject(names, name => name.length > 0))]);
        return relationGate(validNames, () => {
            const segments = relationSegments(names);
            const validColumns = relationOptionFold(selectionText, () => true, selection => relationAll([
                selection.length > 0, relationAll(relationProject(selection.split(','), column => column.length > 0))
            ]));
            return relationGate(validColumns, () => relationOptionFold(selectionText, () => relationSome({
                kind: 'relation_path', segments, selectedColumns: { kind: 'none' }
            }), selection => relationSome({
                kind: 'relation_path', segments, selectedColumns: { kind: 'some', value: { kind: 'property_names', items: propertySegments(selection.split(',')) } }
            })), () => relationNone());
        }, () => relationNone());
    });
    }, () => relationNone()),
);
const relationPathsFromArray = (items: RelationVariant<Expression, 'array'>['entries'], continuation: (paths: RelationPath[]) => RelationPath[], output: RelationPath[] = []): RelationPath[] => relationGate(relationEqual(items.kind, 'empty'), () => continuation(output), () => {
    return relationOptionFold(relationPathArgument(items.head.value), () => [], path => relationPathsFromArray(items.tail, continuation, output.concat([path])));
});
const relationPathsFromExpressions = (expressions: readonly Expression[], index = 0, output: RelationPath[] = []): RelationPath[] => relationGate(index >= expressions.length, () => output, () => relationGate(relationEqual(expressions[index].kind, 'array'), () => relationPathsFromArray(relationVariantValue(expressions[index], 'array'), nested => relationPathsFromExpressions(expressions, relationAdvanceIndex(index, 1), nested), output), () => {
    return relationOptionFold(relationPathArgument(expressions[index]), () => [], path => relationPathsFromExpressions(expressions, relationAdvanceIndex(index, 1), output.concat([path])));
}));
const relationPathsArgument = (expressions: readonly Expression[]): RelationOption<readonly RelationPath[]> => {
    const paths = relationPathsFromExpressions(expressions);
    return relationGate(paths.length > 0, () => relationSome(paths), () => relationNone());
};
const relationCount = (expression: Expression | RelationNone): import('../../../types/upstream/expression').QueryRelationCount => relationGate(relationEqual(expression, RELATION_NONE), () => ({ kind: 'implicit' }), () => ({ kind: 'explicit', value: expression }));
const sequenceFromExpressions = <T>(items: readonly T[], index = items.length - 1, tail: Sequence<T> = { kind: 'empty' }): Sequence<T> => relationGate(index < 0, () => tail, () => sequenceFromExpressions(items, index - 1, { kind: 'cons', head: items[index], tail }));
const groupingTarget = (expression: Expression): RelationOption<import('../../../types/upstream/expression').QueryOrderingTarget> => relationOptionFold(
    propertyArgument(expression),
    () => relationSome({ kind: 'expression', expression }),
    property => relationSome({ kind: 'property', property }),
);
const queryGroupingFromExpressions = (expressions: readonly Expression[], index = 0, output: import('../../../types/upstream/expression').QueryOrderingTarget[] = []): RelationOption<readonly import('../../../types/upstream/expression').QueryOrderingTarget[]> => relationGate(
    index >= expressions.length,
    () => relationGate(output.length > 0, () => relationSome(output), () => relationNone()),
    () => relationOptionFold(
        groupingTarget(expressions[index]),
        () => relationNone(),
        target => queryGroupingFromExpressions(expressions, relationAdvanceIndex(index, 1), output.concat([target])),
    ),
);
const queryGrouping = (expressions: readonly Expression[]): RelationOption<import('../../../types/upstream/expression').QueryGrouping> => relationOptionFold(
    queryGroupingFromExpressions(expressions),
    () => relationNone(),
    targets => relationSome({ kind: 'query_grouping', targets: sequenceFromExpressions(targets) }),
);
const relationAggregateCatalog: readonly (readonly [string, import('../../../types/upstream/expression').QueryRelationAggregateFunction])[] = Object.freeze([
    ['withCount', { kind: 'count' }], ['loadCount', { kind: 'count' }],
    ['withMin', { kind: 'min' }], ['loadMin', { kind: 'min' }],
    ['withMax', { kind: 'max' }], ['loadMax', { kind: 'max' }],
    ['withAvg', { kind: 'avg' }], ['loadAvg', { kind: 'avg' }],
    ['withSum', { kind: 'sum' }], ['loadSum', { kind: 'sum' }],
    ['withExists', { kind: 'exists' }], ['loadExists', { kind: 'exists' }],
]);
const relationAggregateFunction = (name: string): RelationOption<import('../../../types/upstream/expression').QueryRelationAggregateFunction> => relationLookup(relationAggregateCatalog, name);
const relationAggregate = (name: string, expression: RelationVariant<Expression, 'method' | 'nullsafe_method'>): RelationOption<import('../../../types/upstream/expression').QueryRelationAggregate> => relationOptionFold(
    relationAggregateFunction(name),
    () => relationNone(),
    fn => relationOptionFold(
        relationLookup(positionalArguments(expression), relationSome(0)),
        () => relationNone(),
        first => {
            const literalRelation = relationAll([
                relationEqual(first.kind, 'literal'), relationEqual(first.value.kind, 'string_literal')
            ]);
            return relationGate(literalRelation, () => {
                const rawRelation = first.value.value.value;
                const aliasMarker = ' as ';
                const aliasIndex = rawRelation.indexOf(aliasMarker);
                const relationText = relationGate(aliasIndex < 0, () => rawRelation, () => relationTextSlice(rawRelation, 0, aliasIndex));
                const aliasText = relationGate(aliasIndex < 0, () => relationNone<string>(), () => relationSome(relationTextSlice(rawRelation, relationAdvanceIndex(aliasIndex, aliasMarker.length))));
                const relationExpression: Expression = { ...first, value: { ...first.value, value: { ...first.value.value, value: relationText } } };
                return relationOptionFold(
                    relationPathArgument(relationExpression),
                    () => relationNone(),
                    path => {
                        const columnValue = relationGate(
                            relationAny([relationEqual(fn.kind, 'exists'), relationEqual(fn.kind, 'count')]),
                            () => relationNone<import('../../../types/upstream/names').PropertyName>(),
                            () => relationOptionFold(relationLookup(positionalArguments(expression), relationSome(1)), () => relationNone(), value => relationGate(relationAll([relationEqual(value.kind, 'literal'), relationEqual(value.value.kind, 'string_literal')]), () => relationSome(createPropertyName(value.value.value.value)), () => relationNone()))
                        );
                        const column = columnValue;
                        const alias = relationOptionFold(aliasText, () => relationNone<import('../../../types/upstream/names').PropertyName>(), value => relationSome(createPropertyName(value)));
                        return relationSome({ path, function: fn, column, alias, constraint: { kind: 'none' }, source: expression.source });
                    }
                );
            }, () => relationNone());
        }
    )
);
const orderingTarget = (expression: Expression | RelationNone): import('../../../types/upstream/expression').QueryOrderingTarget | RelationNone => {
    const property = propertyArgument(expression);
    return solveCandidate([
        { id: 'property', value: { kind: 'property', property: relationVariantValue(property, 'some') }, requirements: [requirement('expression', relationNotEqual(expression, RELATION_NONE)), requirement('property', relationNotEqual(property, RELATION_NONE))] },
        { id: 'expression', value: { kind: 'expression', expression: relationVariantValue(expression, 'some') }, requirements: [requirement('expression', relationNotEqual(expression, RELATION_NONE))] },
    ]);
};
const orderingDirection = (expression: Expression | RelationNone): import('../../../types/upstream/expression').OrderDirection => relationOptionFold(solveCandidate([
    { id: 'descending', value: { kind: 'descending' }, requirements: [requirement('descending', relationAll([
                relationAll([
                    relationEqual(expression.kind, 'literal'), relationEqual(relationVariantValue(expression, 'literal').value.kind, 'string_literal')
                ]),
                relationEqual(expression.value.value.value.toLowerCase(), 'desc')
            ]))] },
    { id: 'ascending', value: { kind: 'ascending' }, requirements: [requirement('default', true)] },
]), () => ({ kind: 'ascending' as const }), value => value);
type QueryJoinMethodName = 'join' | 'leftJoin' | 'rightJoin' | 'crossJoin' | 'joinSub' | 'leftJoinSub' | 'rightJoinSub' | 'crossJoinSub' | 'joinLateral' | 'leftJoinLateral' | 'straightJoin' | 'straightJoinSub';
const queryJoinConstraint = (expression: Expression): import('../../../semantic/kernel/relationalSequence').RelationOption<import('../../../types/upstream/expression').QueryJoinConstraint> => solveCandidate([
    { id: 'closure', value: { kind: 'closure', expression: relationVariantValue(expression, 'closure') }, requirements: [requirement('closure', relationAny([relationEqual(expression.kind, 'closure'), relationEqual(expression.kind, 'arrow_function')]))] },
    { id: 'expression', value: { kind: 'expression', expression }, requirements: [requirement('expression', true)] },
]);
type QueryJoinDescriptor = {
    readonly target: 'table' | 'subquery' | 'lateral';
    readonly type: 'inner' | 'left' | 'right' | 'cross' | 'straight';
    readonly aliasIndex: import('../../../semantic/kernel/relationalSequence').RelationOption<number>;
    readonly constraintIndex: import('../../../semantic/kernel/relationalSequence').RelationOption<number>;
};
const joinDescriptor = (target: QueryJoinDescriptor['target'], type: QueryJoinDescriptor['type'], aliasIndex: import('../../../semantic/kernel/relationalSequence').RelationOption<number>, constraintIndex: import('../../../semantic/kernel/relationalSequence').RelationOption<number>): QueryJoinDescriptor => ({ target, type, aliasIndex, constraintIndex });
const queryJoinCatalog: readonly (readonly [QueryJoinMethodName, QueryJoinDescriptor])[] = Object.freeze([
    ['join', joinDescriptor('table', 'inner', relationNone(), relationSome(1))],
    ['leftJoin', joinDescriptor('table', 'left', relationNone(), relationSome(1))],
    ['rightJoin', joinDescriptor('table', 'right', relationNone(), relationSome(1))],
    ['crossJoin', joinDescriptor('table', 'cross', relationNone(), relationSome(1))],
    ['joinSub', joinDescriptor('subquery', 'inner', relationSome(1), relationSome(2))],
    ['leftJoinSub', joinDescriptor('subquery', 'left', relationSome(1), relationSome(2))],
    ['rightJoinSub', joinDescriptor('subquery', 'right', relationSome(1), relationSome(2))],
    ['crossJoinSub', joinDescriptor('subquery', 'cross', relationSome(1), relationSome(2))],
    ['joinLateral', joinDescriptor('lateral', 'inner', relationSome(1), relationNone())],
    ['leftJoinLateral', joinDescriptor('lateral', 'left', relationSome(1), relationNone())],
    ['straightJoin', joinDescriptor('table', 'straight', relationNone(), relationSome(1))],
    ['straightJoinSub', joinDescriptor('subquery', 'straight', relationSome(1), relationSome(2))],
]);
const argumentAt = (args: readonly Expression[], index: import('../../../semantic/kernel/relationalSequence').RelationOption<number>): import('../../../semantic/kernel/relationalSequence').RelationOption<Expression> => relationOptionFold(index, () => relationNone(), position => relationLookup(relationProject(args, (value, offset) => [offset, value] as const), position));
const queryJoinTarget = (descriptor: QueryJoinDescriptor, targetExpression: Expression, alias: import('../../../semantic/kernel/relationalSequence').RelationOption<Expression>): import('../../../types/upstream/expression').QueryJoin['target'] => relationGate(relationEqual(descriptor.target, 'table'), () => ({ kind: 'table', expression: targetExpression }), () => relationGate(relationEqual(descriptor.target, 'subquery'), () => relationOptionFold(alias, () => ({ kind: 'subquery', expression: targetExpression }), value => ({ kind: 'subquery', expression: targetExpression, alias: value })), () => relationOptionFold(alias, () => ({ kind: 'lateral', expression: targetExpression }), value => ({ kind: 'lateral', expression: targetExpression, alias: value }))));
const queryJoin = (name: QueryJoinMethodName, args: readonly Expression[]): import('../../../semantic/kernel/relationalSequence').RelationOption<import('../../../types/upstream/expression').QueryJoin> => relationOptionFold(
    relationLookup(queryJoinCatalog, name),
    () => relationNone(),
    descriptor => relationOptionFold(argumentAt(args, relationSome(0)), () => relationNone(), targetExpression => {
        const alias = argumentAt(args, descriptor.aliasIndex);
        const constraint = relationOptionFold(argumentAt(args, descriptor.constraintIndex), () => relationNone<import('../../../types/upstream/expression').QueryJoinConstraint>(), value => queryJoinConstraint(value));
        return relationGate(relationAny([relationEqual(descriptor.aliasIndex.kind, 'none'), relationEqual(alias.kind, 'some')]), () => relationOptionFold(constraint, () => relationSome({ target: queryJoinTarget(descriptor, targetExpression, alias), type: { kind: descriptor.type } }), value => relationSome({ target: queryJoinTarget(descriptor, targetExpression, alias), type: { kind: descriptor.type }, constraint: value })), () => relationNone());
    }),
);
const queryOperationFromNamedMethod = (expression: RelationVariant<Expression, 'method' | 'nullsafe_method'>): import('../../../semantic/kernel/relationalSequence').RelationOption<QueryOperationAst> => relationGate(
    relationEqual(expression.operation.kind, 'domain'),
    () => {
        const domain = expression.operation;
        const name = domain.name.value.value;
        const args = positionalArguments(expression);
        const field = propertyArgument(args[0]);
        const relation = relationArgument(args[0]);
        const value = args[args.length - 1];
        return relationOptionFold(
            relationLookup(queryNamedMethodOperationCatalog, name),
            () => relationNone(),
            resolver => resolver({ expression, name, args, field, relation, value }),
        );
    },
    () => relationGate(
        relationEqual(expression.operation.kind, 'query'),
        () => relationSome({ kind: 'instance', operation: expression.operation.operation }),
        () => relationNone(),
    ),
);
const queryColumnReferencesFromSequence = (items: RelationVariant<Expression, 'array'>['entries'], output: import('../../../types/upstream/expression').QueryColumnReference[] = []): import('../../../types/upstream/expression').QueryColumnReference[] => relationGate(relationEqual(items.kind, 'empty'), () => output, () => queryColumnReferencesFromSequence(items.tail, output.concat([{ kind: 'query_column_reference', expression: items.head.value, source: items.head.value.source }])));
const queryValidatedColumnReferencesFromSequence = (items: RelationVariant<Expression, 'array'>['entries'], output: import('../../../types/upstream/expression').QueryColumnReference[] = []): import('../../../types/upstream/expression').QueryColumnReference[] | RelationNone => relationGate(relationEqual(items.kind, 'empty'), () => relationGate(output.length > 0, () => output, () => RELATION_NONE), () => {
    const column = propertyArgument(items.head.value);
    return relationGate(relationNotEqual(column, RELATION_NONE), () => queryValidatedColumnReferencesFromSequence(items.tail, output.concat([{ kind: 'query_column_reference', expression: items.head.value, source: items.head.value.source }])), () => RELATION_NONE);
});
const queryColumnComparisonsFromSequence = (items: RelationVariant<Expression, 'array'>['entries'], output: import('../../../types/upstream/expression').QueryColumnComparison[] = []): import('../../../types/upstream/expression').QueryColumnComparison[] | RelationNone => relationGate(relationEqual(items.kind, 'empty'), () => relationGate(output.length > 0, () => output, () => RELATION_NONE), () => relationGate(relationEqual(items.head.value.kind, 'array'), () => {
    const pair = (relationVariantValue(items.head.value, 'array')).entries;
    return relationGate(relationAll([
        relationAll([
            relationEqual(pair.kind, 'cons'), relationEqual(pair.tail.kind, 'cons')
        ]),
        relationEqual(pair.tail.tail.kind, 'empty')
    ]), () => {
        const leftExpression = pair.head.value;
        const rightExpression = pair.tail.head.value;
        return relationGate(relationAll([
            relationAll([
                relationAll([
                    relationEqual(leftExpression.kind, 'literal'), relationEqual(leftExpression.value.kind, 'string_literal')
                ]),
                relationEqual(rightExpression.kind, 'literal')
            ]),
            relationEqual(rightExpression.value.kind, 'string_literal')
        ]), () => queryColumnComparisonsFromSequence(items.tail, output.concat([{
                kind: 'query_column_comparison',
                left: { kind: 'query_column_reference', expression: leftExpression, source: leftExpression.source },
                operator: { kind: 'equal' },
                right: { kind: 'query_column_reference', expression: rightExpression, source: rightExpression.source },
            }])), () => RELATION_NONE);
    }, () => RELATION_NONE);
}, () => RELATION_NONE));
const queryNamedMethodOperationCatalog: readonly (readonly [string, QueryNamedMethodResolver])[] = Object.freeze([
    ...relationRuleEntries(['join'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('join', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'join', join: value } }));
        }
    }),
    ...relationRuleEntries(['leftJoin'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('leftJoin', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'left_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['rightJoin'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('rightJoin', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'right_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['crossJoin'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('crossJoin', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'cross_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['joinSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('joinSub', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'join_sub', join: value } }));
        }
    }),
    ...relationRuleEntries(['leftJoinSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('leftJoinSub', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'left_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['rightJoinSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('rightJoinSub', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'right_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['crossJoinSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('crossJoinSub', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'cross_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['joinLateral'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('joinLateral', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'join_lateral', join: value } }));
        }
    }),
    ...relationRuleEntries(['leftJoinLateral'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin('leftJoinLateral', args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'left_join_lateral', join: value } }));
        }
    }),
    ...relationRuleEntries(['straightJoin', 'straightJoinSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const join = queryJoin(name, args);
            return relationOptionFold(join, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'straight_join', join: value } }));
        }
    }),
    ...relationRuleEntries(['whereNot', 'orWhereNot'], ({ expression, name, args, field, relation, value }) => {
        {
            const callback = args[0];
            return relationGate(relationAny([
                relationEqual(callback, RELATION_NONE),
                (relationAll([
                    relationNotEqual(callback.kind, 'closure'), relationNotEqual(callback.kind, 'arrow_function')
                ]))
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'not' as const, expression: callback };
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereNot'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['where', 'orWhere'], ({ expression, name, args, field, relation, value }) => relationOptionFold(
        relationFirst(args, () => true),
        () => relationGate(relationAny([relationEqual(field, RELATION_NONE), args.length < 2]), () => RELATION_NONE, () => {
            const operator = relationGate(args.length >= 3, () => comparisonOperator(args[1]), () => ({ kind: 'equal' as const }));
            const operand = relationGate(args.length >= 3, () => args[2], () => args[1]);
            return relationGate(relationEqual(operand, RELATION_NONE), () => RELATION_NONE, () => ({
                kind: 'some' as const,
                value: { kind: 'instance', operation: relationGate(relationEqual(name, 'where'), () => ({ kind: 'where', condition: { kind: 'basic', field, operator, value: operand } }), () => ({ kind: 'or_where', condition: { kind: 'basic', field, operator, value: operand } })) },
            }));
        }),
        first => relationGate(
            relationAny([relationEqual(first.kind, 'closure'), relationEqual(first.kind, 'arrow_function')]),
            () => ({
                kind: 'some' as const,
                value: { kind: 'instance', operation: relationGate(relationEqual(name, 'where'), () => ({ kind: 'where', condition: { kind: 'nested', expression: first } }), () => ({ kind: 'or_where', condition: { kind: 'nested', expression: first } })) },
            }),
            () => relationGate(relationAny([relationEqual(field, RELATION_NONE), args.length < 2]), () => RELATION_NONE, () => {
                const operator = relationGate(args.length >= 3, () => comparisonOperator(args[1]), () => ({ kind: 'equal' as const }));
                const operand = relationGate(args.length >= 3, () => args[2], () => args[1]);
                return relationGate(relationEqual(operand, RELATION_NONE), () => RELATION_NONE, () => ({
                    kind: 'some' as const,
                    value: { kind: 'instance', operation: relationGate(relationEqual(name, 'where'), () => ({ kind: 'where', condition: { kind: 'basic', field, operator, value: operand } }), () => ({ kind: 'or_where', condition: { kind: 'basic', field, operator, value: operand } })) },
                }));
            }),
        ),
    )),
    ...relationRuleEntries(['withCount', 'withMin', 'withMax', 'withAvg', 'withSum', 'withExists', 'loadCount', 'loadMin', 'loadMax', 'loadAvg', 'loadSum', 'loadExists'], ({ expression, name, args, field, relation, value }) => {
        {
            const aggregate = relationAggregate(name, expression);
            return relationOptionFold(aggregate, () => relationNone(), value => relationSome({ kind: 'instance', operation: { kind: 'relation_aggregate', aggregate: value } }));
        }
    }),
    ...relationRuleEntries(['has', 'orHas', 'doesntHave', 'orDoesntHave', 'whereHas', 'orWhereHas', 'whereDoesntHave', 'orWhereDoesntHave', 'withWhereHas', 'loadMissing'], ({ expression, name, args, field, relation, value }) => {
        {
            const path = relationPathArgument(args[0]);
            return relationGate(relationEqual(path, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const constraint = args.find((item) => relationAny([
                    relationEqual(item.kind, 'closure'),
                    relationEqual(item.kind, 'arrow_function')
                ]));
                const operation = relationOptionFold(
                    relationLookup([...queryRelationOperationCatalog.entries()], name),
                    () => RELATION_NONE,
                    resolver => resolver({ args, constraint }),
                );
                return relationGate(relationEqual(operation, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'relation', relation: { path, operation, source: expression.source } } }));
            });
        }
    }),
    ...relationRuleEntries(['whereBetween', 'orWhereBetween', 'whereNotBetween', 'orWhereNotBetween'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            const range = args[1];
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(range, RELATION_NONE),
                relationNotEqual(range.kind, 'array')
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const items = arrayExpressionItems(range);
                return relationGate(relationNotEqual(items.length, 2), () => {
                    return RELATION_NONE;
                }, () => {
                    const condition = { kind: 'between' as const, field, lower: items[0], upper: items[1], negated: relationAny([
                            relationEqual(name, 'whereNotBetween'),
                            relationEqual(name, 'orWhereNotBetween')
                        ]) };
                    return { kind: 'instance', operation: relationGate(relationAny([
                            relationEqual(name, 'whereBetween'),
                            relationEqual(name, 'whereNotBetween')
                        ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
                });
            });
        }
    }),
    ...relationRuleEntries(['whereBetweenColumns', 'orWhereBetweenColumns', 'whereNotBetweenColumns', 'orWhereNotBetweenColumns'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            const range = args[1];
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(args[0], RELATION_NONE),
                relationEqual(range, RELATION_NONE),
                relationNotEqual(range.kind, 'array')
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const items = arrayExpressionItems(range);
                return relationGate(relationNotEqual(items.length, 2), () => {
                    return RELATION_NONE;
                }, () => {
                    const condition = { kind: 'between_columns' as const, field: { kind: 'query_column_reference' as const, expression: args[0], source: args[0].source }, lower: { kind: 'query_column_reference' as const, expression: items[0], source: items[0].source }, upper: { kind: 'query_column_reference' as const, expression: items[1], source: items[1].source }, negated: relationAny([
                            relationEqual(name, 'whereNotBetweenColumns'),
                            relationEqual(name, 'orWhereNotBetweenColumns')
                        ]) };
                    return { kind: 'instance', operation: relationGate(relationAny([
                            relationEqual(name, 'whereBetweenColumns'),
                            relationEqual(name, 'whereNotBetweenColumns')
                        ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
                });
            });
        }
    }),
    ...relationRuleEntries(['whereValueBetween', 'orWhereValueBetween', 'whereValueNotBetween', 'orWhereValueNotBetween'], ({ expression, name, args, field, relation, value }) => {
        {
            const valueExpression = args[0];
            const range = args[1];
            return relationGate(relationAny([
                relationEqual(valueExpression, RELATION_NONE),
                relationEqual(range, RELATION_NONE),
                relationNotEqual(range.kind, 'array')
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const items = arrayExpressionItems(range);
                return relationGate(relationNotEqual(items.length, 2), () => {
                    return RELATION_NONE;
                }, () => {
                    const condition = { kind: 'value_between' as const, value: valueExpression, lower: { kind: 'query_column_reference' as const, expression: items[0], source: items[0].source }, upper: { kind: 'query_column_reference' as const, expression: items[1], source: items[1].source }, negated: relationAny([
                            relationEqual(name, 'whereValueNotBetween'),
                            relationEqual(name, 'orWhereValueNotBetween')
                        ]) };
                    return { kind: 'instance', operation: relationGate(relationAny([
                            relationEqual(name, 'whereValueBetween'),
                            relationEqual(name, 'whereValueNotBetween')
                        ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
                });
            });
        }
    }),
    ...relationRuleEntries(['whereIn', 'whereNotIn', 'orWhereIn', 'orWhereNotIn', 'whereIntegerInRaw', 'whereIntegerNotInRaw', 'orWhereIntegerInRaw', 'orWhereIntegerNotInRaw'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            const values = args[1];
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(values, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'in' as const, field, values, negated: relationAny([
                        relationEqual(name, 'whereNotIn'),
                        relationEqual(name, 'orWhereNotIn'),
                        relationEqual(name, 'whereIntegerNotInRaw'),
                        relationEqual(name, 'orWhereIntegerNotInRaw')
                    ]) };
                return { kind: 'instance', operation: relationGate(relationAny([
                        relationEqual(name, 'whereIn'),
                        relationEqual(name, 'whereNotIn'),
                        relationEqual(name, 'whereIntegerInRaw'),
                        relationEqual(name, 'whereIntegerNotInRaw')
                    ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereNull', 'orWhereNull', 'whereNotNull', 'orWhereNotNull'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            return relationGate(relationEqual(field, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'null' as const, field, negated: relationAny([
                        relationEqual(name, 'whereNotNull'),
                        relationEqual(name, 'orWhereNotNull')
                    ]) };
                return { kind: 'instance', operation: relationGate(relationAny([
                        relationEqual(name, 'whereNull'),
                        relationEqual(name, 'whereNotNull')
                    ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereNullSafeEquals', 'orWhereNullSafeEquals'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            const value = args[1];
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(value, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'null_safe_equals' as const, field, value };
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereNullSafeEquals'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereDate', 'orWhereDate', 'whereMonth', 'orWhereMonth', 'whereDay', 'orWhereDay', 'whereYear', 'orWhereYear', 'whereTime', 'orWhereTime'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(args[1], RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const operator = relationGate(args.length >= 3, () => (comparisonOperator(args[1])), () => ({ kind: 'equal' as const }));
                const value = relationGate(args.length >= 3, () => (args[2]), () => (args[1]));
                const part = queryDatePart(name);
                const condition = { kind: 'date_part' as const, part, field, operator, value };
                return { kind: 'instance', operation: relationGate(name.startsWith('orWhere'), () => ({ kind: 'or_where', condition }), () => ({ kind: 'where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereToday', 'orWhereToday', 'whereBeforeToday', 'orWhereBeforeToday', 'whereAfterToday', 'orWhereAfterToday', 'whereTodayOrBefore', 'orWhereTodayOrBefore', 'whereTodayOrAfter', 'orWhereTodayOrAfter', 'wherePast', 'orWherePast', 'whereFuture', 'orWhereFuture', 'whereNowOrPast', 'orWhereNowOrPast', 'whereNowOrFuture', 'orWhereNowOrFuture'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            return relationGate(relationEqual(field, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'date_relative' as const, part: queryDateRelative(name), field };
                return { kind: 'instance', operation: relationGate(name.startsWith('orWhere'), () => ({ kind: 'or_where', condition }), () => ({ kind: 'where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereRowValues', 'orWhereRowValues'], ({ expression, name, args, field, relation, value }) => {
        {
            const columns = args[0];
            const operator = args[1];
            const values = args[2];
            return relationGate(relationAny([
                relationEqual(columns, RELATION_NONE),
                relationNotEqual(columns.kind, 'array'),
                relationEqual(operator, RELATION_NONE),
                relationEqual(values, RELATION_NONE),
                relationNotEqual(values.kind, 'array')
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const columnRefs = queryColumnReferencesFromSequence(columns.entries);
                return relationGate(relationEqual(columnRefs.length, 0), () => {
                    return RELATION_NONE;
                }, () => {
                    const condition = { kind: 'row_values' as const, columns: { kind: 'query_column_list' as const, columns: sequenceFromExpressions(columnRefs) }, operator: comparisonOperator(operator), values };
                    return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereRowValues'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
                });
            });
        }
    }),
    ...relationRuleEntries(['whereExists', 'orWhereExists', 'whereNotExists', 'orWhereNotExists'], ({ expression, name, args, field, relation, value }) => {
        {
            const query = args[0];
            return relationGate(relationEqual(query, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'exists' as const, query, negated: relationAny([
                        relationEqual(name, 'whereNotExists'),
                        relationEqual(name, 'orWhereNotExists')
                    ]) };
                return { kind: 'instance', operation: relationGate(relationAny([
                        relationEqual(name, 'whereExists'),
                        relationEqual(name, 'whereNotExists')
                    ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereKey'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'where_key', value } }));
    }),
    ...relationRuleEntries(['whereRaw', 'orWhereRaw'], ({ expression, name, args, field, relation, value }) => {
        {
            const raw = args[0];
            return relationGate(relationEqual(raw, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'raw' as const, expression: raw, bindings: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[1] })) };
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereRaw'), () => ({ kind: 'where_raw', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereAny', 'whereAll', 'whereNone'], ({ expression, name, args, field, relation, value }) => {
        {
            const columns = args[0];
            const operator = args[1];
            const operand = args[2];
            return relationGate(relationAny([
                relationEqual(columns, RELATION_NONE),
                relationEqual(operator, RELATION_NONE),
                relationEqual(operand, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const items = relationGate(relationEqual(columns.kind, 'array'), () => (columns.entries), () => (RELATION_NONE));
                return relationGate(relationEqual(items, RELATION_NONE), () => {
                    return RELATION_NONE;
                }, () => {
                    const references = queryValidatedColumnReferencesFromSequence(items);
                    return relationOptionFold(references, () => relationNone(), values => {
                        const columnsValue = { kind: 'query_column_list' as const, columns: sequenceFromExpressions(values) };
                        const condition = relationGate(relationEqual(name, 'whereAny'), () => ({ kind: 'any' as const, columns: columnsValue, operator: comparisonOperator(operator), value: operand }), () => (relationGate(relationEqual(name, 'whereAll'), () => ({ kind: 'all' as const, columns: columnsValue, operator: comparisonOperator(operator), value: operand }), () => ({ kind: 'none' as const, columns: columnsValue, operator: comparisonOperator(operator), value: operand }))));
                        return relationSome({ kind: 'instance', operation: { kind: 'where', condition } });
                    });
                });
            });
        }
    }),
    ...relationRuleEntries(['whereLike', 'orWhereLike', 'whereNotLike', 'orWhereNotLike'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = propertyArgument(args[0]);
            const operand = args[1];
            return relationGate(relationAny([
                relationEqual(target, RELATION_NONE),
                relationEqual(operand, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const caseSensitive = relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'default' as const }), () => ({ kind: 'case_sensitive' as const, value: args[2] }));
                const negated = relationGate(relationAny([
                    relationEqual(name, 'whereNotLike'),
                    relationEqual(name, 'orWhereNotLike')
                ]), () => ({ kind: 'negated' as const }), () => ({ kind: 'positive' as const }));
                const condition = { kind: 'like' as const, field: target, value: operand, caseSensitive, negated };
                return { kind: 'instance', operation: relationGate(relationAny([
                        relationEqual(name, 'whereLike'),
                        relationEqual(name, 'whereNotLike')
                    ]), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereJsonContains', 'whereJsonDoesntContain', 'whereJsonContainsKey', 'whereJsonDoesntContainKey', 'whereJsonLength', 'whereJsonOverlaps', 'whereJsonDoesntOverlap', 'orWhereJsonContains', 'orWhereJsonDoesntContain', 'orWhereJsonContainsKey', 'orWhereJsonDoesntContainKey', 'orWhereJsonLength', 'orWhereJsonOverlaps', 'orWhereJsonDoesntOverlap'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = propertyArgument(args[0]);
            return relationGate(relationEqual(target, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const parts = target.value.value.split('->');
                const column = createPropertyName(parts[0]);
                const path: Expression = { kind: 'literal', value: { kind: 'string_literal', value: { kind: 'string_value', value: relationTextSlice(parts.join('->'), relationAdvanceIndex(parts[0].length, 1)) } }, source: args[0].source };
                const baseName = relationGate(name.startsWith('orWhere'), () => (relationTextSlice(name, 2)), () => (name));
                const condition = relationGate(relationEqual(baseName, 'whereJsonContains'), () => ({ kind: 'json' as const, condition: { kind: 'contains' as const, column, path, value: args[1] } }), () => (relationGate(relationEqual(baseName, 'whereJsonDoesntContain'), () => ({ kind: 'json' as const, condition: { kind: 'doesnt_contain' as const, column, path, value: args[1] } }), () => (relationGate(relationEqual(baseName, 'whereJsonContainsKey'), () => ({ kind: 'json' as const, condition: { kind: 'contains_key' as const, column, path } }), () => (relationGate(relationEqual(baseName, 'whereJsonDoesntContainKey'), () => ({ kind: 'json' as const, condition: { kind: 'doesnt_contain_key' as const, column, path } }), () => (relationGate(relationEqual(baseName, 'whereJsonOverlaps'), () => ({ kind: 'json' as const, condition: { kind: 'overlaps' as const, column, path, value: args[1] } }), () => (relationGate(relationEqual(baseName, 'whereJsonDoesntOverlap'), () => ({ kind: 'json' as const, condition: { kind: 'doesnt_overlap' as const, column, path, value: args[1] } }), () => ({ kind: 'json' as const, condition: { kind: 'length' as const, column, path, operator: relationGate(args.length >= 3, () => (comparisonOperator(args[1])), () => ({ kind: 'equal' as const })), length: relationGate(args.length >= 3, () => (args[2]), () => (args[1])) } }))))))))))));
                return relationGate(relationAll([
                    (relationAny([
                        relationEqual(condition.condition.kind, 'contains'),
                        relationEqual(condition.condition.kind, 'doesnt_contain')
                    ])), relationEqual(condition.condition.value, RELATION_NONE)
                ]), () => {
                    return RELATION_NONE;
                }, () => {
                    return relationGate(relationAll([
                        relationEqual(condition.condition.kind, 'length'), relationEqual(condition.condition.length, RELATION_NONE)
                    ]), () => {
                        return RELATION_NONE;
                    }, () => {
                        return { kind: 'instance', operation: relationGate(name.startsWith('orWhere'), () => ({ kind: 'or_where', condition }), () => ({ kind: 'where', condition })) };
                    });
                });
            });
        }
    }),
    ...relationRuleEntries(['whereFullText', 'orWhereFullText'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = propertyArgument(args[0]);
            const operand = args[1];
            return relationGate(relationAny([
                relationEqual(target, RELATION_NONE),
                relationEqual(operand, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'full_text' as const, field: target, value: operand };
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereFullText'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereVectorDistanceLessThan', 'orWhereVectorDistanceLessThan'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = propertyArgument(args[0]);
            const vector = args[1];
            const maxDistance = args[2];
            return relationGate(relationAny([
                relationEqual(target, RELATION_NONE),
                relationEqual(vector, RELATION_NONE),
                relationEqual(maxDistance, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const condition = { kind: 'vector_distance' as const, field: target, vector, maxDistance };
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereVectorDistanceLessThan'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
            });
        }
    }),
    ...relationRuleEntries(['whereVectorSimilarTo'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = propertyArgument(args[0]);
            const vector = args[1];
            return relationGate(relationAny([
                relationEqual(target, RELATION_NONE),
                relationEqual(vector, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const threshold = relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[2] }));
                const order = relationGate(relationEqual(args[3], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[3] }));
                return { kind: 'instance', operation: { kind: 'where', condition: { kind: 'vector_similarity', field: target, vector, threshold, order } } };
            });
        }
    }),
    ...relationRuleEntries(['whereColumn', 'orWhereColumn'], ({ expression, name, args, field, relation, value }) => {
        {
            const first = args[0];
            return relationGate(relationEqual(first, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return relationGate(relationEqual(first.kind, 'array'), () => {
                    const comparisons = queryColumnComparisonsFromSequence(first.entries);
                    return relationGate(relationEqual(comparisons, RELATION_NONE), () => RELATION_NONE, () => {
                        const condition = { kind: 'column_group' as const, comparisons: { kind: 'query_column_comparisons' as const, comparisons: sequenceFromArray(comparisons) } };
                        return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereColumn'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
                    });
                }, () => {
                    const leftExpression = first;
                    const rightExpression = relationGate(args.length >= 3, () => (args[2]), () => (args[1]));
                    return relationGate(relationEqual(rightExpression, RELATION_NONE), () => {
                        return RELATION_NONE;
                    }, () => {
                        return relationGate(relationAny([
                            relationNotEqual(leftExpression.kind, 'literal'), relationNotEqual(leftExpression.value.kind, 'string_literal')
                        ]), () => {
                            return RELATION_NONE;
                        }, () => {
                            return relationGate(relationAny([
                                relationNotEqual(rightExpression.kind, 'literal'), relationNotEqual(rightExpression.value.kind, 'string_literal')
                            ]), () => {
                                return RELATION_NONE;
                            }, () => {
                                const operator = relationGate(args.length >= 3, () => (comparisonOperator(args[1])), () => ({ kind: 'equal' as const }));
                                const comparison = {
                                    kind: 'query_column_comparison' as const,
                                    left: { kind: 'query_column_reference' as const, expression: leftExpression, source: leftExpression.source },
                                    operator,
                                    right: { kind: 'query_column_reference' as const, expression: rightExpression, source: rightExpression.source },
                                };
                                const condition = { kind: 'column' as const, comparison };
                                return { kind: 'instance', operation: relationGate(relationEqual(name, 'whereColumn'), () => ({ kind: 'where', condition }), () => ({ kind: 'or_where', condition })) };
                            });
                        });
                    });
                });
            });
        }
    }),
    ...relationRuleEntries(['with', 'load'], ({ expression, name, args, field, relation, value }) => {
        {
            const paths = relationPathsArgument(args);
            return relationGate(relationEqual(paths, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const relations = { kind: 'relation_paths' as const, items: sequenceFromArray(paths) };
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'with'), () => ({ kind: 'with', relations }), () => ({ kind: 'load', relations })) };
            });
        }
    }),
    ...relationRuleEntries(['latest'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = orderingTarget(args[0]);
            return { kind: 'instance', operation: { kind: 'latest', target } };
        }
    }),
    ...relationRuleEntries(['oldest'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = orderingTarget(args[0]);
            return { kind: 'instance', operation: { kind: 'oldest', target } };
        }
    }),
    ...relationRuleEntries(['orderBy', 'orderByAsc', 'orderByDesc'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = orderingTarget(args[0]);
            return relationGate(relationEqual(target, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const direction = relationGate(relationEqual(name, 'orderByDesc'), () => ({ kind: 'descending' as const }), () => (relationGate(relationEqual(name, 'orderByAsc'), () => ({ kind: 'ascending' as const }), () => (orderingDirection(args[1])))));
                return { kind: 'instance', operation: { kind: 'order_by', target, direction } };
            });
        }
    }),
    ...relationRuleEntries(['orderByVectorDistance'], ({ expression, name, args, field, relation, value }) => {
        {
            const column = args[0];
            const vector = args[1];
            return relationGate(relationAny([
                relationEqual(column, RELATION_NONE),
                relationEqual(vector, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'order_by_vector_distance', column, vector } };
            });
        }
    }),
    ...relationRuleEntries(['orderByRaw'], ({ expression, name, args, field, relation, value }) => {
        {
            const expression = args[0];
            return relationGate(relationEqual(expression, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const bindings = relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[1] }));
                return { kind: 'instance', operation: { kind: 'order_by_raw', target: { kind: 'raw', expression, bindings } } };
            });
        }
    }),
    ...relationRuleEntries(['orderByNullsFirst', 'orderByNullsLast'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = orderingTarget(args[0]);
            return relationGate(relationEqual(target, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'order_by_nulls', target, direction: { kind: 'ascending' }, nulls: relationGate(relationEqual(name, 'orderByNullsFirst'), () => ({ kind: 'first' }), () => ({ kind: 'last' })) } };
            });
        }
    }),
    ...relationRuleEntries(['reorder'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = orderingTarget(args[0]);
            const direction = relationGate(relationEqual(args[0], RELATION_NONE), () => (RELATION_NONE), () => (orderingDirection(args[1])));
            return { kind: 'instance', operation: { kind: 'reorder', target, direction } };
        }
    }),
    ...relationRuleEntries(['reorderDesc'], ({ expression, name, args, field, relation, value }) => {
        {
            const target = orderingTarget(args[0]);
            return { kind: 'instance', operation: { kind: 'reorder', target, direction: { kind: 'descending' } } };
        }
    }),
    ...relationRuleEntries(['groupLimit'], ({ expression, name, args, field, relation, value }) => {
        {
            const value = args[0];
            const column = orderingTarget(args[1]);
            return relationGate(relationAny([
                relationEqual(value, RELATION_NONE),
                relationEqual(column, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'group_limit', value, column } };
            });
        }
    }),
    ...relationRuleEntries(['inOrderOf'], ({ expression, name, args, field, relation, value }) => {
        {
            const column = propertyArgument(args[0]);
            const values = args[1];
            return relationGate(relationAny([
                relationEqual(column, RELATION_NONE),
                relationEqual(values, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'in_order_of', column, values } };
            });
        }
    }),
    ...relationRuleEntries(['fromRaw'], ({ expression, name, args, field, relation, value }) => {
        {
            const raw = args[0];
            return relationGate(relationEqual(raw, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'from_raw', expression: raw, bindings: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[1] })) } };
            });
        }
    }),
    ...relationRuleEntries(['select'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'select', projection: { kind: 'columns', arguments: expression.arguments } } };
    }),
    ...relationRuleEntries(['addSelect'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'add_select', projection: { kind: 'columns', arguments: expression.arguments } } };
    }),
    ...relationRuleEntries(['selectSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const query = args[0];
            const alias = args[1];
            return relationGate(relationAny([
                relationEqual(query, RELATION_NONE),
                relationEqual(alias, RELATION_NONE)
            ]), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'select_sub', projection: { kind: 'subquery', query, alias } } }));
        }
    }),
    ...relationRuleEntries(['selectExpression'], ({ expression, name, args, field, relation, value }) => {
        {
            const selected = args[0];
            const alias = args[1];
            return relationGate(relationAny([
                relationEqual(selected, RELATION_NONE),
                relationEqual(alias, RELATION_NONE)
            ]), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'select_expression', projection: { kind: 'expression', expression: selected, alias } } }));
        }
    }),
    ...relationRuleEntries(['fromSub'], ({ expression, name, args, field, relation, value }) => {
        {
            const query = args[0];
            const alias = args[1];
            return relationGate(relationAny([
                relationEqual(query, RELATION_NONE),
                relationEqual(alias, RELATION_NONE)
            ]), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'from_sub', query, alias } }));
        }
    }),
    ...relationRuleEntries(['useIndex', 'forceIndex', 'ignoreIndex'], ({ expression, name, args, field, relation, value }) => {
        {
            const index = args[0];
            return relationGate(relationEqual(index, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const hint = relationGate(relationEqual(name, 'useIndex'), () => ({ kind: 'use' as const, index }), () => (relationGate(relationEqual(name, 'forceIndex'), () => ({ kind: 'force' as const, index }), () => ({ kind: 'ignore' as const, index }))));
                return { kind: 'instance', operation: { kind: 'index_hint', hint } };
            });
        }
    }),
    ...relationRuleEntries(['selectVectorDistance'], ({ expression, name, args, field, relation, value }) => {
        {
            const column = args[0];
            const vector = args[1];
            return relationGate(relationAny([
                relationEqual(column, RELATION_NONE),
                relationEqual(vector, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'select_vector_distance', projection: { kind: 'vector_distance', column, vector, alias: args[2] } } };
            });
        }
    }),
    ...relationRuleEntries(['explain'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'explain' } };
    }),
    ...relationRuleEntries(['limit'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'limit', value } }));
    }),
    ...relationRuleEntries(['offset', 'skip'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'offset', value } }));
    }),
    ...relationRuleEntries(['take'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'limit', value } }));
    }),
    ...relationRuleEntries(['first'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'first' } };
    }),
    ...relationRuleEntries(['firstOrFail'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'first_or_fail' } };
    }),
    ...relationRuleEntries(['find'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'find', key: value } }));
    }),
    ...relationRuleEntries(['get'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(args.length, 0), () => ({ kind: 'instance', operation: { kind: 'get' } }), () => ({ kind: 'instance', operation: { kind: 'get_with_columns', columns: args[0] } }));
    }),
    ...relationRuleEntries(['findOrFail'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'find_or_fail', key: value } }));
    }),
    ...relationRuleEntries(['findOr'], ({ expression, name, args, field, relation, value }) => {
        {
            const key = args[0];
            return relationGate(relationEqual(key, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const columns = relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[1] }));
                const callback = relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[2] }));
                return { kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'find_or', key, columns, callback } } };
            });
        }
    }),
    ...relationRuleEntries(['paginate'], ({ expression, name, args, field, relation, value }) => {
        {
            const perPage = args[0];
            return relationGate(relationEqual(perPage, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'paginate', perPage, columns: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[1] })), pageName: relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[2] })), page: relationGate(relationEqual(args[3], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[3] })) } };
            });
        }
    }),
    ...relationRuleEntries(['simplePaginate'], ({ expression, name, args, field, relation, value }) => {
        {
            const perPage = args[0];
            return relationGate(relationEqual(perPage, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'simple_paginate', perPage, columns: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[1] })), pageName: relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[2] })) } };
            });
        }
    }),
    ...relationRuleEntries(['cursorPaginate'], ({ expression, name, args, field, relation, value }) => {
        {
            const perPage = args[0];
            return relationGate(relationEqual(perPage, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'cursor_paginate', perPage, columns: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[1] })), cursorName: relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[2] })), cursor: relationGate(relationEqual(args[3], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[3] })) } };
            });
        }
    }),
    ...relationRuleEntries(['distinct'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'distinct' } };
    }),
    ...relationRuleEntries(['union', 'unionAll'], ({ expression, name, args, field, relation, value }) => {
        {
            const query = args[0];
            return relationGate(relationEqual(query, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'union'), () => ({ kind: 'union', query }), () => ({ kind: 'union_all', query })) };
            });
        }
    }),
    ...relationRuleEntries(['inRandomOrder'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'in_random_order' } };
    }),
    ...relationRuleEntries(['randomOrder'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'random_order' } };
    }),
    ...relationRuleEntries(['count'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'count' } };
    }),
    ...relationRuleEntries(['sum', 'avg', 'min', 'max'], ({ expression, name, args, field, relation, value }) => {
        {
            const aggregate = relationGate(relationEqual(field, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'property' as const, name: field }));
            return relationGate(relationEqual(aggregate, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: name, value: aggregate } }));
        }
    }),
    ...relationRuleEntries(['exists'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'exists' } };
    }),
    ...relationRuleEntries(['doesntExist'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'doesnt_exist' } };
    }),
    ...relationRuleEntries(['sole'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'sole' } };
    }),
    ...relationRuleEntries(['pluck'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationEqual(field, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const keyProperty = relationGate(relationEqual(args[1], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[1])));
                return relationGate(relationAll([
                    relationNotEqual(args[1], RELATION_NONE), relationEqual(keyProperty, RELATION_NONE)
                ]), () => {
                    return RELATION_NONE;
                }, () => {
                    const key: Option<PropertyName> = relationGate(relationEqual(keyProperty, RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: keyProperty }));
                    return { kind: 'instance', operation: { kind: 'pluck', field, key } };
                });
            });
        }
    }),
    ...relationRuleEntries(['value'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(field, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'value', field } }));
    }),
    ...relationRuleEntries(['soleValue'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(field, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'sole_value', field } } }));
    }),
    ...relationRuleEntries(['rawValue'], ({ expression, name, args, field, relation, value }) => {
        {
            const rawExpression = args[0];
            return relationGate(relationEqual(rawExpression, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'raw_value', expression: rawExpression, bindings: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[1] })) } } };
            });
        }
    }),
    ...relationRuleEntries(['groupBy'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationOptionFold(
                queryGrouping(args),
                () => relationNone(),
                grouping => relationSome({ kind: 'instance', operation: { kind: 'group_by', grouping } }),
            );
        }
    }),
    ...relationRuleEntries(['groupByRaw'], ({ expression, name, args, field, relation, value }) => {
        {
            const expression = args[0];
            return relationGate(relationEqual(expression, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const bindings = relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[1] }));
                return { kind: 'instance', operation: { kind: 'group_by', grouping: { kind: 'raw', expression, bindings } } };
            });
        }
    }),
    ...relationRuleEntries(['having', 'orHaving'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                args.length < 2
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const operator = relationGate(args.length >= 3, () => (comparisonOperator(args[1])), () => ({ kind: 'equal' as const }));
                const operand = relationGate(args.length >= 3, () => (args[2]), () => (args[1]));
                return relationGate(relationEqual(operand, RELATION_NONE), () => {
                    return RELATION_NONE;
                }, () => {
                    const having = { kind: 'query_having' as const, condition: { kind: 'basic' as const, field, operator, value: operand } };
                    return relationGate(relationEqual(name, 'orHaving'), () => ({ kind: 'instance', operation: { kind: 'or_having', having } }), () => ({ kind: 'instance', operation: { kind: 'having', having } }));
                });
            });
        }
    }),
    ...relationRuleEntries(['havingBetween', 'orHavingBetween'], ({ expression, name, args, field, relation, value }) => {
        {
            const field = propertyArgument(args[0]);
            const range = args[1];
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(range, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const having = { kind: 'query_having' as const, condition: { kind: 'between' as const, field, values: range } };
                return relationGate(relationEqual(name, 'orHavingBetween'), () => ({ kind: 'instance', operation: { kind: 'or_having', having } }), () => ({ kind: 'instance', operation: { kind: 'having', having } }));
            });
        }
    }),
    ...relationRuleEntries(['havingRaw', 'orHavingRaw'], ({ expression, name, args, field, relation, value }) => {
        {
            const expression = args[0];
            return relationGate(relationEqual(expression, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const bindings = relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[1] }));
                const having = { kind: 'query_having' as const, condition: { kind: 'raw' as const, expression, bindings } };
                return relationGate(relationEqual(name, 'orHavingRaw'), () => ({ kind: 'instance', operation: { kind: 'or_having', having } }), () => ({ kind: 'instance', operation: { kind: 'having', having } }));
            });
        }
    }),
    ...relationRuleEntries(['selectRaw'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'select_raw_expression', expression: value, bindings: relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: args[1] })) } }));
    }),
    ...relationRuleEntries(['insert'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'insert', values: value } }));
    }),
    ...relationRuleEntries(['insertOrIgnore'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'mutation', mutation: { kind: 'insert_or_ignore', values: value } } }));
    }),
    ...relationRuleEntries(['insertOrIgnoreReturning'], ({ expression, name, args, field, relation, value }) => {
        {
            const values = args[0];
            const returning = args[1];
            const uniqueBy = args[2];
            return relationGate(relationAny([
                relationEqual(values, RELATION_NONE),
                relationEqual(returning, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'mutation', mutation: { kind: 'insert_or_ignore_returning', values, returning: { columns: returning, uniqueBy: relationGate(relationEqual(uniqueBy, RELATION_NONE), () => ({ kind: 'none' }), () => ({ kind: 'some', value: uniqueBy })) } } } };
            });
        }
    }),
    ...relationRuleEntries(['insertUsing', 'insertOrIgnoreUsing'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(args.length < 2, () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'mutation', mutation: relationGate(relationEqual(name, 'insertUsing'), () => ({ kind: 'insert_using', columns: args[0], query: args[1] }), () => ({ kind: 'insert_or_ignore_using', columns: args[0], query: args[1] })) } };
            });
        }
    }),
    ...relationRuleEntries(['insertGetId'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationEqual(value, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                const sequence = relationGate(relationEqual(args[1], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[1] }));
                return { kind: 'instance', operation: { kind: 'insert_get_id', values: value, sequence } };
            });
        }
    }),
    ...relationRuleEntries(['upsert'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(args.length < 3, () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'upsert', values: args[0], uniqueBy: args[1], update: args[2] } };
            });
        }
    }),
    ...relationRuleEntries(['chunkMap'], ({ expression, name, args, field, relation, value }) => {
        {
            const callback = args[0];
            const count = args[1];
            return relationGate(relationAny([
                relationEqual(callback, RELATION_NONE),
                (relationAll([
                    relationNotEqual(callback.kind, 'closure'), relationNotEqual(callback.kind, 'arrow_function')
                ]))
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'chunk_map', callback, count } } };
            });
        }
    }),
    ...relationRuleEntries(['each'], ({ expression, name, args, field, relation, value }) => {
        {
            const callback = args[0];
            const count = args[1];
            return relationGate(relationAny([
                relationEqual(callback, RELATION_NONE),
                (relationAll([
                    relationNotEqual(callback.kind, 'closure'), relationNotEqual(callback.kind, 'arrow_function')
                ]))
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'each', callback, count } } };
            });
        }
    }),
    ...relationRuleEntries(['eachById', 'orderedChunkById', 'orderedLazyById'], ({ expression, name, args, field, relation, value }) => {
        {
            const callback = args.find((item) => relationAny([
                relationEqual(item.kind, 'closure'),
                relationEqual(item.kind, 'arrow_function')
            ]));
            const eachById = relationEqual(name, 'eachById');
            const orderedChunkById = relationEqual(name, 'orderedChunkById');
            const count = relationGate(eachById, () => (args[1]), () => (args[0]));
            const callbackIndex = relationGate(relationAny([
                eachById, orderedChunkById
            ]), () => (1), () => (-1));
            const columnIndex = relationGate(relationAny([
                eachById, orderedChunkById
            ]), () => (2), () => (1));
            const aliasIndex = relationGate(relationAny([
                eachById, orderedChunkById
            ]), () => (3), () => (2));
            const column = relationGate(relationEqual(args[columnIndex], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[columnIndex])));
            const alias = relationGate(relationEqual(args[aliasIndex], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[aliasIndex])));
            return relationGate(relationAll([
                relationNotEqual(args[columnIndex], RELATION_NONE), relationEqual(column, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return relationGate(relationAll([
                    relationNotEqual(args[aliasIndex], RELATION_NONE), relationEqual(alias, RELATION_NONE)
                ]), () => {
                    return RELATION_NONE;
                }, () => {
                    const descending = relationGate(relationEqual(name, 'orderedChunkById'), () => (args[4]), () => (relationGate(relationEqual(name, 'orderedLazyById'), () => (args[3]), () => (RELATION_NONE))));
                    const direction = relationGate(relationEqual(descending, RELATION_NONE), () => ({ kind: 'ascending' as const }), () => (relationGate(relationAll([
                            relationEqual(descending.kind, 'literal'), relationEqual(descending.value.kind, 'boolean_literal')
                        ]), () => (relationGate(descending.value.value.value, () => ({ kind: 'descending' as const }), () => ({ kind: 'ascending' as const }))), () => ({ kind: 'dynamic' as const, expression: descending }))));
                    return relationGate(relationEqual(name, 'orderedLazyById'), () => {
                        return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'ordered_lazy_by_id', chunkSize: count, column, alias, direction } } };
                    }, () => {
                        return relationGate(relationAny([
                            relationEqual(callback, RELATION_NONE),
                            callbackIndex < 0
                        ]), () => {
                            return RELATION_NONE;
                        }, () => {
                            return relationGate(eachById, () => {
                                return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'each_by_id', callback, count, column, alias, direction } } };
                            }, () => {
                                return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'ordered_chunk_by_id', count, callback, column, alias, direction } } };
                            });
                        });
                    });
                });
            });
        }
    }),
    ...relationRuleEntries(['chunk'], ({ expression, name, args, field, relation, value }) => {
        {
            const count = args[0];
            const callback = args.find((item) => relationAny([
                relationEqual(item.kind, 'closure'),
                relationEqual(item.kind, 'arrow_function')
            ]));
            return relationGate(relationAny([
                relationEqual(count, RELATION_NONE),
                relationEqual(callback, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'chunk', count, callback } };
            });
        }
    }),
    ...relationRuleEntries(['lazy'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'lazy', chunkSize: args[0] } };
    }),
    ...relationRuleEntries(['delete'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'delete' } };
    }),
    ...relationRuleEntries(['fill'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'fill', values: value } }));
    }),
    ...relationRuleEntries(['create'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'create', values: value } }));
    }),
    ...relationRuleEntries(['update'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'update', values: value } }));
    }),
    ...relationRuleEntries(['updateFrom'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'update_from', values: value } }));
    }),
    ...relationRuleEntries(['updateOrCreate'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(args.length < 2, () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'update_or_create', lookup: args[0], values: args[1] } }));
    }),
    ...relationRuleEntries(['updateOrInsert'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(args.length < 2, () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'update_or_insert', lookup: args[0], values: args[1] } }));
    }),
    ...relationRuleEntries(['firstOrCreate'], ({ expression, name, args, field, relation, value }) => {
        return relationGate(args.length < 2, () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'first_or_create', attributes: args[0], values: args[1] } }));
    }),
    ...relationRuleEntries(['incrementEach', 'decrementEach'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationEqual(value, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'mutation', mutation: relationGate(relationEqual(name, 'incrementEach'), () => ({ kind: 'increment_each', columns: value }), () => ({ kind: 'decrement_each', columns: value })) } };
            });
        }
    }),
    ...relationRuleEntries(['truncate'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'mutation', mutation: { kind: 'truncate' } } };
    }),
    ...relationRuleEntries(['increment', 'decrement'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationAny([
                relationEqual(field, RELATION_NONE),
                relationEqual(value, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const updates = relationGate(relationEqual(args[2], RELATION_NONE), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: args[2] }));
                return { kind: 'instance', operation: relationGate(relationEqual(name, 'increment'), () => ({ kind: 'increment', field, amount: value, updates }), () => ({ kind: 'decrement', field, amount: value, updates })) };
            });
        }
    }),
    ...relationRuleEntries(['save'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'save' } };
    }),
    ...relationRuleEntries(['lock'], ({ expression, name, args, field, relation, value }) => {
        {
            const lockValue = args[0];
            return relationGate(relationEqual(lockValue, RELATION_NONE), () => {
                return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'custom', value: expression } } };
            }, () => {
                return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'custom', value: lockValue } } };
            });
        }
    }),
    ...relationRuleEntries(['lockForUpdate'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'for_update' } } };
    }),
    ...relationRuleEntries(['sharedLock'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'shared' } } };
    }),
    ...relationRuleEntries(['chunkById', 'chunkByIdDesc'], ({ expression, name, args, field, relation, value }) => {
        {
            const count = args[0];
            const callback = args.find((item) => relationAny([
                relationEqual(item.kind, 'closure'),
                relationEqual(item.kind, 'arrow_function')
            ]));
            return relationGate(relationAny([
                relationEqual(count, RELATION_NONE),
                relationEqual(callback, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const column = relationGate(relationEqual(args[2], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[2])));
                return relationGate(relationAll([
                    relationNotEqual(args[2], RELATION_NONE), relationEqual(column, RELATION_NONE)
                ]), () => {
                    return RELATION_NONE;
                }, () => {
                    const alias = relationGate(relationEqual(args[3], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[3])));
                    return relationGate(relationAll([
                        relationNotEqual(args[3], RELATION_NONE), relationEqual(alias, RELATION_NONE)
                    ]), () => {
                        return RELATION_NONE;
                    }, () => {
                        return { kind: 'instance', operation: { kind: 'chunk_by_id', value: { kind: 'query_chunk_by_id', count, callback, column, alias, direction: relationGate(relationEqual(name, 'chunkByIdDesc'), () => ({ kind: 'descending' }), () => ({ kind: 'ascending' })) } } };
                    });
                });
            });
        }
    }),
    ...relationRuleEntries(['lazyById', 'lazyByIdDesc'], ({ expression, name, args, field, relation, value }) => {
        {
            const chunkSize = args[0];
            const column = relationGate(relationEqual(args[1], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[1])));
            return relationGate(relationAll([
                relationNotEqual(args[1], RELATION_NONE), relationEqual(column, RELATION_NONE)
            ]), () => {
                return RELATION_NONE;
            }, () => {
                const alias = relationGate(relationEqual(args[2], RELATION_NONE), () => (RELATION_NONE), () => (propertyArgument(args[2])));
                return relationGate(relationAll([
                    relationNotEqual(args[2], RELATION_NONE), relationEqual(alias, RELATION_NONE)
                ]), () => {
                    return RELATION_NONE;
                }, () => {
                    return { kind: 'instance', operation: { kind: 'lazy_by_id', value: { kind: 'query_lazy_by_id', chunkSize, column, alias, direction: relationGate(relationEqual(name, 'lazyByIdDesc'), () => ({ kind: 'descending' }), () => ({ kind: 'ascending' })) } } };
                });
            });
        }
    }),
    ...relationRuleEntries(['when', 'unless', 'tap', 'pipe'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationEqual(args.length, 0), () => {
                return RELATION_NONE;
            }, () => {
                const foundCallback = args.find((item) => relationAny([
                    relationEqual(item.kind, 'closure'),
                    relationEqual(item.kind, 'arrow_function')
                ]));
                const callback = relationGate(relationEqual(foundCallback, RELATION_NONE), () => (args[1]), () => (foundCallback));
                return relationGate(relationEqual(callback, RELATION_NONE), () => {
                    return RELATION_NONE;
                }, () => {
                    return relationGate(relationAny([
                        relationEqual(name, 'tap'),
                        relationEqual(name, 'pipe')
                    ]), () => {
                        return { kind: 'instance', operation: { kind: 'pipeline', pipeline: { kind: name, callback } } };
                    }, () => {
                        return { kind: 'instance', operation: { kind: 'pipeline', pipeline: { kind: name, condition: args[0], callback, defaultCallback: args.find((item, index) => relationAll([
                                        relationAll([
                                            index > 0, relationNotEqual(item, callback)
                                        ]),
                                        (relationAny([
                                            relationEqual(item.kind, 'closure'),
                                            relationEqual(item.kind, 'arrow_function')
                                        ]))
                                    ])) } } };
                    });
                });
            });
        }
    }),
    ...relationRuleEntries(['timeout'], ({ expression, name, args, field, relation, value }) => {
        {
            return relationGate(relationEqual(value, RELATION_NONE), () => (RELATION_NONE), () => ({ kind: 'instance', operation: { kind: 'timeout', seconds: value } }));
        }
    }),
    ...relationRuleEntries(['beforeQuery', 'afterQuery'], ({ expression, name, args, field, relation, value }) => {
        {
            const callback = args[0];
            return relationGate(relationEqual(callback, RELATION_NONE), () => {
                return RELATION_NONE;
            }, () => {
                return { kind: 'instance', operation: { kind: 'execution_hook', hook: relationGate(relationEqual(name, 'beforeQuery'), () => ({ kind: 'before_query', callback }), () => ({ kind: 'after_query', callback })) } };
            });
        }
    }),
    ...relationRuleEntries(['useWritePdo'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'execution_configuration', configuration: { kind: 'use_write_pdo' } } };
    }),
    ...relationRuleEntries(['fetchUsing'], ({ expression, name, args, field, relation, value }) => {
        return { kind: 'instance', operation: { kind: 'execution_configuration', configuration: { kind: 'fetch_using', arguments: expression.arguments } } };
    }),
]);
const comparisonOperatorCatalog: readonly (readonly [string, import('../../../types/upstream/expression').ComparisonOperator])[] = [
    ['=', { kind: 'equal' }], ['===', { kind: 'strict_equal' }], ['!=', { kind: 'not_equal' }], ['!==', { kind: 'strict_not_equal' }],
    ['>', { kind: 'greater' }], ['>=', { kind: 'greater_equal' }], ['<', { kind: 'less' }], ['<=', { kind: 'less_equal' }],
    ['like', { kind: 'like' }], ['not like', { kind: 'not_like' }],
];
const comparisonOperator = (expression: Expression): import('../../../types/upstream/expression').ComparisonOperator => relationGate(relationAll([
    relationEqual(expression.kind, 'literal'), relationEqual(expression.value.kind, 'string_literal')
]), () => (relationCatalogValueOr(comparisonOperatorCatalog, expression.value.value.value, { kind: 'equal' })), () => ({ kind: 'equal' }));
type ModelStaticOperationResolver = (expression: RelationVariant<Expression, 'static_method'>, positional: readonly Expression[], field: PropertyName | RelationNone, value: Expression | RelationNone) => RelationOption<QueryOperationAst>;
const modelStaticOperationCatalog: readonly (readonly [string, ModelStaticOperationResolver])[] = [
    ['all', () => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'all' } } })],
    ['query', () => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'query' } } })],
    ['where', (_expression, positional, field) => relationGate(relationAll([
            relationNotEqual(field, RELATION_NONE), positional.length >= 2
        ]), () => {
            const operator = relationGate(positional.length >= 3, () => (comparisonOperator(positional[1])), () => ({ kind: 'equal' as const }));
            const operand = relationGate(positional.length >= 3, () => (positional[2]), () => (positional[1]));
            return relationOptionFold(relationVariant(field, 'some'), () => ({ kind: 'none' }), resolvedField =>
                relationOptionFold(relationVariant(operand, 'some'), () => ({ kind: 'none' }), resolvedOperand =>
                    ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'where', condition: { kind: 'basic', field: resolvedField, operator, value: resolvedOperand } } } })));
        }, () => ({ kind: 'none' }))],
    ['whereKey', (_expression, _positional, _field, value) => relationOptionFold(relationVariant(value, 'some'), () => ({ kind: 'none' }), resolvedValue => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'where_key', value: resolvedValue } } }))],
    ['with', (_expression, positional) => relationOptionFold(relationPathsArgument(positional), () => ({ kind: 'none' }), paths => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'with', relations: { kind: 'relation_paths', items: sequenceFromArray(paths) } } } }))],
    ['orderBy', (_expression, positional) => relationGate(relationNotEqual(orderingTarget(positional[0]), RELATION_NONE), () => {
            const target = relationOptionFold(relationVariant(orderingTarget(positional[0]), 'some'), () => ({ kind: 'expression', expression: positional[0] }), value => value);
            return { kind: 'some', value: { kind: 'model_static', operation: { kind: 'order_by', target, direction: orderingDirection(positional[1]) } } };
        }, () => ({ kind: 'none' }))],
    ['orderByAsc', (_expression, positional) => relationGate(relationNotEqual(orderingTarget(positional[0]), RELATION_NONE), () => {
            const target = relationOptionFold(relationVariant(orderingTarget(positional[0]), 'some'), () => ({ kind: 'expression', expression: positional[0] }), value => value);
            return { kind: 'some', value: { kind: 'model_static', operation: { kind: 'order_by', target, direction: orderingDirection(positional[1]) } } };
        }, () => ({ kind: 'none' }))],
    ['orderByDesc', (_expression, positional) => relationGate(relationNotEqual(orderingTarget(positional[0]), RELATION_NONE), () => {
            const target = relationOptionFold(relationVariant(orderingTarget(positional[0]), 'some'), () => ({ kind: 'expression', expression: positional[0] }), value => value);
            return { kind: 'some', value: { kind: 'model_static', operation: { kind: 'order_by', target, direction: { kind: 'descending' } } } };
        }, () => ({ kind: 'none' }))],
    ['select', expression => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'select', projection: { kind: 'columns', arguments: expression.arguments } } } })],
    ['findOrFail', (_expression, _positional, _field, value) => relationOptionFold(relationVariant(value, 'some'), () => ({ kind: 'none' }), resolvedValue => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'find_or_fail', key: resolvedValue } } }))],
    ['create', (_expression, _positional, _field, value) => relationOptionFold(relationVariant(value, 'some'), () => ({ kind: 'none' }), resolvedValue => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'create', values: resolvedValue } } }))],
    ['updateOrCreate', (_expression, positional) => relationGate(positional.length >= 2, () => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'update_or_create', lookup: positional[0], values: positional[1] } } }), () => ({ kind: 'none' }))],
    ['firstOrCreate', (_expression, positional) => relationGate(positional.length >= 2, () => ({ kind: 'some', value: { kind: 'model_static', operation: { kind: 'first_or_create', attributes: positional[0], values: positional[1] } } }), () => ({ kind: 'none' }))],
];
const modelStaticOperationFromExpression = (expression: RelationVariant<Expression, 'static_method'>): RelationOption<QueryOperationAst> => relationGate(relationAll([
    relationEqual(expression.action.kind, 'domain'), relationEqual(expression.receiver.kind, 'class')
]), () => {
    const name = expression.action.name.value.value;
    const positional = sequenceArgumentExpressions(expression.arguments);
    const field = propertyArgument(positional[0]);
    const value = positional[positional.length - 1];
    return relationOptionFold(
        relationLookup(modelStaticOperationCatalog, name),
        () => ({ kind: 'none' as const }),
        resolver => resolver(expression, positional, field, value),
    );
}, () => ({ kind: 'none' }));
type ExpressionArgumentRule = (expression: Expression) => readonly Expression[];
const expressionArgumentRule = <K extends Expression['kind']>(kind: K, resolve: (expression: RelationVariant<Expression, K>) => readonly Expression[]): readonly [
    K,
    ExpressionArgumentRule
] => [kind, expression => resolve(relationVariantValue(expression, kind))];
const expressionArgumentCatalog: readonly (readonly [Expression['kind'], ExpressionArgumentRule])[] = Object.freeze([
    expressionArgumentRule('method', expression => [expression.receiver, ...sequenceArgumentExpressions(expression.arguments)]),
    expressionArgumentRule('nullsafe_method', expression => [expression.receiver, ...sequenceArgumentExpressions(expression.arguments)]),
    expressionArgumentRule('static_method', expression => sequenceArgumentExpressions(expression.arguments)),
    expressionArgumentRule('closure', expression => closureExpressions(expression.value)),
    expressionArgumentRule('arrow_function', expression => [expression.body]),
    expressionArgumentRule('binary', expression => [expression.left, expression.right]),
    expressionArgumentRule('unary', expression => [expression.operand]),
    expressionArgumentRule('cast', expression => [expression.expression]),
    expressionArgumentRule('coalesce', expression => [expression.left, expression.right]),
    expressionArgumentRule('property', expression => [expression.receiver]),
    expressionArgumentRule('relation', expression => [expression.receiver]),
    expressionArgumentRule('nullsafe_property', expression => [expression.receiver]),
    expressionArgumentRule('index', expression => [expression.receiver, expression.key]),
    expressionArgumentRule('conditional', expression => [expression.condition, expression.branches.whenTrue, ...(relationGate(relationEqual(expression.branches.kind, 'then_else'), () => ([expression.branches.whenFalse]), () => ([])))]),
    expressionArgumentRule('short_conditional', expression => [expression.condition, expression.whenFalse]),
    expressionArgumentRule('array', expression => arrayArgumentExpressions(expression)),
    expressionArgumentRule('object', expression => sequenceObjectExpressions(expression.properties)),
    expressionArgumentRule('match', expression => [expression.subject, ...sequenceMatchExpressions(expression.arms)]),
    expressionArgumentRule('builtin', expression => sequenceArgumentExpressions(expression.arguments)),
    expressionArgumentRule('call', expression => sequenceArgumentExpressions(expression.arguments)),
    expressionArgumentRule('callable_call', expression => [...sequenceArgumentExpressions(expression.arguments), expression.callable]),
    expressionArgumentRule('construct', expression => sequenceArgumentExpressions(expression.arguments)),
    expressionArgumentRule('dynamic_construct', expression => [...sequenceArgumentExpressions(expression.arguments), expression.classExpression]),
    expressionArgumentRule('anonymous_class', expression => relationGate(relationEqual(expression.arguments.items.kind, 'empty'), () => ([]), () => (sequenceArgumentExpressions(expression.arguments)))),
    expressionArgumentRule('assignment_expression', expression => [expression.value.expression]),
]);
type OperationResolution = (expression: Expression) => RelationOption<QueryOperationAst>;
const operationRule = <K extends Expression['kind']>(kind: K, resolve: (expression: RelationVariant<Expression, K>) => RelationOption<QueryOperationAst>): readonly [K, OperationResolution] => [kind, expression => relationOptionFold(relationVariant(expression, kind), () => relationNone(), resolve)];
const operationCatalog: readonly (readonly [Expression['kind'], OperationResolution])[] = Object.freeze([
    operationRule('method', expression => queryOperationFromNamedMethod(expression)),
    operationRule('nullsafe_method', expression => queryOperationFromNamedMethod(expression)),
    operationRule('static_method', expression => relationGate(relationEqual(expression.action.kind, 'model'), () => relationSome({ kind: 'model_static', operation: expression.action.operation }), () => relationGate(relationEqual(expression.action.kind, 'database_table'), () => relationSome({ kind: 'database_table', expression }), () => modelStaticOperationFromExpression(expression)))),
]);
const operationFromExpression = (expression: Expression): RelationOption<QueryOperationAst> => relationOptionFold(relationLookup(operationCatalog, expression.kind), () => relationNone(), resolver => resolver(expression));
const argumentExpressions = (expression: Expression): readonly Expression[] => relationOptionFold(
    relationLookup(expressionArgumentCatalog, expression.kind),
    () => [],
    resolver => resolver(expression),
);
const sequenceArgumentExpressions = (arguments_: import('../../../types/upstream/expression').ExpressionArguments): readonly Expression[] => {
    const visit = (items: typeof arguments_.items): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => ([]), () => ([items.head, ...visit(items.tail)]));
    return visit(arguments_.items);
};
const sequenceObjectExpressions = (properties: import('../../../types/upstream/collections').ObjectProperties): readonly Expression[] => {
    const visit = (items: typeof properties.items): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => ([]), () => ([items.head.value, ...visit(items.tail)]));
    return visit(properties.items);
};
const sequenceMatchExpressions = (arms: import('../../../types/upstream/collections').MatchArms): readonly Expression[] => {
    const visit = (items: typeof arms.items): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => ([]), () => ([
            ...(relationGate(relationEqual(items.head.kind, 'conditional'), () => (sequenceExpressionValues(items.head.conditions)), () => ([]))),
            items.head.result,
            ...visit(items.tail),
        ]));
    return visit(arms.items);
};
const sequenceExpressionValues = (expressions: import('../../../types/upstream/collections').Expressions): readonly Expression[] => {
    const visit = (items: typeof expressions.items): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => ([]), () => ([items.head, ...visit(items.tail)]));
    return visit(expressions.items);
};
const closureExpressionCatalog: readonly (readonly [string, (body: import('../../../types/upstream/expression').ClosureBody) => readonly Expression[]])[] = [
    ['expression_body', body => [body.expression]],
    ['statement_body', body => sequenceExpressions(body.statements)],
];
const closureExpressions = (closure: import('../../../types/upstream/expression').Closure): readonly Expression[] => relationOptionFold(
    relationLookup(closureExpressionCatalog, closure.body.kind),
    () => [],
    resolver => resolver(closure.body),
);
const closureStatementCatalog: readonly (readonly [string, (statement: import('../../../types/upstream/expression').ClosureStatement) => readonly Expression[]])[] = [
    ['expression', statement => [statement.expression]],
    ['return_value', statement => [statement.expression]],
    ['return_void', () => []],
    ['assignment', statement => [statement.value.expression]],
    ['if', statement => [
            statement.condition,
            ...sequenceExpressions(statement.thenBlock),
            ...relationGate(relationEqual(statement.alternative.kind, 'else_block'), () => sequenceExpressions(statement.alternative.block), () => relationGate(relationEqual(statement.alternative.kind, 'else_if'), () => closureStatementExpressions(statement.alternative.statement), () => [])),
        ]],
    ['foreach', statement => [statement.iterable, ...sequenceExpressions(statement.body)]],
    ['for', statement => [
            ...forClauseExpressions(statement.initializer),
            ...forClauseExpressions(statement.condition),
            ...forClauseExpressions(statement.update),
            ...sequenceExpressions(statement.body),
        ]],
    ['try', statement => [
            ...sequenceExpressions(statement.body),
            ...sequenceCatches(statement.catches),
            ...relationGate(relationEqual(statement.finallyBlock.kind, 'present'), () => sequenceExpressions(statement.finallyBlock.block), () => []),
        ]],
    ['throw', statement => [statement.expression]],
];
const closureStatementExpressions = (statement: import('../../../types/upstream/expression').ClosureStatement): readonly Expression[] => relationOptionFold(
    relationLookup(closureStatementCatalog, statement.kind),
    () => [],
    resolver => resolver(statement),
);
const sequenceCatches = (catches: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/expression').ClosureCatchClause>): readonly Expression[] => relationGate(relationEqual(catches.kind, 'empty'), () => ([]), () => ([...sequenceExpressions(catches.head.body), ...sequenceCatches(catches.tail)]));
const sequenceExpressions = (statements: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/expression').ClosureStatement>): readonly Expression[] => relationGate(relationEqual(statements.kind, 'empty'), () => ([]), () => ([...closureStatementExpressions(statements.head), ...sequenceExpressions(statements.tail)]));
const forClauseCatalog: readonly (readonly [string, (clause: import('../../../types/upstream/expression').ClosureForClause) => readonly Expression[]])[] = [
    ['empty', () => []],
    ['expression', clause => [clause.value]],
    ['assignment', clause => [clause.value.value]],
];
const forClauseExpressions = (clause: import('../../../types/upstream/expression').ClosureForClause): readonly Expression[] => relationOptionFold(
    relationLookup(forClauseCatalog, clause.kind),
    () => [],
    resolver => resolver(clause),
);
const arrayArgumentExpressions = (expression: RelationVariant<Expression, 'array'>): readonly Expression[] => {
    const visit = (items: typeof expression.entries): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => ([]), () => ([
        ...(relationGate(relationEqual(items.head.kind, 'keyed'), () => ([items.head.key]), () => ([]))),
        items.head.value,
        ...visit(items.tail),
    ]));
    return visit(expression.entries);
};
const arrayExpressionItems = (expression: RelationVariant<Expression, 'array'>): Expression[] => {
    const visit = (items: typeof expression.entries): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => ([]), () => ([items.head.value, ...visit(items.tail)]));
    return [...visit(expression.entries)];
};
const queryDateRelativeCatalog: readonly (readonly [string, import('../../../types/upstream/expression').QueryDateRelative])[] = [
    ['whereToday', { kind: 'today' }], ['orWhereToday', { kind: 'today' }],
    ['whereBeforeToday', { kind: 'before_today' }], ['orWhereBeforeToday', { kind: 'before_today' }],
    ['whereAfterToday', { kind: 'after_today' }], ['orWhereAfterToday', { kind: 'after_today' }],
    ['whereTodayOrBefore', { kind: 'today_or_before' }], ['orWhereTodayOrBefore', { kind: 'today_or_before' }],
    ['whereTodayOrAfter', { kind: 'today_or_after' }], ['orWhereTodayOrAfter', { kind: 'today_or_after' }],
    ['wherePast', { kind: 'past' }], ['orWherePast', { kind: 'past' }],
    ['whereFuture', { kind: 'future' }], ['orWhereFuture', { kind: 'future' }],
    ['whereNowOrPast', { kind: 'now_or_past' }], ['orWhereNowOrPast', { kind: 'now_or_past' }],
    ['whereNowOrFuture', { kind: 'now_or_future' }], ['orWhereNowOrFuture', { kind: 'now_or_future' }],
];
const queryDateRelative = (name: string): import('../../../types/upstream/expression').QueryDateRelative => relationCatalogValueOr(queryDateRelativeCatalog, name, { kind: 'today' });
const queryDatePartCatalog: readonly (readonly [string, import('../../../types/upstream/expression').QueryDatePart])[] = [
    ['whereDate', { kind: 'date' }], ['orWhereDate', { kind: 'date' }],
    ['whereMonth', { kind: 'month' }], ['orWhereMonth', { kind: 'month' }],
    ['whereDay', { kind: 'day' }], ['orWhereDay', { kind: 'day' }],
    ['whereYear', { kind: 'year' }], ['orWhereYear', { kind: 'year' }],
    ['whereTime', { kind: 'time' }], ['orWhereTime', { kind: 'time' }],
];
const queryDatePart = (name: string): import('../../../types/upstream/expression').QueryDatePart => relationCatalogValueOr(queryDatePartCatalog, name, { kind: 'date' });
const sequenceFromArray = <T>(items: readonly T[], index = 0): Sequence<T> => relationGate(index >= items.length, () => ({ kind: 'empty' }), () => ({ kind: 'cons', head: items[index], tail: sequenceFromArray(items, relationAdvanceIndex(index, 1)) }));
const queryChainOperations = (expression: Expression): readonly QueryOperationAst[] => {
    const operations: QueryOperationAst[] = [];
    const visit = (current: Expression): void => {
        const operation = operationFromExpression(current);
        relationGate(relationAny([
            relationEqual(current.kind, 'method'),
            relationEqual(current.kind, 'nullsafe_method')
        ]), () => { visit(current.receiver); return RELATION_NONE; }, () => RELATION_NONE);
        relationOptionFold(operation, () => { }, value => { operations.push(value); });
    };
    visit(expression);
    return operations;
};
const subqueryRoleCatalog: readonly (readonly [string, import('../../../types/upstream/query').QuerySubqueryRole])[] = [
    ['selectSub', { kind: 'select' }], ['fromSub', { kind: 'from' }],
    ['whereExists', { kind: 'where_exists' }], ['orWhereExists', { kind: 'where_exists' }],
    ['whereNotExists', { kind: 'where_exists' }], ['orWhereNotExists', { kind: 'where_exists' }],
    ['whereIn', { kind: 'where_in' }], ['whereNotIn', { kind: 'where_in' }],
    ['orWhereIn', { kind: 'where_in' }], ['orWhereNotIn', { kind: 'where_in' }],
    ['where', { kind: 'where_scalar' }], ['orWhere', { kind: 'where_scalar' }],
    ['joinSub', { kind: 'join' }], ['leftJoinSub', { kind: 'join' }], ['rightJoinSub', { kind: 'join' }],
    ['crossJoinSub', { kind: 'join' }], ['straightJoinSub', { kind: 'join' }],
    ['joinLateral', { kind: 'lateral_join' }], ['leftJoinLateral', { kind: 'lateral_join' }],
    ['union', { kind: 'union' }], ['unionAll', { kind: 'union' }],
    ['whereHas', { kind: 'relation' }], ['whereDoesntHave', { kind: 'relation' }], ['withWhereHas', { kind: 'relation' }],
];
const subqueryRole = (parent: Expression, child: Expression): import('../../../types/upstream/query').QuerySubqueryRole => relationGate(relationAny([
    relationEqual(parent.kind, 'method'),
    relationEqual(parent.kind, 'nullsafe_method')
]), () => relationGate(relationEqual(parent.operation.kind, 'domain'), () => relationCatalogValueOr(subqueryRoleCatalog, parent.operation.name.value.value, { kind: 'nested' }), () => ({ kind: 'nested' })), () => ({ kind: 'nested' }));
const subqueryAlias = (parent: Expression, child: Expression): import('../../../types/upstream/collections').Option<Expression> => {
    const method = relationAny([
        relationEqual(parent.kind, 'method'),
        relationEqual(parent.kind, 'nullsafe_method')
    ]);
    const domain = relationAll([
        method, relationEqual(parent.operation.kind, 'domain')
    ]);
    const name = relationGate(domain, () => (parent.operation.name.value.value), () => (''));
    const args = relationGate(method, () => (positionalArguments(parent)), () => ([]));
    const targetIndex = args.indexOf(child);
    const aliasBearing = ['selectSub', 'fromSub', 'joinSub', 'leftJoinSub', 'rightJoinSub', 'crossJoinSub', 'straightJoinSub', 'joinLateral', 'leftJoinLateral'].includes(name);
    const aliasIndex = relationGate(aliasBearing, () => (targetIndex + 1), () => (-1));
    const alias = relationGate(relationAll([
        aliasIndex >= 0, aliasIndex < args.length
    ]), () => (args[aliasIndex]), () => (RELATION_NONE));
    return relationOptionFold(relationVariant(alias, 'some'),
        () => ({ kind: 'none' }),
        value => relationOptionFold(solveCandidate([
            { id: 'some', value: { kind: 'some', value }, requirements: [requirement('method-domain', domain), requirement('alias-index', relationNotEqual(alias, RELATION_NONE))] },
            { id: 'none', value: { kind: 'none' }, requirements: [requirement('fallback', true)] },
        ]), () => ({ kind: 'none' }), candidate => candidate));
};
const closureCaptureSequence = (items: RelationVariant<Expression, 'closure'>['value']['captures']['items'], source: Expression['source'], output: Expression[] = []): readonly Expression[] => relationGate(relationEqual(items.kind, 'empty'), () => output, () => closureCaptureSequence(items.tail, source, output.concat([{ kind: 'variable', name: items.head.variable, source }])));
const closureCaptureExpressions = (expression: Expression): readonly Expression[] => relationGate(relationEqual(expression.kind, 'closure'), () => closureCaptureSequence(expression.value.captures.items, expression.source), () => []);
const subqueryCorrelation = (expression: Expression): import('../../../types/upstream/query').QuerySubqueryCorrelation => {
    const references = closureCaptureExpressions(expression);
    return relationGate(relationEqual(references.length, 0), () => {
        return { kind: 'uncorrelated' };
    }, () => {
        return {
            kind: 'correlated',
            references: sequenceFromArray(relationProject(references, reference => ({
                kind: 'query_outer_reference' as const,
                expression: reference,
                source: reference.source,
            }))),
        };
    });
};
const nestedQueriesFromExpression = (expression: Expression, inheritedRole: import('../../../types/upstream/query').QuerySubqueryRole = { kind: 'nested' }): readonly QuerySubqueryAst[] => relationExpand(argumentExpressions(expression), child => {
    const operation = operationFromExpression(child);
    const role = relationGate(relationAny([
        relationEqual(expression.kind, 'method'),
        relationEqual(expression.kind, 'nullsafe_method')
    ]), () => (subqueryRole(expression, child)), () => (inheritedRole));
    const nested = nestedQueriesFromExpression(child, role);
    return relationOptionFold(operation, () => nested, () => {
        const model = relationOptionFold(modelFromReceiver(child), () => ({ kind: 'indeterminate' as const }), name => ({ kind: 'known' as const, name }));
        return [{ kind: 'query_subquery_ast', operations: sequenceFromArray(queryChainOperations(child)), role, alias: subqueryAlias(expression, child), correlation: subqueryCorrelation(child), expression: child, model, source: child.source, nestedQueries: nested }];
    });
});
export const queryEvidenceProducer: QueryProducer = {
    produce: ({ expressions }) => relationExpand(expressions, expressionAst => {
        const operation = operationFromExpression(expressionAst.semantic);
        return relationOptionFold(operation, () => [], () => {
            const model = relationOptionFold(modelFromReceiver(expressionAst.semantic), () => ({ kind: 'indeterminate' as const }), name => ({ kind: 'known' as const, name }));
            return [{ kind: 'query_ast', operations: sequenceFromArray(queryChainOperations(expressionAst.semantic)), expression: expressionAst, model, source: expressionAst.provenance.source, nestedQueries: nestedQueriesFromExpression(expressionAst.semantic) }];
        });
    }),
};
