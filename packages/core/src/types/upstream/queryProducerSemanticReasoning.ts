import type { ArrayEntry, Expression, ModelStaticOperation, OrderDirection, QueryColumnReference, QueryDatePart, QueryDateRelative, QueryGrouping, QueryJoin, QueryJoinConstraint, QueryOrderingTarget, QueryRelationAggregate, QueryRelationAggregateFunction } from './expression';
import type { SourceSpan } from './provenance';
import { descriptionText, numberValue, stringValue } from './valueObjects';
import type { RelationPath, PropertyNames } from './collections';
import type { PropertyName, RelationName } from './names';
import { createModelName, createPropertyName, createRelationName, type MethodName } from './names';
import { RELATION_NONE, type RelationOption } from '../../semantic/relations/relationalSequence';
type RelationNoneValue = typeof RELATION_NONE;
import { relationAdvanceIndex, relationAll, relationGate, relationLookup, relationNone, relationOptionFold, relationProject, relationSome, relationVariant, relationTextSlice } from '../../semantic/relations/relationalSequence';
import { relationEqual, relationAny } from '../../semantic/relations/semanticRelations';
import { validateQueryOperationSemanticDecision, validateQueryOperationSemanticRuleCatalog, type QueryArgumentPosition, type QueryJoinDescriptor, type QueryOperationEvidence, type QueryOperationSemanticEvidenceBoundExecution, type QueryOperationSemanticSourceEvidence, type QueryOperationSemanticDecision, type QueryOperationSemanticRule, type QueryOperationSemanticRuleClaim, type QueryOperationSemanticRuleDeclaration, type QueryOperationSemanticRuleDeclarationFor, type QueryOperationSemanticRuleExecution, type QueryProducerSemanticInterface, type QueryProducerSemanticJudgment, type QuerySemanticDiagnostic, type ResolvedModelStaticOperation } from './queryProducerSemanticInterface';
import type { QueryOperationAst } from './query';

const aggregateCatalog: readonly (readonly [string, QueryRelationAggregateFunction])[] = Object.freeze([
  ['withCount', { kind: 'count' }], ['loadCount', { kind: 'count' }],
  ['withMin', { kind: 'min' }], ['loadMin', { kind: 'min' }],
  ['withMax', { kind: 'max' }], ['loadMax', { kind: 'max' }],
  ['withAvg', { kind: 'avg' }], ['loadAvg', { kind: 'avg' }],
  ['withSum', { kind: 'sum' }], ['loadSum', { kind: 'sum' }],
  ['withExists', { kind: 'exists' }], ['loadExists', { kind: 'exists' }],
]);

const argumentPosition = (value: number): QueryArgumentPosition => Object.freeze({ kind: 'query_argument_position', value: numberValue(value) });

const joinDescriptor = (
  target: QueryJoinDescriptor['target'],
  type: QueryJoinDescriptor['type'],
  aliasIndex: RelationOption<QueryArgumentPosition>,
  constraintIndex: RelationOption<QueryArgumentPosition>,
): QueryJoinDescriptor => Object.freeze({ target, type, aliasIndex, constraintIndex });

const joinCatalog: readonly (readonly [string, QueryJoinDescriptor])[] = Object.freeze([
  ['join', joinDescriptor('table', 'inner', relationNone(), relationSome(argumentPosition(1)))],
  ['leftJoin', joinDescriptor('table', 'left', relationNone(), relationSome(argumentPosition(1)))],
  ['rightJoin', joinDescriptor('table', 'right', relationNone(), relationSome(argumentPosition(1)))],
  ['crossJoin', joinDescriptor('table', 'cross', relationNone(), relationSome(argumentPosition(1)))],
  ['joinSub', joinDescriptor('subquery', 'inner', relationSome(argumentPosition(1)), relationSome(argumentPosition(2)))],
  ['leftJoinSub', joinDescriptor('subquery', 'left', relationSome(argumentPosition(1)), relationSome(argumentPosition(2)))],
  ['rightJoinSub', joinDescriptor('subquery', 'right', relationSome(argumentPosition(1)), relationSome(argumentPosition(2)))],
  ['crossJoinSub', joinDescriptor('subquery', 'cross', relationSome(argumentPosition(1)), relationSome(argumentPosition(2)))],
  ['joinLateral', joinDescriptor('lateral', 'inner', relationSome(argumentPosition(1)), relationNone())],
  ['leftJoinLateral', joinDescriptor('lateral', 'left', relationSome(argumentPosition(1)), relationNone())],
  ['straightJoin', joinDescriptor('table', 'straight', relationNone(), relationSome(argumentPosition(1)))],
  ['straightJoinSub', joinDescriptor('subquery', 'straight', relationSome(argumentPosition(1)), relationSome(argumentPosition(2)))],
]);

const resolved = <T>(value: T): QueryProducerSemanticJudgment<T> => Object.freeze({ kind: 'resolved', value });

const relationSegments = (names: readonly string[], index = names.length - 1, tail: RelationPath['segments'] = { kind: 'empty' }): RelationPath['segments'] =>
  relationGate(index < 0, () => tail, () => relationSegments(names, relationAdvanceIndex(index, -1), { kind: 'cons', head: createRelationName(names[index]), tail }));

const propertySegments = (columns: readonly string[], index = columns.length - 1, tail: PropertyNames['items'] = { kind: 'empty' }): PropertyNames['items'] =>
  relationGate(index < 0, () => tail, () => propertySegments(columns, relationAdvanceIndex(index, -1), { kind: 'cons', head: createPropertyName(columns[index]), tail }));

const stringLiteralValue = (expression: Expression): RelationOption<string> => relationOptionFold(
  relationVariant(expression, 'literal'),
  () => relationNone(),
  literal => relationOptionFold(
    relationVariant(literal.value, 'string_literal'),
    () => relationNone(),
    stringLiteral => relationSome(stringLiteral.value.value),
  ),
);

const rewriteStringLiteral = (expression: Expression, value: string): RelationOption<Expression> => relationOptionFold(
  relationVariant(expression, 'literal'),
  () => relationNone(),
  literal => relationOptionFold(
    relationVariant(literal.value, 'string_literal'),
    () => relationNone(),
    stringLiteral => relationSome({
      kind: 'literal', source: literal.source, value: { ...stringLiteral, value: { ...stringLiteral.value, value } },
    }),
  ),
);

const relationPathArgument = (expression: Expression): RelationOption<RelationPath> => relationOptionFold(
  relationVariant(expression, 'literal'),
  () => relationNone(),
  literal => relationOptionFold(
    relationVariant(literal.value, 'string_literal'),
    () => relationNone(),
    stringLiteral => {
      const parts = stringLiteral.value.value.split(':');
      const pathText = parts[0] ?? '';
      const names = pathText.split('.');
      const validNames = relationAll([names.length > 0, relationAll(relationProject(names, name => name.length > 0))]);
      return relationGate(validNames && parts.length <= 2, () => {
        const selectionText = parts[1];
        const validColumns = selectionText === undefined || relationAll([
          selectionText.length > 0,
          relationAll(relationProject(selectionText.split(','), column => column.length > 0)),
        ]);
        return relationGate(validColumns, () => relationSome({
          kind: 'relation_path',
          segments: relationSegments(names),
          selectedColumns: selectionText === undefined
            ? { kind: 'none' as const }
            : { kind: 'some' as const, value: { kind: 'property_names' as const, items: propertySegments(selectionText.split(',')) } },
        }), () => relationNone());
      }, () => relationNone());
    },
  ),
);

const semanticDiagnostic = (message: string): QuerySemanticDiagnostic => Object.freeze({ kind: 'query_semantic_diagnostic', message: descriptionText.create(stringValue.create(message)) });
const malformed = <T>(diagnostic: string): QueryProducerSemanticJudgment<T> => Object.freeze({ kind: 'malformed', diagnostic: semanticDiagnostic(diagnostic) });
const malformedWithDiagnostic = <T>(diagnostic: QuerySemanticDiagnostic): QueryProducerSemanticJudgment<T> => Object.freeze({ kind: 'malformed', diagnostic });


type QueryJsonPredicateDescriptor = Readonly<{
  readonly junction: 'where' | 'or_where';
  readonly condition: 'contains' | 'doesnt_contain' | 'contains_key' | 'doesnt_contain_key' | 'length' | 'overlaps' | 'doesnt_overlap';
}>;
const jsonPredicateCatalog: readonly (readonly [string, QueryJsonPredicateDescriptor])[] = Object.freeze([
  ['whereJsonContains', Object.freeze({ junction: 'where', condition: 'contains' })],
  ['whereJsonDoesntContain', Object.freeze({ junction: 'where', condition: 'doesnt_contain' })],
  ['whereJsonContainsKey', Object.freeze({ junction: 'where', condition: 'contains_key' })],
  ['whereJsonDoesntContainKey', Object.freeze({ junction: 'where', condition: 'doesnt_contain_key' })],
  ['whereJsonLength', Object.freeze({ junction: 'where', condition: 'length' })],
  ['whereJsonOverlaps', Object.freeze({ junction: 'where', condition: 'overlaps' })],
  ['whereJsonDoesntOverlap', Object.freeze({ junction: 'where', condition: 'doesnt_overlap' })],
  ['orWhereJsonContains', Object.freeze({ junction: 'or_where', condition: 'contains' })],
  ['orWhereJsonDoesntContain', Object.freeze({ junction: 'or_where', condition: 'doesnt_contain' })],
  ['orWhereJsonContainsKey', Object.freeze({ junction: 'or_where', condition: 'contains_key' })],
  ['orWhereJsonDoesntContainKey', Object.freeze({ junction: 'or_where', condition: 'doesnt_contain_key' })],
  ['orWhereJsonLength', Object.freeze({ junction: 'or_where', condition: 'length' })],
  ['orWhereJsonOverlaps', Object.freeze({ junction: 'or_where', condition: 'overlaps' })],
  ['orWhereJsonDoesntOverlap', Object.freeze({ junction: 'or_where', condition: 'doesnt_overlap' })],
]);

const resolveJsonCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> =>
  relationOptionFold(relationLookup(jsonPredicateCatalog, methodName.value.value), () => notApplicable(), descriptor => {
    const targetEvidence = arguments_[0];
    if (targetEvidence === undefined) return malformed(`${methodName.value.value} requires a JSON column`);
    const target = resolvePropertyName(targetEvidence);
    if (target.kind !== 'resolved') return malformedWithDiagnostic(target.kind === 'malformed' ? target.diagnostic : semanticDiagnostic('JSON column is missing'));

    const targetParts = target.value.value.value.split('->');
    const column = createPropertyName(targetParts[0]);
    const pathText = targetParts.slice(1).join('->');
    const path: Expression = {
      kind: 'literal',
      value: { kind: 'string_literal', value: { kind: 'string_value', value: pathText } },
      source: targetEvidence.source,
    };
    const value = arguments_[1];
    let condition: import('./expression').QueryJsonCondition;

    switch (descriptor.condition) {
      case 'contains':
      case 'doesnt_contain':
      case 'overlaps':
      case 'doesnt_overlap':
        if (value === undefined) return malformed(`${methodName.value.value} requires a comparison value`);
        condition = { kind: descriptor.condition, column, path, value };
        break;
      case 'contains_key':
      case 'doesnt_contain_key':
        if (arguments_.length !== 1) return malformed(`${methodName.value.value} accepts only the JSON column and path`);
        condition = { kind: descriptor.condition, column, path };
        break;
      case 'length': {
        const hasExplicitOperator = arguments_.length >= 3;
        const length = hasExplicitOperator ? arguments_[2] : arguments_[1];
        if (length === undefined) return malformed(`${methodName.value.value} requires a length value`);
        const operatorEvidence = hasExplicitOperator ? stringLiteralValue(arguments_[1]) : relationSome('=');
        if (operatorEvidence.kind !== 'some') return malformed('JSON length operator must be a supported string literal');
        const operator = relationLookup(comparisonOperatorCatalog, operatorEvidence.value.toLowerCase());
        if (operator.kind !== 'some') return malformed(`unsupported JSON length operator: ${operatorEvidence.value}`);
        condition = { kind: 'length', column, path, operator: operator.value, length };
        break;
      }
      default: {
        const exhaustiveCondition: never = descriptor.condition;
        return malformed(`unsupported JSON predicate condition: ${exhaustiveCondition}`);
      }
    }

    return resolved({ kind: 'instance', operation: { kind: descriptor.junction, condition: { kind: 'json', condition } } });
  });

type QueryRowValueDescriptor = Readonly<{ readonly junction: 'where' | 'or_where' }>;
const rowValuePredicateCatalog: readonly (readonly [string, QueryRowValueDescriptor])[] = Object.freeze([
  ['whereRowValues', Object.freeze({ junction: 'where' })],
  ['orWhereRowValues', Object.freeze({ junction: 'or_where' })],
]);

const queryColumnReferencesFromEntries = (
  entries: import('./collections').Sequence<ArrayEntry>,
  output: readonly QueryColumnReference[] = [],
): QueryProducerSemanticJudgment<readonly QueryColumnReference[]> => {
  if (entries.kind === 'empty') return output.length > 0 ? resolved(output) : malformed('row-value predicate requires at least one column');
  if (entries.head.kind !== 'implicit') return malformed('row-value column list must contain positional column names');
  const column = resolvePropertyName(entries.head.value);
  if (column.kind !== 'resolved') return malformedWithDiagnostic(column.kind === 'malformed' ? column.diagnostic : semanticDiagnostic('row-value column name is missing'));
  return queryColumnReferencesFromEntries(entries.tail, output.concat([{
    kind: 'query_column_reference', expression: entries.head.value, source: entries.head.source,
  }]));
};

const resolveRowValueCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> =>
  relationOptionFold(relationLookup(rowValuePredicateCatalog, methodName.value.value), () => notApplicable(), descriptor => {
    const columnsEvidence = arguments_[0];
    const operatorEvidence = arguments_[1];
    const values = arguments_[2];
    if (columnsEvidence === undefined || operatorEvidence === undefined || values === undefined) {
      return malformed(`${methodName.value.value} requires columns, operator, and values`);
    }
    const columns = relationVariant(columnsEvidence, 'array');
    if (columns.kind !== 'some') return malformed('row-value columns must be an array of column names');
    const columnReferences = queryColumnReferencesFromEntries(columns.value.entries);
    if (columnReferences.kind !== 'resolved') return columnReferences;
    const operatorText = stringLiteralValue(operatorEvidence);
    if (operatorText.kind !== 'some') return malformed('row-value operator must be a supported string literal');
    const operator = relationLookup(comparisonOperatorCatalog, operatorText.value.toLowerCase());
    if (operator.kind !== 'some') return malformed(`unsupported row-value operator: ${operatorText.value}`);
    const condition = {
      kind: 'row_values' as const,
      columns: { kind: 'query_column_list' as const, columns: sequenceOf(columnReferences.value) },
      operator: operator.value,
      values,
    };
    return resolved({ kind: 'instance', operation: { kind: descriptor.junction, condition } });
  });

type QueryColumnComparisonDescriptor = Readonly<{ readonly junction: 'where' | 'or_where' }>;
const columnComparisonPredicateCatalog: readonly (readonly [string, QueryColumnComparisonDescriptor])[] = Object.freeze([
  ['whereColumn', Object.freeze({ junction: 'where' })],
  ['orWhereColumn', Object.freeze({ junction: 'or_where' })],
]);

const resolveColumnReference = (evidence: Expression): QueryProducerSemanticJudgment<QueryColumnReference> => {
  const property = resolvePropertyName(evidence);
  if (property.kind !== 'resolved') return property.kind === 'malformed' ? malformedWithDiagnostic(property.diagnostic) : malformed('column comparison requires a column name');
  return resolved({ kind: 'query_column_reference', expression: evidence, source: evidence.source });
};

const resolveColumnComparisonPairs = (
  entries: import('./collections').Sequence<ArrayEntry>,
  output: readonly import('./expression').QueryColumnComparison[] = [],
): QueryProducerSemanticJudgment<readonly import('./expression').QueryColumnComparison[]> => {
  if (entries.kind === 'empty') return output.length > 0 ? resolved(output) : malformed('column comparison requires at least one column pair');
  if (entries.head.kind !== 'implicit' || entries.head.value.kind !== 'array') return malformed('column comparison pairs must be positional two-column arrays');
  const pair = entries.head.value.entries;
  if (pair.kind !== 'cons' || pair.tail.kind !== 'cons' || pair.tail.tail.kind !== 'empty') return malformed('each column comparison pair must contain exactly two columns');
  const left = resolveColumnReference(pair.head.value);
  if (left.kind !== 'resolved') return left;
  const right = resolveColumnReference(pair.tail.head.value);
  if (right.kind !== 'resolved') return right;
  return resolveColumnComparisonPairs(entries.tail, output.concat([{
    kind: 'query_column_comparison', left: left.value, operator: { kind: 'equal' }, right: right.value,
  }]));
};

const resolveColumnComparisonCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> =>
  relationOptionFold(relationLookup(columnComparisonPredicateCatalog, methodName.value.value), () => notApplicable(), descriptor => {
    const first = arguments_[0];
    if (first === undefined) return malformed(`${methodName.value.value} requires column evidence`);
    if (first.kind === 'array') {
      const comparisons = resolveColumnComparisonPairs(first.entries);
      if (comparisons.kind !== 'resolved') return comparisons;
      return resolved({ kind: 'instance', operation: { kind: descriptor.junction, condition: {
        kind: 'column_group', comparisons: { kind: 'query_column_comparisons', comparisons: sequenceOf(comparisons.value) },
      } } });
    }
    const rightEvidence = arguments_.length >= 3 ? arguments_[2] : arguments_[1];
    if (rightEvidence === undefined) return malformed(`${methodName.value.value} requires a right-hand column`);
    const left = resolveColumnReference(first);
    if (left.kind !== 'resolved') return left;
    const right = resolveColumnReference(rightEvidence);
    if (right.kind !== 'resolved') return right;
    let operator: import('./expression').ComparisonOperator = { kind: 'equal' };
    if (arguments_.length >= 3) {
      const operatorEvidence = stringLiteralValue(arguments_[1]);
      if (operatorEvidence.kind !== 'some') return malformed('column comparison operator must be a supported string literal');
      const resolvedOperator = relationLookup(comparisonOperatorCatalog, operatorEvidence.value.toLowerCase());
      if (resolvedOperator.kind !== 'some') return malformed(`unsupported column comparison operator: ${operatorEvidence.value}`);
      operator = resolvedOperator.value;
    }
    return resolved({ kind: 'instance', operation: { kind: descriptor.junction, condition: {
      kind: 'column', comparison: { kind: 'query_column_comparison', left: left.value, operator, right: right.value },
    } } });
  });

const dateRelativeCatalog: readonly (readonly [string, QueryDateRelative])[] = Object.freeze([
  ['whereToday', { kind: 'today' }], ['orWhereToday', { kind: 'today' }],
  ['whereBeforeToday', { kind: 'before_today' }], ['orWhereBeforeToday', { kind: 'before_today' }],
  ['whereAfterToday', { kind: 'after_today' }], ['orWhereAfterToday', { kind: 'after_today' }],
  ['whereTodayOrBefore', { kind: 'today_or_before' }], ['orWhereTodayOrBefore', { kind: 'today_or_before' }],
  ['whereTodayOrAfter', { kind: 'today_or_after' }], ['orWhereTodayOrAfter', { kind: 'today_or_after' }],
  ['wherePast', { kind: 'past' }], ['orWherePast', { kind: 'past' }],
  ['whereFuture', { kind: 'future' }], ['orWhereFuture', { kind: 'future' }],
  ['whereNowOrPast', { kind: 'now_or_past' }], ['orWhereNowOrPast', { kind: 'now_or_past' }],
  ['whereNowOrFuture', { kind: 'now_or_future' }], ['orWhereNowOrFuture', { kind: 'now_or_future' }],
]);
const datePartCatalog: readonly (readonly [string, QueryDatePart])[] = Object.freeze([
  ['whereDate', { kind: 'date' }], ['orWhereDate', { kind: 'date' }],
  ['whereMonth', { kind: 'month' }], ['orWhereMonth', { kind: 'month' }],
  ['whereDay', { kind: 'day' }], ['orWhereDay', { kind: 'day' }],
  ['whereYear', { kind: 'year' }], ['orWhereYear', { kind: 'year' }],
  ['whereTime', { kind: 'time' }], ['orWhereTime', { kind: 'time' }],
]);

const resolveRelationAggregate = (methodName: MethodName, arguments_: readonly Expression[], source: SourceSpan): QueryProducerSemanticJudgment<QueryRelationAggregate> => {
  const methodText = methodName.value.value;
  const functionJudgment = relationLookup(aggregateCatalog, methodText);
  return relationOptionFold(functionJudgment, () => notApplicable(), aggregateFunction => relationOptionFold(
    relationLookup(relationProject(arguments_, (value, index) => [index, value] as const), 0),
    () => malformed('relation aggregate requires a relation path argument'),
    first => {
      const aliasMarker = ' as ';
      const rawRelation = relationOptionFold(stringLiteralValue(first), () => '', value => value);
      return relationGate(rawRelation.length > 0, () => {
        const aliasIndex = rawRelation.indexOf(aliasMarker);
        const relationText = aliasIndex < 0 ? rawRelation : relationTextSlice(rawRelation, 0, aliasIndex);
        const aliasText = aliasIndex < 0 ? relationNone<string>() : relationSome(relationTextSlice(rawRelation, relationAdvanceIndex(aliasIndex, aliasMarker.length)));
        return relationOptionFold(rewriteStringLiteral(first, relationText), () => malformed('relation aggregate path evidence is malformed'), relationExpression => relationOptionFold(relationPathArgument(relationExpression), () => malformed('relation aggregate path evidence is malformed'), path => {
          const column = relationGate(
            aggregateFunction.kind === 'exists' || aggregateFunction.kind === 'count',
            () => relationNone<import('./names').PropertyName>(),
            () => relationOptionFold(relationLookup(relationProject(arguments_, (value, index) => [index, value] as const), 1), () => relationNone(), value => relationOptionFold(
              stringLiteralValue(value),
              () => relationNone(),
              columnName => relationSome(createPropertyName(columnName)),
            )),
          );
          const alias = relationOptionFold(aliasText, () => relationNone<import('./names').PropertyName>(), value => relationSome(createPropertyName(value)));
          return resolved({ path, function: aggregateFunction, column, alias, constraint: { kind: 'none' }, source });
        }));
      }, () => malformed('relation aggregate path must be a non-empty string literal'));
    },
  ));
};

const notApplicable = <T>(): QueryProducerSemanticJudgment<T> => Object.freeze({ kind: 'not_applicable' });
const toLegacyOption = <T>(judgment: QueryProducerSemanticJudgment<T>): RelationOption<T> =>
  judgment.kind === 'resolved' ? relationSome(judgment.value) : relationNone();

const resolvePropertyName = (evidence: Expression | RelationNoneValue): QueryProducerSemanticJudgment<PropertyName> => {
  if (evidence === RELATION_NONE) return notApplicable();
  return relationOptionFold(stringLiteralValue(evidence),
    () => malformed('property name must be a string literal'),
    value => resolved(createPropertyName(value)),
  );
};

const comparisonOperatorCatalog: readonly (readonly [string, import('./expression').ComparisonOperator])[] = Object.freeze([
  ['=', { kind: 'equal' }], ['===', { kind: 'strict_equal' }], ['!=', { kind: 'not_equal' }], ['!==', { kind: 'strict_not_equal' }],
  ['>', { kind: 'greater' }], ['>=', { kind: 'greater_equal' }], ['<', { kind: 'less' }], ['<=', { kind: 'less_equal' }],
  ['like', { kind: 'like' }], ['not like', { kind: 'not_like' }],
]);

const positionalModelArguments = (items: import('./collections').Sequence<import('./expression').ExpressionArgument>, output: Expression[] = []): readonly Expression[] => {
  if (items.kind === 'empty') return output;
  if (items.head.kind === 'positional') return positionalModelArguments(items.tail, output.concat([items.head.value]));
  return positionalModelArguments(items.tail, output);
};

const sequenceOf = <T>(items: readonly T[], index = items.length - 1, tail: import('./collections').Sequence<T> = { kind: 'empty' }): import('./collections').Sequence<T> =>
  relationGate(index < 0, () => tail, () => sequenceOf(items, index - 1, { kind: 'cons', head: items[index], tail }));

const orderingTargetFromEvidence = (evidence: Expression): QueryOrderingTarget => {
  const property = resolvePropertyName(evidence);
  return property.kind === 'resolved'
    ? { kind: 'property', property: property.value }
    : { kind: 'expression', expression: evidence };
};

const resolveModelStaticOperation = (evidence: Expression): QueryProducerSemanticJudgment<ResolvedModelStaticOperation> => {
  if (evidence.kind !== 'static_method' || evidence.receiver.kind !== 'class' || evidence.action.kind !== 'domain') return notApplicable();
  const methodName = evidence.action.name.value.value;
  const arguments_ = positionalModelArguments(evidence.arguments.items);
  const model = createModelName(evidence.receiver.name.value.value);
  const first = arguments_[0];
  const second = arguments_[1];
  const third = arguments_[2];
  const operation = (value: ModelStaticOperation): QueryProducerSemanticJudgment<ResolvedModelStaticOperation> =>
    resolved({ model, operation: value });
  switch (methodName) {
    case 'all': return arguments_.length === 0 ? operation({ kind: 'all' }) : malformed('all does not accept arguments');
    case 'query': return arguments_.length === 0 ? operation({ kind: 'query' }) : malformed('query does not accept arguments');
    case 'select': return first === undefined ? malformed('select requires columns argument') : operation({ kind: 'select', columns: first });
    case 'where': {
      const field = first === undefined ? notApplicable<PropertyName>() : resolvePropertyName(first);
      if (field.kind !== 'resolved') return malformed('where requires a string-literal field argument');
      if (second === undefined) return malformed('where requires a value argument');
      const operatorEvidence = third === undefined ? relationSome('=') : stringLiteralValue(second);
      return relationOptionFold(operatorEvidence, () => malformed('where operator must be a supported string literal'), operatorName =>
        relationOptionFold(relationLookup(comparisonOperatorCatalog, operatorName.toLowerCase()), () => malformed(`unsupported where operator: ${operatorName}`), operator =>
          operation({ kind: 'where', condition: { kind: 'basic', field: field.value, operator, value: third === undefined ? second : third } })),
      );
    }
    case 'whereKey': return first === undefined ? malformed('whereKey requires key argument') : operation({ kind: 'where_key', value: first });
    case 'with': {
      if (arguments_.length === 0) return malformed('with requires at least one relation path');
      const paths = relationProject(arguments_, argument => resolveRelationPath(argument));
      const invalid = paths.find(judgment => judgment.kind !== 'resolved');
      if (invalid !== undefined) return malformed('with requires valid relation-path arguments');
      const resolvedPaths = paths.flatMap(judgment => judgment.kind === 'resolved' ? [judgment.value] : []);
      return operation({ kind: 'with', relations: { kind: 'relation_paths', items: sequenceOf(resolvedPaths) } });
    }
    case 'orderBy':
    case 'orderByAsc':
    case 'orderByDesc': {
      if (first === undefined) return malformed(`${methodName} requires an ordering target`);
      const direction = methodName === 'orderByDesc'
        ? resolved<OrderDirection>({ kind: 'descending' })
        : methodName === 'orderByAsc'
          ? resolved<OrderDirection>({ kind: 'ascending' })
          : resolveOrderingDirection(second === undefined ? RELATION_NONE : second);
      if (direction.kind !== 'resolved') return direction.kind === 'malformed' ? malformedWithDiagnostic(direction.diagnostic) : malformed(`${methodName} has no valid ordering direction`);
      return operation({ kind: 'order_by', target: orderingTargetFromEvidence(first), direction: direction.value });
    }
    case 'findOrFail': return first === undefined ? malformed('findOrFail requires key argument') : operation({ kind: 'find_or_fail', key: first });
    case 'create': return first === undefined ? malformed('create requires values argument') : operation({ kind: 'create', values: first });
    case 'updateOrCreate':
      return first === undefined || second === undefined ? malformed('updateOrCreate requires lookup and values arguments') : operation({ kind: 'update_or_create', lookup: first, values: second });
    case 'firstOrCreate':
      return first === undefined || second === undefined ? malformed('firstOrCreate requires attributes and values arguments') : operation({ kind: 'first_or_create', attributes: first, values: second });
    default: return notApplicable();
  }
};

/** Model origin is a projection of the authoritative static-operation judgment. */
const resolveModelOrigin = (evidence: Expression): QueryProducerSemanticJudgment<import('./names').ModelName> => {
  if (evidence.kind === 'model_reference') return resolved(evidence.model);
  if (evidence.kind === 'method' || evidence.kind === 'nullsafe_method') return resolveModelOrigin(evidence.receiver);
  const operation = resolveModelStaticOperation(evidence);
  return operation.kind === 'resolved'
    ? resolved(operation.value.model)
    : operation.kind === 'malformed'
      ? malformedWithDiagnostic(operation.diagnostic)
      : notApplicable();
};

const resolveRelationName = (evidence: Expression | RelationNoneValue): QueryProducerSemanticJudgment<RelationName> => {
  if (evidence === RELATION_NONE) return notApplicable();
  return relationOptionFold(stringLiteralValue(evidence),
    () => malformed('relation name must be a string literal'),
    value => resolved(createRelationName(value)),
  );
};

const resolveOrderingDirection = (evidence: Expression | RelationNoneValue): QueryProducerSemanticJudgment<OrderDirection> => evidence === RELATION_NONE
  ? resolved({ kind: 'ascending' })
  : relationOptionFold(
  relationVariant(evidence, 'literal'),
  () => malformed('ordering direction must be the string literal asc or desc'),
  literal => relationOptionFold(
    relationVariant(literal.value, 'string_literal'),
    () => malformed('ordering direction must be the string literal asc or desc'),
    stringLiteral => {
      const direction = stringLiteral.value.value.toLowerCase();
      return relationGate(
        relationAny([relationEqual(direction, 'asc'), relationEqual(direction, 'desc')]),
        () => resolved(direction === 'desc' ? { kind: 'descending' } : { kind: 'ascending' }),
        () => malformed(`unsupported ordering direction: ${direction}`),
      );
    },
  ),
);

const argumentAt = (arguments_: readonly Expression[], index: RelationOption<QueryArgumentPosition>): RelationOption<Expression> =>
  relationOptionFold(index, () => relationNone(), position => relationLookup(
    relationProject(arguments_, (value, offset) => [offset, value] as const), position.value.value,
  ));

const joinTarget = (descriptor: QueryJoinDescriptor, expression: Expression, alias: RelationOption<Expression>): RelationOption<QueryJoin['target']> =>
  relationGate(relationEqual(descriptor.target, 'table'), () => relationSome({ kind: 'table', expression }), () =>
    relationGate(relationEqual(descriptor.target, 'subquery'), () =>
      relationOptionFold(alias, () => relationNone<QueryJoin['target']>(), value => relationSome({ kind: 'subquery', expression, alias: value })), () =>
      relationOptionFold(alias, () => relationNone<QueryJoin['target']>(), value => relationSome({ kind: 'lateral', expression, alias: value }))));

const resolveQueryJoin = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryJoin> => {
  const methodText = methodName.value.value;
  const descriptor = relationLookup(joinCatalog, methodText);
  return relationOptionFold(descriptor, () => notApplicable(), definition => relationOptionFold(
    argumentAt(arguments_, relationSome(argumentPosition(0))),
    () => malformed('query join requires a target argument'),
    targetExpression => {
      const alias = argumentAt(arguments_, definition.aliasIndex);
      const constraint = relationOptionFold(argumentAt(arguments_, definition.constraintIndex), () => relationNone<QueryJoinConstraint>(), value => relationSome(
        relationGate(relationAny([relationEqual(value.kind, 'closure'), relationEqual(value.kind, 'arrow_function')]),
          () => ({ kind: 'closure' as const, expression: value }),
          () => ({ kind: 'expression' as const, expression: value })),
      ));
      return relationOptionFold(
        joinTarget(definition, targetExpression, alias),
        () => malformed('subquery and lateral joins require an alias argument'),
        target => resolved<QueryJoin>({ target, type: { kind: definition.type }, constraint }),
      );
    },
  ));
};

/**
 * Closed semantic rule: source method spelling and argument evidence are
 * resolved here into the canonical query operation. Scanner code only wires
 * this judgment into the query AST; it does not choose the operation variant.
 */
const resolveQueryBasicOperation = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const methodText = methodName.value.value;
  const isWhere = methodText === 'where' || methodText === 'orWhere';
  const isWhereNot = methodText === 'whereNot' || methodText === 'orWhereNot';
  if (!isWhere && !isWhereNot) return notApplicable();

  const isOr = methodText === 'orWhere' || methodText === 'orWhereNot';
  const first = arguments_[0];
  if (first === undefined) return malformed(`${methodText} requires a condition argument`);

  if (isWhereNot) {
    if (first.kind !== 'closure' && first.kind !== 'arrow_function') {
      return malformed(`${methodText} requires a closure or arrow-function condition`);
    }
    return resolved({
      kind: 'instance',
      operation: isOr
        ? { kind: 'or_where', condition: { kind: 'not', expression: first } }
        : { kind: 'where', condition: { kind: 'not', expression: first } },
    });
  }

  if (first.kind === 'closure' || first.kind === 'arrow_function') {
    return resolved({
      kind: 'instance',
      operation: isOr
        ? { kind: 'or_where', condition: { kind: 'nested', expression: first } }
        : { kind: 'where', condition: { kind: 'nested', expression: first } },
    });
  }

  const field = resolvePropertyName(first);
  if (field.kind !== 'resolved') return malformed('where field must be a string literal');
  const operand = arguments_.length >= 3 ? arguments_[2] : arguments_[1];
  if (operand === undefined) return malformed(`${methodText} requires a value argument`);

  const operatorEvidence = arguments_.length >= 3 ? stringLiteralValue(arguments_[1]) : relationSome('=');
  if (operatorEvidence.kind !== 'some') return malformed('where operator must be a supported string literal');
  const operatorName = operatorEvidence.value.toLowerCase();
  const operator = relationLookup(comparisonOperatorCatalog, operatorName);
  if (operator.kind !== 'some') return malformed(`unsupported where operator: ${operatorName}`);
  const condition = { kind: 'basic' as const, field: field.value, operator: operator.value, value: operand };
  return resolved({
    kind: 'instance',
    operation: isOr ? { kind: 'or_where', condition } : { kind: 'where', condition },
  });
};

/** Closed ADTs encode logical junction and polarity; no boolean semantic flags. */
type QueryPredicateJunction = Readonly<{ readonly kind: 'where' }> | Readonly<{ readonly kind: 'or_where' }>;
type QueryPredicatePolarity = Readonly<{ readonly kind: 'positive' }> | Readonly<{ readonly kind: 'negated' }>;
type QueryPredicateDescriptor = Readonly<{ readonly junction: QueryPredicateJunction; readonly polarity: QueryPredicatePolarity }>;
type QueryNullSafeEqualityDescriptor = Readonly<{ readonly junction: QueryPredicateJunction }>;

/** Closed descriptor for Laravel's range-condition vocabulary. */
const rangeConditionCatalog: readonly (readonly [string, QueryPredicateDescriptor])[] = Object.freeze([
  ['whereBetween', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }], ['orWhereBetween', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereNotBetween', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }], ['orWhereNotBetween', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
]);
const membershipConditionCatalog: readonly (readonly [string, QueryPredicateDescriptor])[] = Object.freeze([
  ['whereIn', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }], ['orWhereIn', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereNotIn', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }], ['orWhereNotIn', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
  ['whereIntegerInRaw', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }], ['orWhereIntegerInRaw', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereIntegerNotInRaw', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }], ['orWhereIntegerNotInRaw', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
]);
const nullConditionCatalog: readonly (readonly [string, QueryPredicateDescriptor])[] = Object.freeze([
  ['whereNull', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }], ['orWhereNull', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereNotNull', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }], ['orWhereNotNull', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
]);

/** Closed source vocabulary for column-to-column range predicates. */
const columnRangeConditionCatalog: readonly (readonly [string, QueryPredicateDescriptor])[] = Object.freeze([
  ['whereBetweenColumns', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }], ['orWhereBetweenColumns', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereNotBetweenColumns', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }], ['orWhereNotBetweenColumns', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
]);
const valueRangeConditionCatalog: readonly (readonly [string, QueryPredicateDescriptor])[] = Object.freeze([
  ['whereValueBetween', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }], ['orWhereValueBetween', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereValueNotBetween', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }], ['orWhereValueNotBetween', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
]);
const nullSafeEqualityCatalog: readonly (readonly [string, QueryNullSafeEqualityDescriptor])[] = Object.freeze([
  ['whereNullSafeEquals', { junction: { kind: 'where' } }], ['orWhereNullSafeEquals', { junction: { kind: 'or_where' } }],
]);

const arrayValues = (items: import('./collections').Sequence<import('./expression').ArrayEntry>, output: readonly Expression[] = []): readonly Expression[] =>
  items.kind === 'empty' ? output : arrayValues(items.tail, output.concat([items.head.value]));

const resolveRangeCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(rangeConditionCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const fieldEvidence = arguments_[0];
    const rangeEvidence = arguments_[1];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('range condition field is missing'));
    if (rangeEvidence === undefined || rangeEvidence.kind !== 'array') return malformed(`${methodName.value.value} requires a two-value array`);
    const values = arrayValues(rangeEvidence.entries);
    if (values.length !== 2) return malformed(`${methodName.value.value} requires exactly two range values`);
    const condition = { kind: 'between' as const, field: field.value, lower: values[0], upper: values[1], negated: relationEqual(polarity.kind, 'negated') };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

const resolveMembershipCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(membershipConditionCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const fieldEvidence = arguments_[0];
    const values = arguments_[1];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('membership field is missing'));
    if (values === undefined) return malformed(`${methodName.value.value} requires a values argument`);
    const condition = { kind: 'in' as const, field: field.value, values, negated: relationEqual(polarity.kind, 'negated') };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

const resolveNullCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(nullConditionCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const fieldEvidence = arguments_[0];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('null condition field is missing'));
    const condition = { kind: 'null' as const, field: field.value, negated: relationEqual(polarity.kind, 'negated') };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

const queryColumnReference = (expression: Expression): import('./expression').QueryColumnReference => Object.freeze({
  kind: 'query_column_reference', expression, source: expression.source,
});

const resolveColumnRangeCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(columnRangeConditionCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const fieldEvidence = arguments_[0];
    const rangeEvidence = arguments_[1];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('column range field is missing'));
    if (rangeEvidence === undefined || rangeEvidence.kind !== 'array') return malformed(`${methodName.value.value} requires a two-column array`);
    const values = arrayValues(rangeEvidence.entries);
    if (values.length !== 2) return malformed(`${methodName.value.value} requires exactly two column bounds`);
    const condition = { kind: 'between_columns' as const, field: queryColumnReference(fieldEvidence), lower: queryColumnReference(values[0]), upper: queryColumnReference(values[1]), negated: relationEqual(polarity.kind, 'negated') };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

const resolveValueRangeCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(valueRangeConditionCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const value = arguments_[0];
    const rangeEvidence = arguments_[1];
    if (value === undefined) return malformed(`${methodName.value.value} requires a value argument`);
    if (rangeEvidence === undefined || rangeEvidence.kind !== 'array') return malformed(`${methodName.value.value} requires a two-column array`);
    const values = arrayValues(rangeEvidence.entries);
    if (values.length !== 2) return malformed(`${methodName.value.value} requires exactly two column bounds`);
    const condition = { kind: 'value_between' as const, value, lower: queryColumnReference(values[0]), upper: queryColumnReference(values[1]), negated: relationEqual(polarity.kind, 'negated') };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

const resolveNullSafeEquality = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(nullSafeEqualityCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction }) => {
    const fieldEvidence = arguments_[0];
    const value = arguments_[1];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('null-safe equality field is missing'));
    if (value === undefined) return malformed(`${methodName.value.value} requires a value argument`);
    const condition = { kind: 'null_safe_equals' as const, field: field.value, value };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};



type QueryDatePredicateDescriptor = Readonly<{
  readonly part: QueryDatePart;
  readonly junction: QueryPredicateJunction;
}>;
type QueryRelativeDatePredicateDescriptor = Readonly<{
  readonly part: QueryDateRelative;
  readonly junction: QueryPredicateJunction;
}>;
const datePredicate = (part: QueryDatePart, junction: QueryPredicateJunction): QueryDatePredicateDescriptor => Object.freeze({ part, junction });
const relativeDatePredicate = (part: QueryDateRelative, junction: QueryPredicateJunction): QueryRelativeDatePredicateDescriptor => Object.freeze({ part, junction });
const datePartOperationCatalog: readonly (readonly [string, QueryDatePredicateDescriptor])[] = Object.freeze([
  ['whereDate', datePredicate({ kind: 'date' }, { kind: 'where' })], ['orWhereDate', datePredicate({ kind: 'date' }, { kind: 'or_where' })],
  ['whereMonth', datePredicate({ kind: 'month' }, { kind: 'where' })], ['orWhereMonth', datePredicate({ kind: 'month' }, { kind: 'or_where' })],
  ['whereDay', datePredicate({ kind: 'day' }, { kind: 'where' })], ['orWhereDay', datePredicate({ kind: 'day' }, { kind: 'or_where' })],
  ['whereYear', datePredicate({ kind: 'year' }, { kind: 'where' })], ['orWhereYear', datePredicate({ kind: 'year' }, { kind: 'or_where' })],
  ['whereTime', datePredicate({ kind: 'time' }, { kind: 'where' })], ['orWhereTime', datePredicate({ kind: 'time' }, { kind: 'or_where' })],
]);
const relativeDateOperationCatalog: readonly (readonly [string, QueryRelativeDatePredicateDescriptor])[] = Object.freeze([
  ['whereToday', relativeDatePredicate({ kind: 'today' }, { kind: 'where' })], ['orWhereToday', relativeDatePredicate({ kind: 'today' }, { kind: 'or_where' })],
  ['whereBeforeToday', relativeDatePredicate({ kind: 'before_today' }, { kind: 'where' })], ['orWhereBeforeToday', relativeDatePredicate({ kind: 'before_today' }, { kind: 'or_where' })],
  ['whereAfterToday', relativeDatePredicate({ kind: 'after_today' }, { kind: 'where' })], ['orWhereAfterToday', relativeDatePredicate({ kind: 'after_today' }, { kind: 'or_where' })],
  ['whereTodayOrBefore', relativeDatePredicate({ kind: 'today_or_before' }, { kind: 'where' })], ['orWhereTodayOrBefore', relativeDatePredicate({ kind: 'today_or_before' }, { kind: 'or_where' })],
  ['whereTodayOrAfter', relativeDatePredicate({ kind: 'today_or_after' }, { kind: 'where' })], ['orWhereTodayOrAfter', relativeDatePredicate({ kind: 'today_or_after' }, { kind: 'or_where' })],
  ['wherePast', relativeDatePredicate({ kind: 'past' }, { kind: 'where' })], ['orWherePast', relativeDatePredicate({ kind: 'past' }, { kind: 'or_where' })],
  ['whereFuture', relativeDatePredicate({ kind: 'future' }, { kind: 'where' })], ['orWhereFuture', relativeDatePredicate({ kind: 'future' }, { kind: 'or_where' })],
  ['whereNowOrPast', relativeDatePredicate({ kind: 'now_or_past' }, { kind: 'where' })], ['orWhereNowOrPast', relativeDatePredicate({ kind: 'now_or_past' }, { kind: 'or_where' })],
  ['whereNowOrFuture', relativeDatePredicate({ kind: 'now_or_future' }, { kind: 'where' })], ['orWhereNowOrFuture', relativeDatePredicate({ kind: 'now_or_future' }, { kind: 'or_where' })],
]);

type QueryExistsPredicateDescriptor = Readonly<{ readonly junction: QueryPredicateJunction; readonly polarity: QueryPredicatePolarity }>;
const existsPredicateCatalog: readonly (readonly [string, QueryExistsPredicateDescriptor])[] = Object.freeze([
  ['whereExists', { junction: { kind: 'where' }, polarity: { kind: 'positive' } }],
  ['orWhereExists', { junction: { kind: 'or_where' }, polarity: { kind: 'positive' } }],
  ['whereNotExists', { junction: { kind: 'where' }, polarity: { kind: 'negated' } }],
  ['orWhereNotExists', { junction: { kind: 'or_where' }, polarity: { kind: 'negated' } }],
]);

/** Exists predicates are resolved here so scanner wiring cannot infer junction or negation from method spelling. */
const resolveExistsCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(existsPredicateCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const query = arguments_[0];
    if (query === undefined) return malformed(`${methodName.value.value} requires a query or closure argument`);
    const condition = { kind: 'exists' as const, query, negated: relationEqual(polarity.kind, 'negated') };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

type QueryLikePredicateDescriptor = Readonly<{ readonly junction: QueryPredicateJunction; readonly polarity: QueryPredicatePolarity }>;
const likePredicate = (junction: QueryPredicateJunction, polarity: QueryPredicatePolarity): QueryLikePredicateDescriptor => Object.freeze({ junction, polarity });
const likePredicateCatalog: readonly (readonly [string, QueryLikePredicateDescriptor])[] = Object.freeze([
  ['whereLike', likePredicate({ kind: 'where' }, { kind: 'positive' })],
  ['orWhereLike', likePredicate({ kind: 'or_where' }, { kind: 'positive' })],
  ['whereNotLike', likePredicate({ kind: 'where' }, { kind: 'negated' })],
  ['orWhereNotLike', likePredicate({ kind: 'or_where' }, { kind: 'negated' })],
]);

/** Pattern-predicate semantics are resolved from a closed descriptor, not scanner method-name branches. */
const resolveLikeCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(likePredicateCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction, polarity }) => {
    const fieldEvidence = arguments_[0];
    const value = arguments_[1];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('LIKE predicate field is missing'));
    if (value === undefined) return malformed(`${methodName.value.value} requires a pattern value`);
    const caseSensitivity = arguments_[2] === undefined
      ? { kind: 'default' as const }
      : { kind: 'case_sensitive' as const, value: arguments_[2] };
    const condition = {
      kind: 'like' as const,
      field: field.value,
      value,
      caseSensitive: caseSensitivity,
      negated: relationEqual(polarity.kind, 'negated') ? { kind: 'negated' as const } : { kind: 'positive' as const },
    };
    const operation = relationEqual(junction.kind, 'or_where')
      ? { kind: 'or_where' as const, condition }
      : { kind: 'where' as const, condition };
    return resolved({ kind: 'instance', operation });
  });
};

type QueryFullTextPredicateDescriptor = Readonly<{ readonly junction: QueryPredicateJunction }>;
const fullTextPredicateCatalog: readonly (readonly [string, QueryFullTextPredicateDescriptor])[] = Object.freeze([
  ['whereFullText', Object.freeze({ junction: { kind: 'where' as const } })],
  ['orWhereFullText', Object.freeze({ junction: { kind: 'or_where' as const } })],
]);

/** Full-text predicate meaning is closed upstream; scanner only forwards the judgment. */
const resolveFullTextCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(fullTextPredicateCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ junction }) => {
    const fieldEvidence = arguments_[0];
    const value = arguments_[1];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('full-text field is missing'));
    if (value === undefined) return malformed(`${methodName.value.value} requires a search value`);
    const condition = { kind: 'full_text' as const, field: field.value, value };
    const operation = relationEqual(junction.kind, 'or_where')
      ? { kind: 'or_where' as const, condition }
      : { kind: 'where' as const, condition };
    return resolved({ kind: 'instance', operation });
  });
};

const resolveDatePartCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(datePartOperationCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ part, junction }) => {
    const fieldEvidence = arguments_[0];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('date condition field is missing'));
    const hasExplicitOperator = arguments_.length >= 3;
    const value = hasExplicitOperator ? arguments_[2] : arguments_[1];
    if (value === undefined) return malformed(`${methodName.value.value} requires a value argument`);
    const operatorEvidence = hasExplicitOperator ? stringLiteralValue(arguments_[1]) : relationSome('=');
    if (operatorEvidence.kind !== 'some') return malformed('date condition operator must be a supported string literal');
    const operator = relationLookup(comparisonOperatorCatalog, operatorEvidence.value.toLowerCase());
    if (operator.kind !== 'some') return malformed(`unsupported date condition operator: ${operatorEvidence.value}`);
    const condition = { kind: 'date_part' as const, part, field: field.value, operator: operator.value, value };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

const resolveRelativeDateCondition = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const descriptor = relationLookup(relativeDateOperationCatalog, methodName.value.value);
  return relationOptionFold(descriptor, () => notApplicable(), ({ part, junction }) => {
    const fieldEvidence = arguments_[0];
    if (fieldEvidence === undefined) return malformed(`${methodName.value.value} requires a field argument`);
    const field = resolvePropertyName(fieldEvidence);
    if (field.kind !== 'resolved') return malformedWithDiagnostic(field.kind === 'malformed' ? field.diagnostic : semanticDiagnostic('relative date condition field is missing'));
    const condition = { kind: 'date_relative' as const, part, field: field.value };
    const operation = relationGate(relationEqual(junction.kind, 'or_where'), () => ({ kind: 'or_where' as const, condition }), () => ({ kind: 'where' as const, condition }));
    return resolved({ kind: 'instance', operation });
  });
};

/**
 * Declarative operation dispatch. Method vocabulary owns rule selection; evaluators
 * are invoked exactly once for a claimed method. No ordered probing of semantic
 * resolvers is used to discover which rule applies.
 */
type ClaimedQueryOperationRule = Exclude<
  QueryOperationSemanticRule,
  { readonly kind: 'unclaimed_query_operation_rule' }
>;
type QueryOperationRuleEvaluator = (
  evidence: QueryOperationEvidence,
) => QueryProducerSemanticJudgment<QueryOperationAst>;
type QueryOperationRuleBinding<Rule extends ClaimedQueryOperationRule['kind']> = Readonly<{
  readonly declaration: QueryOperationSemanticRuleDeclarationFor<Rule>;
  /** Executor for the declared obligations; not the owner of rule identity. */
  readonly execute: (evidence: QueryOperationEvidence) => QueryOperationSemanticRuleExecution;
}>;
type AnyQueryOperationRuleBinding = {
  [Rule in ClaimedQueryOperationRule['kind']]: QueryOperationRuleBinding<Rule>
}[ClaimedQueryOperationRule['kind']];

const executeClaimedQueryOperationRule = <Rule extends ClaimedQueryOperationRule['kind']>(
  declaration: QueryOperationSemanticRuleDeclarationFor<Rule>,
  execute: QueryOperationRuleEvaluator,
  evidence: QueryOperationEvidence,
): QueryOperationSemanticRuleExecution => {
  const judgment = execute(evidence);
  if (judgment.kind === 'resolved') return Object.freeze({ kind: 'resolved' as const, operation: judgment.value });
  if (judgment.kind === 'malformed') return Object.freeze({ kind: 'malformed' as const, diagnostic: judgment.diagnostic });
  // A method claimed by the semantic interface cannot fall back to an
  // unclaimed result after execution. Treat this as malformed evidence so the
  // scanner cannot reinterpret an operation already owned upstream.
  return Object.freeze({
    kind: 'malformed' as const,
    diagnostic: semanticDiagnostic(`claimed query operation ${declaration.rule} did not produce a closed judgment for ${evidence.methodName.value.value}`),
  });
};

const declareQueryOperationRule = <Rule extends ClaimedQueryOperationRule['kind']>(
  rule: Rule,
  methods: readonly string[],
  premises: QueryOperationSemanticRuleDeclarationFor<Rule>['premises'],
  constraints: QueryOperationSemanticRuleDeclarationFor<Rule>['constraints'],
  execute: QueryOperationRuleEvaluator,
): QueryOperationRuleBinding<Rule> => {
  const declaration: QueryOperationSemanticRuleDeclarationFor<Rule> = Object.freeze({
    rule,
    methods: Object.freeze([...methods]),
    evidence: Object.freeze({ kind: 'query_operation_evidence' as const, fields: ['methodName', 'arguments'] as const }),
    premises,
    constraints,
    conclusion: Object.freeze({ kind: 'query_operation_ast' as const, family: rule }),
    outcomes: ['resolved', 'malformed', 'undetermined'] as const,
  });
  return Object.freeze({
    declaration,
    execute: (evidence: QueryOperationEvidence) => executeClaimedQueryOperationRule(declaration, execute, evidence),
  });
};

const methodAndArguments = ['method_vocabulary_claimed', 'argument_shape_valid'] as const;
const propertyConditionPremises = [...methodAndArguments, 'property_or_relation_evidence_resolved', 'operator_evidence_supported'] as const;
const queryOperationRuleCatalog: readonly AnyQueryOperationRuleBinding[] = Object.freeze([
  declareQueryOperationRule('query_join_rule', joinCatalog.map(([method]) => method), methodAndArguments, ['arity', 'join_shape', 'nested_query_shape'], evidence => resolveQueryJoinOperation(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_basic_condition_rule', ['where', 'orWhere', 'whereNot', 'orWhereNot'], propertyConditionPremises, ['arity', 'literal_domain', 'operator_domain', 'property_identity'], evidence => resolveQueryBasicOperation(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_range_condition_rule', rangeConditionCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'literal_domain'], evidence => resolveRangeCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_membership_condition_rule', membershipConditionCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'literal_domain'], evidence => resolveMembershipCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_null_condition_rule', nullConditionCatalog.map(([method]) => method), [...methodAndArguments, 'property_or_relation_evidence_resolved'], ['arity', 'property_identity'], evidence => resolveNullCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_column_range_condition_rule', columnRangeConditionCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'operator_domain'], evidence => resolveColumnRangeCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_value_range_condition_rule', valueRangeConditionCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'operator_domain', 'literal_domain'], evidence => resolveValueRangeCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_null_safe_equality_rule', nullSafeEqualityCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'operator_domain'], evidence => resolveNullSafeEquality(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_exists_condition_rule', existsPredicateCatalog.map(([method]) => method), [...methodAndArguments, 'nested_query_evidence_validated'], ['arity', 'relation_identity', 'nested_query_shape'], evidence => resolveExistsCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_like_condition_rule', likePredicateCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'literal_domain'], evidence => resolveLikeCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_full_text_condition_rule', fullTextPredicateCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'literal_domain'], evidence => resolveFullTextCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_row_value_condition_rule', rowValuePredicateCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'literal_domain'], evidence => resolveRowValueCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_column_comparison_condition_rule', columnComparisonPredicateCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'operator_domain'], evidence => resolveColumnComparisonCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_json_condition_rule', jsonPredicateCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'literal_domain', 'operator_domain'], evidence => resolveJsonCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_date_part_condition_rule', datePartOperationCatalog.map(([method]) => method), propertyConditionPremises, ['arity', 'property_identity', 'operator_domain', 'literal_domain'], evidence => resolveDatePartCondition(evidence.methodName, evidence.arguments)),
  declareQueryOperationRule('query_date_relative_condition_rule', relativeDateOperationCatalog.map(([method]) => method), [...methodAndArguments, 'property_or_relation_evidence_resolved'], ['arity', 'property_identity'], evidence => resolveRelativeDateCondition(evidence.methodName, evidence.arguments)),
]);

/**
 * Public semantic model: the interface exposes declarations, not evaluator
 * callbacks. Runtime execution remains private to this upstream module.
 */
export const queryOperationSemanticRules: readonly QueryOperationSemanticRuleDeclaration[] = Object.freeze(
  queryOperationRuleCatalog.map(binding => binding.declaration),
);

const queryOperationRuleCatalogValidation = validateQueryOperationSemanticRuleCatalog(
  queryOperationSemanticRules,
);

// Invalid semantic declarations are a model-integrity failure, not a reason for
// the scanner to fall back and reinterpret the same source method.
if (queryOperationRuleCatalogValidation.kind === 'invalid') {
  throw new Error(`Invalid query semantic rule catalog: ${queryOperationRuleCatalogValidation.violations.map(violation => `${violation.kind}:${violation.rule}${violation.method === undefined ? '' : `:${violation.method}`}`).join(', ')}`);
}

const queryOperationMethodRuleCatalog: readonly (readonly [string, AnyQueryOperationRuleBinding])[] = Object.freeze(
  queryOperationRuleCatalog.flatMap(binding => binding.declaration.methods.map(method => [method, binding] as const)),
);

const queryOperationRuleBindingFor = (methodName: MethodName): RelationOption<AnyQueryOperationRuleBinding> =>
  relationLookup(queryOperationMethodRuleCatalog, methodName.value.value);

const resolveQueryOperationRule = (methodName: MethodName): QueryOperationSemanticRuleClaim =>
  relationOptionFold(
    queryOperationRuleBindingFor(methodName),
    () => Object.freeze({ kind: 'unclaimed' as const, rule: Object.freeze({ kind: 'unclaimed_query_operation_rule' as const }) }),
    ruleBinding => Object.freeze({ kind: 'claimed' as const, contract: ruleBinding.declaration }),
  );

const resolveQueryOperation = (evidence: QueryOperationEvidence): QueryOperationSemanticDecision => {
  const decision = relationOptionFold(queryOperationRuleBindingFor(evidence.methodName), () => Object.freeze({
    kind: 'not_applicable' as const,
    rule: { kind: 'unclaimed_query_operation_rule' as const },
  }), ruleBinding => {
    const judgment = ruleBinding.execute(evidence);
    const rule = ruleBinding.declaration.rule;
    if (judgment.kind === 'malformed') {
      const derivation = Object.freeze({
        kind: 'query_operation_derivation' as const,
        rule,
        methodName: evidence.methodName.value.value,
        argumentCount: evidence.arguments.length,
        outcome: 'malformed' as const,
        conclusion: Object.freeze({ kind: 'query_semantic_diagnostic' as const }),
      });
      return Object.freeze({ kind: 'malformed' as const, rule: { kind: rule }, contract: ruleBinding.declaration, diagnostic: judgment.diagnostic, derivation });
    }
    const derivation = Object.freeze({
      kind: 'query_operation_derivation' as const,
      rule,
      methodName: evidence.methodName.value.value,
      argumentCount: evidence.arguments.length,
      outcome: 'resolved' as const,
      conclusion: Object.freeze({ kind: 'query_operation_ast' as const, family: rule }),
    });
    return Object.freeze({ kind: 'resolved' as const, rule: { kind: rule }, contract: ruleBinding.declaration, operation: judgment.operation, derivation });
  });
  const validation = validateQueryOperationSemanticDecision(evidence, decision);
  if (validation.kind === 'invalid') {
    throw new Error(`Invalid query semantic decision: ${validation.violations.map(violation => `${violation.kind}:${violation.detail}`).join(', ')}`);
  }
  return decision;
};

const resolveQueryOperationEvidence = (
  evidence: QueryOperationSemanticSourceEvidence,
): QueryOperationSemanticEvidenceBoundExecution => {
  const decision = resolveQueryOperation(evidence.operation);
  if (decision.kind === 'not_applicable') {
    return Object.freeze({
      kind: 'query_operation_evidence_bound_execution' as const,
      ownership: 'unclaimed' as const,
      evidence,
      decision,
      proofStatus: 'not_applicable_no_executor_invoked' as const,
    });
  }
  return Object.freeze({
    kind: 'query_operation_evidence_bound_execution' as const,
    ownership: 'claimed' as const,
    evidence,
    decision,
    // This is intentionally not upgraded to `proof_complete`: the current
    // evaluator still returns legacy judgments without per-obligation receipts.
    proofStatus: 'evaluator_obligations_not_yet_emitted' as const,
  });
};

const resolveQueryJoinOperation = (methodName: MethodName, arguments_: readonly Expression[]): QueryProducerSemanticJudgment<QueryOperationAst> => {
  const methodText = methodName.value.value;
  const operationKind = relationLookup([
    ['join', 'join'], ['leftJoin', 'left_join'], ['rightJoin', 'right_join'],
    ['crossJoin', 'cross_join'], ['joinSub', 'join_sub'],
    ['leftJoinSub', 'left_join'], ['rightJoinSub', 'right_join'],
    ['crossJoinSub', 'cross_join'], ['joinLateral', 'join_lateral'],
    ['leftJoinLateral', 'left_join_lateral'],
    ['straightJoin', 'straight_join'], ['straightJoinSub', 'straight_join'],
  ] as const, methodText);
  return relationOptionFold(operationKind, () => notApplicable(), kind => {
    const join = resolveQueryJoin(methodName, arguments_);
    return join.kind === 'resolved'
      ? resolved<QueryOperationAst>({ kind: 'instance', operation: { kind, join: join.value } })
      : join.kind === 'malformed'
        ? malformedWithDiagnostic(join.diagnostic)
        : notApplicable();
  });
};

const resolveRelationPath = (evidence: Expression | RelationNoneValue): QueryProducerSemanticJudgment<RelationPath> => {
  if (evidence === RELATION_NONE) return notApplicable();
  const path = relationPathArgument(evidence);
  return relationOptionFold(path, () => malformed('relation path must be a non-empty string literal with valid selected columns'),
    value => resolved(value),
  );
};

const groupingTarget = (expression: Expression): QueryOrderingTarget => relationOptionFold(
  relationVariant(expression, 'literal'),
  () => ({ kind: 'expression', expression }),
  literal => relationOptionFold(
    relationVariant(literal.value, 'string_literal'),
    () => ({ kind: 'expression', expression }),
    stringLiteral => ({ kind: 'property', property: createPropertyName(stringLiteral.value.value) }),
  ),
);

const groupingSequence = (evidence: readonly Expression[], index = evidence.length - 1, tail: import('./collections').Sequence<QueryOrderingTarget> = { kind: 'empty' }): import('./collections').Sequence<QueryOrderingTarget> =>
  relationGate(index < 0, () => tail, () => groupingSequence(evidence, relationAdvanceIndex(index, -1), { kind: 'cons', head: groupingTarget(evidence[index]), tail }));

const resolveQueryGrouping = (evidence: readonly Expression[]): QueryProducerSemanticJudgment<QueryGrouping> =>
  evidence.length === 0
    ? malformed('query grouping requires at least one target')
    : resolved({ kind: 'query_grouping', targets: groupingSequence(evidence) });

const resolveQueryDatePart = (methodName: MethodName): QueryProducerSemanticJudgment<QueryDatePart> =>
  relationOptionFold(relationLookup(datePartCatalog, methodName.value.value), () => notApplicable(), resolved);
const resolveQueryDateRelative = (methodName: MethodName): QueryProducerSemanticJudgment<QueryDateRelative> =>
  relationOptionFold(relationLookup(dateRelativeCatalog, methodName.value.value), () => notApplicable(), resolved);

export const queryProducerSemanticReasoning: QueryProducerSemanticInterface = Object.freeze({
  queryOperationRules: queryOperationSemanticRules,
  resolveQueryOperationRule,
  resolveModelOrigin,
  resolveModelStaticOperation,
  resolvePropertyName,
  resolveRelationName,
  resolveOrderingDirection,
  resolveRelationAggregateFunction: (methodName: MethodName): QueryProducerSemanticJudgment<QueryRelationAggregateFunction> => relationOptionFold(
    relationLookup(aggregateCatalog, methodName.value.value),
    () => notApplicable<QueryRelationAggregateFunction>(),
    aggregateFunction => resolved<QueryRelationAggregateFunction>(aggregateFunction),
  ),
  resolveRelationAggregate,
  resolveQueryJoin,
  resolveQueryJoinOperation,
  resolveQueryBasicOperation,
  resolveQueryOperation,
  resolveQueryOperationEvidence,
  resolveRelationPath,
  resolveQueryGrouping,
  resolveQueryDatePart,
  resolveQueryDateRelative,
  toLegacyOption,
});
