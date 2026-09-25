import type { ExpressionAst } from '../../../types/upstream/ast';
import type { Expression } from '../../../types/upstream/expression';
import type { QueryAst, QueryOperationAst, QuerySubqueryAst } from '../../../types/upstream/query';
import { createModelName, createPropertyName, createRelationName } from '../../../types/upstream/names';
import type { ModelName, PropertyName } from '../../../types/upstream/names';
import type { Sequence, RelationPath, Option } from '../../../types/upstream/collections';

export type QueryProducerInput = {
  readonly expressions: readonly ExpressionAst[];
};

export interface QueryProducer {
  readonly produce: (input: QueryProducerInput) => readonly QueryAst[];
}

const modelFromReceiver = (expression: Expression): ModelName | undefined => {
  if (expression.kind === 'model_reference') return expression.model;
  if (expression.kind === 'method') return modelFromReceiver(expression.receiver);
  if (expression.kind === 'nullsafe_method') return modelFromReceiver(expression.receiver);
  if (expression.kind === 'static_method' && expression.receiver.kind === 'model') return expression.receiver.name;
  if (expression.kind === 'static_method' && expression.receiver.kind === 'class' && modelStaticOperationFromExpression(expression) !== undefined) return createModelName(expression.receiver.name.value.value);
  return undefined;
};

const positionalArguments = (expression: Extract<Expression, { readonly kind: 'method' | 'nullsafe_method' }>): readonly Expression[] => {
  const result: Expression[] = [];
  let current = expression.arguments.items;
  while (current.kind === 'cons') {
    if (current.head.kind === 'positional') result.push(current.head.value);
    current = current.tail;
  }
  return result;
};

const propertyArgument = (expression: Expression | undefined): import('../../../types/upstream/names').PropertyName | undefined => {
  if (expression?.kind !== 'literal' || expression.value.kind !== 'string_literal') return undefined;
  return createPropertyName(expression.value.value.value);
};

const relationArgument = (expression: Expression | undefined): import('../../../types/upstream/names').RelationName | undefined => {
  if (expression?.kind !== 'literal' || expression.value.kind !== 'string_literal') return undefined;
  return createRelationName(expression.value.value.value);
};

const relationPathArgument = (expression: Expression | undefined): RelationPath | undefined => {
  if (expression?.kind !== 'literal' || expression.value.kind !== 'string_literal') return undefined;
  const raw = expression.value.value.value;
  const parts = raw.split(':');
  const pathText = parts[0];
  const selectionText = parts.length > 1 ? parts[1] : undefined;
  const names = pathText.split('.');
  if (names.length === 0 || names.some((name) => name.length === 0)) return undefined;
  let segments: RelationPath['segments'] = { kind: 'empty' };
  for (let index = names.length - 1; index >= 0; index -= 1) {
    segments = { kind: 'cons', head: createRelationName(names[index]), tail: segments };
  }
  if (selectionText === undefined) return { kind: 'relation_path', segments, selectedColumns: { kind: 'none' } };
  const columns = selectionText.split(',');
  if (columns.length === 0 || columns.some((column) => column.length === 0)) return undefined;
  let selectedColumns: import('../../../types/upstream/collections').PropertyNames['items'] = { kind: 'empty' };
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    selectedColumns = { kind: 'cons', head: createPropertyName(columns[index]), tail: selectedColumns };
  }
  return { kind: 'relation_path', segments, selectedColumns: { kind: 'some', value: { kind: 'property_names', items: selectedColumns } } };
};

const relationPathsArgument = (expressions: readonly Expression[]): RelationPath[] | undefined => {
  const paths: RelationPath[] = [];
  for (const expression of expressions) {
    if (expression.kind === 'array') {
      let current = expression.entries;
      while (current.kind === 'cons') {
        const path = relationPathArgument(current.head.value);
        if (path === undefined) return undefined;
        paths.push(path);
        current = current.tail;
      }
      continue;
    }
    const path = relationPathArgument(expression);
    if (path === undefined) return undefined;
    paths.push(path);
  }
  return paths.length === 0 ? undefined : paths;
};

const relationCount = (expression: Expression | undefined): import('../../../types/upstream/expression').QueryRelationCount =>
  expression === undefined ? { kind: 'implicit' } : { kind: 'explicit', value: expression };

const sequenceFromExpressions = <T>(items: readonly T[]): Sequence<T> => {
  let result: Sequence<T> = { kind: 'empty' };
  for (let index = items.length - 1; index >= 0; index -= 1) {
    result = { kind: 'cons', head: items[index], tail: result };
  }
  return result;
};

const groupingTarget = (expression: Expression): import('../../../types/upstream/expression').QueryOrderingTarget | undefined => {
  const property = propertyArgument(expression);
  if (property !== undefined) return { kind: 'property', property };
  return { kind: 'expression', expression };
};

const queryGrouping = (expressions: readonly Expression[]): import('../../../types/upstream/expression').QueryGrouping | undefined => {
  const targets: import('../../../types/upstream/expression').QueryOrderingTarget[] = [];
  for (const expression of expressions) {
    const target = groupingTarget(expression);
    if (target === undefined) return undefined;
    targets.push(target);
  }
  if (targets.length === 0) return undefined;
  return { kind: 'query_grouping', targets: sequenceFromExpressions(targets) };
};

const relationAggregateFunction = (name: string): import('../../../types/upstream/expression').QueryRelationAggregateFunction | undefined => {
  switch (name) {
    case 'withCount': case 'loadCount': return { kind: 'count' };
    case 'withMin': case 'loadMin': return { kind: 'min' };
    case 'withMax': case 'loadMax': return { kind: 'max' };
    case 'withAvg': case 'loadAvg': return { kind: 'avg' };
    case 'withSum': case 'loadSum': return { kind: 'sum' };
    case 'withExists': case 'loadExists': return { kind: 'exists' };
    default: return undefined;
  }
};

const relationAggregate = (name: string, expression: Extract<Expression, { readonly kind: 'method' | 'nullsafe_method' }>): import('../../../types/upstream/expression').QueryRelationAggregate | undefined => {
  const fn = relationAggregateFunction(name);
  if (fn === undefined) return undefined;
  const args = positionalArguments(expression);
  const first = args[0];
  if (first?.kind !== 'literal' || first.value.kind !== 'string_literal') return undefined;
  const rawRelation = first.value.value.value;
  const aliasMarker = ' as ';
  const aliasIndex = rawRelation.indexOf(aliasMarker);
  const relationText = aliasIndex < 0 ? rawRelation : rawRelation.slice(0, aliasIndex);
  const aliasText = aliasIndex < 0 ? undefined : rawRelation.slice(aliasIndex + aliasMarker.length);
  const relationExpression: Expression = { ...first, value: { ...first.value, value: { ...first.value.value, value: relationText } } };
  const path = relationPathArgument(relationExpression);
  if (path === undefined) return undefined;
  const columnValue = fn.kind === 'exists' || fn.kind === 'count' ? undefined : propertyArgument(args[1]);
  const column = columnValue === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: columnValue };
  const alias = aliasText === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: createPropertyName(aliasText) };
  return { path, function: fn, column, alias, constraint: { kind: 'none' }, source: expression.source };
};

const orderingTarget = (expression: Expression | undefined): import('../../../types/upstream/expression').QueryOrderingTarget | undefined => {
  if (expression === undefined) return undefined;
  const property = propertyArgument(expression);
  return property === undefined ? { kind: 'expression', expression } : { kind: 'property', property };
};

const orderingDirection = (expression: Expression | undefined): import('../../../types/upstream/expression').OrderDirection => {
  if (expression?.kind === 'literal' && expression.value.kind === 'string_literal' && expression.value.value.value.toLowerCase() === 'desc') return { kind: 'descending' };
  return { kind: 'ascending' };
};

type QueryJoinMethodName =
  | 'join'
  | 'leftJoin'
  | 'rightJoin'
  | 'crossJoin'
  | 'joinSub'
  | 'leftJoinSub'
  | 'rightJoinSub'
  | 'crossJoinSub'
  | 'joinLateral'
  | 'leftJoinLateral'
  | 'straightJoin'
  | 'straightJoinSub';

const queryJoinConstraint = (expression: Expression | undefined): import('../../../types/upstream/expression').QueryJoinConstraint | undefined => {
  if (expression === undefined) return undefined;
  switch (expression.kind) {
    case 'closure':
    case 'arrow_function':
      return { kind: 'closure', expression };
    default:
      return { kind: 'expression', expression };
  }
};

const queryJoin = (
  name: QueryJoinMethodName,
  args: readonly Expression[],
): import('../../../types/upstream/expression').QueryJoin | undefined => {
  const targetExpression = args[0];
  if (targetExpression === undefined) return undefined;
  switch (name) {
    case 'join': {
      const constraint = args[1];
      return { target: { kind: 'table', expression: targetExpression }, type: { kind: 'inner' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'leftJoin': {
      const constraint = args[1];
      return { target: { kind: 'table', expression: targetExpression }, type: { kind: 'left' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'rightJoin': {
      const constraint = args[1];
      return { target: { kind: 'table', expression: targetExpression }, type: { kind: 'right' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'crossJoin': {
      const constraint = args[1];
      return { target: { kind: 'table', expression: targetExpression }, type: { kind: 'cross' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'joinSub': {
      const alias = args[1];
      const constraint = args[2];
      if (alias === undefined) return undefined;
      return { target: { kind: 'subquery', expression: targetExpression, alias }, type: { kind: 'inner' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'leftJoinSub': {
      const alias = args[1];
      const constraint = args[2];
      if (alias === undefined) return undefined;
      return { target: { kind: 'subquery', expression: targetExpression, alias }, type: { kind: 'left' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'rightJoinSub': {
      const alias = args[1];
      const constraint = args[2];
      if (alias === undefined) return undefined;
      return { target: { kind: 'subquery', expression: targetExpression, alias }, type: { kind: 'right' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'crossJoinSub': {
      const alias = args[1];
      const constraint = args[2];
      if (alias === undefined) return undefined;
      return { target: { kind: 'subquery', expression: targetExpression, alias }, type: { kind: 'cross' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'joinLateral': {
      const alias = args[1];
      if (alias === undefined) return undefined;
      return { target: { kind: 'lateral', expression: targetExpression, alias }, type: { kind: 'inner' }, constraint: undefined };
    }
    case 'leftJoinLateral': {
      const alias = args[1];
      if (alias === undefined) return undefined;
      return { target: { kind: 'lateral', expression: targetExpression, alias }, type: { kind: 'left' }, constraint: undefined };
    }
    case 'straightJoin': {
      const constraint = args[1];
      return { target: { kind: 'table', expression: targetExpression }, type: { kind: 'straight' }, constraint: queryJoinConstraint(constraint) };
    }
    case 'straightJoinSub': {
      const alias = args[1];
      const constraint = args[2];
      if (alias === undefined) return undefined;
      return { target: { kind: 'subquery', expression: targetExpression, alias }, type: { kind: 'straight' }, constraint: queryJoinConstraint(constraint) };
    }
  }
};

const queryOperationFromNamedMethod = (expression: Extract<Expression, { readonly kind: 'method' | 'nullsafe_method' }>): QueryOperationAst | undefined => {
  if (expression.operation.kind !== 'domain') return expression.operation.kind === 'query' ? { kind: 'instance', operation: expression.operation.operation } : undefined;
  const name = expression.operation.name.value.value;
  const args = positionalArguments(expression);
  const field = propertyArgument(args[0]);
  const relation = relationArgument(args[0]);
  const value = args[args.length - 1];
  switch (name) {
    case 'join': {
      const join = queryJoin('join', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'join', join } };
    }
    case 'leftJoin': {
      const join = queryJoin('leftJoin', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'left_join', join } };
    }
    case 'rightJoin': {
      const join = queryJoin('rightJoin', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'right_join', join } };
    }
    case 'crossJoin': {
      const join = queryJoin('crossJoin', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'cross_join', join } };
    }
    case 'joinSub': {
      const join = queryJoin('joinSub', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'join_sub', join } };
    }
    case 'leftJoinSub': {
      const join = queryJoin('leftJoinSub', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'left_join', join } };
    }
    case 'rightJoinSub': {
      const join = queryJoin('rightJoinSub', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'right_join', join } };
    }
    case 'crossJoinSub': {
      const join = queryJoin('crossJoinSub', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'cross_join', join } };
    }
    case 'joinLateral': {
      const join = queryJoin('joinLateral', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'join_lateral', join } };
    }
    case 'leftJoinLateral': {
      const join = queryJoin('leftJoinLateral', args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'left_join_lateral', join } };
    }
    case 'straightJoin': case 'straightJoinSub': {
      const join = queryJoin(name, args);
      return join === undefined ? undefined : { kind: 'instance', operation: { kind: 'straight_join', join } };
    }
    case 'whereNot': case 'orWhereNot': {
      const callback = args[0];
      if (callback === undefined || (callback.kind !== 'closure' && callback.kind !== 'arrow_function')) return undefined;
      const condition = { kind: 'not' as const, expression: callback };
      return { kind: 'instance', operation: name === 'whereNot' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'where': case 'orWhere': {
      if (args[0]?.kind === 'closure' || args[0]?.kind === 'arrow_function') {
        const condition = { kind: 'nested' as const, expression: args[0] };
        return { kind: 'instance', operation: name === 'where' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
      }
      if (field === undefined || args.length < 2) return undefined;
      const operator = args.length >= 3 ? comparisonOperator(args[1]) : { kind: 'equal' as const };
      const operand = args.length >= 3 ? args[2] : args[1];
      if (operand === undefined) return undefined;
      return { kind: 'instance', operation: name === 'where' ? { kind: 'where', condition: { kind: 'basic', field, operator, value: operand } } : { kind: 'or_where', condition: { kind: 'basic', field, operator, value: operand } } };
    }
    case 'withCount': case 'withMin': case 'withMax': case 'withAvg': case 'withSum': case 'withExists':
    case 'loadCount': case 'loadMin': case 'loadMax': case 'loadAvg': case 'loadSum': case 'loadExists': {
      const aggregate = relationAggregate(name, expression);
      return aggregate === undefined ? undefined : { kind: 'instance', operation: { kind: 'relation_aggregate', aggregate } };
    }
    case 'has':
    case 'orHas':
    case 'doesntHave':
    case 'orDoesntHave':
    case 'whereHas':
    case 'orWhereHas':
    case 'whereDoesntHave':
    case 'orWhereDoesntHave':
    case 'withWhereHas':
    case 'loadMissing': {
      const path = relationPathArgument(args[0]);
      if (path === undefined) return undefined;
      const constraint = args.find((item) => item.kind === 'closure' || item.kind === 'arrow_function');
      let operation: import('../../../types/upstream/expression').QueryRelationOperation | undefined;
      switch (name) {
        case 'has': case 'orHas':
          operation = { kind: 'has', operator: args.length >= 2 ? comparisonOperator(args[1]) : { kind: 'greater_equal' }, count: relationCount(args.length >= 3 ? args[2] : undefined) };
          break;
        case 'doesntHave': case 'orDoesntHave':
          operation = { kind: 'doesnt_have' };
          break;
        case 'whereHas': case 'orWhereHas':
          operation = constraint === undefined ? undefined : { kind: 'where_has', constraint, operator: args.length >= 3 ? comparisonOperator(args[2]) : { kind: 'greater_equal' }, count: relationCount(args.length >= 4 ? args[3] : undefined) };
          break;
        case 'whereDoesntHave': case 'orWhereDoesntHave':
          operation = constraint === undefined ? undefined : { kind: 'where_doesnt_have', constraint };
          break;
        case 'withWhereHas':
          operation = constraint === undefined ? undefined : { kind: 'with_where_has', constraint };
          break;
        case 'loadMissing':
          operation = { kind: 'load_missing' };
          break;
      }
      return operation === undefined ? undefined : { kind: 'instance', operation: { kind: 'relation', relation: { path, operation, source: expression.source } } };
    }
    case 'whereBetween': case 'orWhereBetween': case 'whereNotBetween': case 'orWhereNotBetween': {
      const field = propertyArgument(args[0]);
      const range = args[1];
      if (field === undefined || range === undefined || range.kind !== 'array') return undefined;
      const items = arrayExpressionItems(range);
      if (items.length !== 2) return undefined;
      const condition = { kind: 'between' as const, field, lower: items[0], upper: items[1], negated: name === 'whereNotBetween' || name === 'orWhereNotBetween' };
      return { kind: 'instance', operation: name === 'whereBetween' || name === 'whereNotBetween' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereBetweenColumns': case 'orWhereBetweenColumns': case 'whereNotBetweenColumns': case 'orWhereNotBetweenColumns': {
      const field = propertyArgument(args[0]);
      const range = args[1];
      if (field === undefined || args[0] === undefined || range === undefined || range.kind !== 'array') return undefined;
      const items = arrayExpressionItems(range);
      if (items.length !== 2) return undefined;
      const condition = { kind: 'between_columns' as const, field: { kind: 'query_column_reference' as const, expression: args[0], source: args[0].source }, lower: { kind: 'query_column_reference' as const, expression: items[0], source: items[0].source }, upper: { kind: 'query_column_reference' as const, expression: items[1], source: items[1].source }, negated: name === 'whereNotBetweenColumns' || name === 'orWhereNotBetweenColumns' };
      return { kind: 'instance', operation: name === 'whereBetweenColumns' || name === 'whereNotBetweenColumns' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereValueBetween': case 'orWhereValueBetween': case 'whereValueNotBetween': case 'orWhereValueNotBetween': {
      const valueExpression = args[0];
      const range = args[1];
      if (valueExpression === undefined || range === undefined || range.kind !== 'array') return undefined;
      const items = arrayExpressionItems(range);
      if (items.length !== 2) return undefined;
      const condition = { kind: 'value_between' as const, value: valueExpression, lower: { kind: 'query_column_reference' as const, expression: items[0], source: items[0].source }, upper: { kind: 'query_column_reference' as const, expression: items[1], source: items[1].source }, negated: name === 'whereValueNotBetween' || name === 'orWhereValueNotBetween' };
      return { kind: 'instance', operation: name === 'whereValueBetween' || name === 'whereValueNotBetween' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereIn': case 'whereNotIn': case 'orWhereIn': case 'orWhereNotIn': case 'whereIntegerInRaw': case 'whereIntegerNotInRaw': case 'orWhereIntegerInRaw': case 'orWhereIntegerNotInRaw': {
      const field = propertyArgument(args[0]);
      const values = args[1];
      if (field === undefined || values === undefined) return undefined;
      const condition = { kind: 'in' as const, field, values, negated: name === 'whereNotIn' || name === 'orWhereNotIn' || name === 'whereIntegerNotInRaw' || name === 'orWhereIntegerNotInRaw' };
      return { kind: 'instance', operation: name === 'whereIn' || name === 'whereNotIn' || name === 'whereIntegerInRaw' || name === 'whereIntegerNotInRaw' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereNull': case 'orWhereNull': case 'whereNotNull': case 'orWhereNotNull': {
      const field = propertyArgument(args[0]);
      if (field === undefined) return undefined;
      const condition = { kind: 'null' as const, field, negated: name === 'whereNotNull' || name === 'orWhereNotNull' };
      return { kind: 'instance', operation: name === 'whereNull' || name === 'whereNotNull' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereNullSafeEquals': case 'orWhereNullSafeEquals': {
      const field = propertyArgument(args[0]);
      const value = args[1];
      if (field === undefined || value === undefined) return undefined;
      const condition = { kind: 'null_safe_equals' as const, field, value };
      return { kind: 'instance', operation: name === 'whereNullSafeEquals' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereDate': case 'orWhereDate': case 'whereMonth': case 'orWhereMonth': case 'whereDay': case 'orWhereDay': case 'whereYear': case 'orWhereYear': case 'whereTime': case 'orWhereTime': {
      const field = propertyArgument(args[0]);
      if (field === undefined || args[1] === undefined) return undefined;
      const operator = args.length >= 3 ? comparisonOperator(args[1]) : { kind: 'equal' as const };
      const value = args.length >= 3 ? args[2] : args[1];
      const part = queryDatePart(name);
      const condition = { kind: 'date_part' as const, part, field, operator, value };
      return { kind: 'instance', operation: name.startsWith('orWhere') ? { kind: 'or_where', condition } : { kind: 'where', condition } };
    }
    case 'whereNot': case 'orWhereNot': {
      const callback = args[0];
      if (callback === undefined || (callback.kind !== 'closure' && callback.kind !== 'arrow_function')) return undefined;
      const condition = { kind: 'not' as const, expression: callback };
      return { kind: 'instance', operation: name === 'whereNot' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereToday': case 'orWhereToday': case 'whereBeforeToday': case 'orWhereBeforeToday': case 'whereAfterToday': case 'orWhereAfterToday': case 'whereTodayOrBefore': case 'orWhereTodayOrBefore': case 'whereTodayOrAfter': case 'orWhereTodayOrAfter': case 'wherePast': case 'orWherePast': case 'whereFuture': case 'orWhereFuture': case 'whereNowOrPast': case 'orWhereNowOrPast': case 'whereNowOrFuture': case 'orWhereNowOrFuture': {
      const field = propertyArgument(args[0]);
      if (field === undefined) return undefined;
      const condition = { kind: 'date_relative' as const, part: queryDateRelative(name), field };
      return { kind: 'instance', operation: name.startsWith('orWhere') ? { kind: 'or_where', condition } : { kind: 'where', condition } };
    }
    case 'whereRowValues': case 'orWhereRowValues': {
      const columns = args[0];
      const operator = args[1];
      const values = args[2];
      if (columns === undefined || columns.kind !== 'array' || operator === undefined || values === undefined || values.kind !== 'array') return undefined;
      const columnRefs: import('../../../types/upstream/expression').QueryColumnReference[] = [];
      let current = columns.entries;
      while (current.kind === 'cons') {
        columnRefs.push({ kind: 'query_column_reference', expression: current.head.value, source: current.head.value.source });
        current = current.tail;
      }
      if (columnRefs.length === 0) return undefined;
      const condition = { kind: 'row_values' as const, columns: { kind: 'query_column_list' as const, columns: sequenceFromExpressions(columnRefs) }, operator: comparisonOperator(operator), values };
      return { kind: 'instance', operation: name === 'whereRowValues' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereExists': case 'orWhereExists': case 'whereNotExists': case 'orWhereNotExists': {
      const query = args[0];
      if (query === undefined) return undefined;
      const condition = { kind: 'exists' as const, query, negated: name === 'whereNotExists' || name === 'orWhereNotExists' };
      return { kind: 'instance', operation: name === 'whereExists' || name === 'whereNotExists' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereKey': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'where_key', value } };
    case 'whereRaw': case 'orWhereRaw': {
      const raw = args[0];
      if (raw === undefined) return undefined;
      const condition = { kind: 'raw' as const, expression: raw, bindings: args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] } };
      return { kind: 'instance', operation: name === 'whereRaw' ? { kind: 'where_raw', condition } : { kind: 'or_where', condition } };
    }
    case 'whereAny': case 'whereAll': case 'whereNone': {
      const columns = args[0];
      const operator = args[1];
      const operand = args[2];
      if (columns === undefined || operator === undefined || operand === undefined) return undefined;
      const items = columns.kind === 'array' ? columns.entries : undefined;
      if (items === undefined) return undefined;
      const references: import('../../../types/upstream/expression').QueryColumnReference[] = [];
      let current = items;
      while (current.kind === 'cons') {
        const column = propertyArgument(current.head.value);
        if (column === undefined) return undefined;
        references.push({ kind: 'query_column_reference', expression: current.head.value, source: current.head.value.source });
        current = current.tail;
      }
      if (references.length === 0) return undefined;
      const columnsValue = { kind: 'query_column_list' as const, columns: sequenceFromExpressions(references) };
      const condition = name === 'whereAny' ? { kind: 'any' as const, columns: columnsValue, operator: comparisonOperator(operator), value: operand } : name === 'whereAll' ? { kind: 'all' as const, columns: columnsValue, operator: comparisonOperator(operator), value: operand } : { kind: 'none' as const, columns: columnsValue, operator: comparisonOperator(operator), value: operand };
      return { kind: 'instance', operation: { kind: 'where', condition } };
    }
    case 'whereLike': case 'orWhereLike': case 'whereNotLike': case 'orWhereNotLike': {
      const target = propertyArgument(args[0]);
      const operand = args[1];
      if (target === undefined || operand === undefined) return undefined;
      const caseSensitive = args[2] === undefined ? { kind: 'default' as const } : { kind: 'case_sensitive' as const, value: args[2] };
      const negated = name === 'whereNotLike' || name === 'orWhereNotLike' ? { kind: 'negated' as const } : { kind: 'positive' as const };
      const condition = { kind: 'like' as const, field: target, value: operand, caseSensitive, negated };
      return { kind: 'instance', operation: name === 'whereLike' || name === 'whereNotLike' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereJsonContains': case 'whereJsonDoesntContain': case 'whereJsonContainsKey': case 'whereJsonDoesntContainKey': case 'whereJsonLength': case 'whereJsonOverlaps': case 'whereJsonDoesntOverlap': case 'orWhereJsonContains': case 'orWhereJsonDoesntContain': case 'orWhereJsonContainsKey': case 'orWhereJsonDoesntContainKey': case 'orWhereJsonLength': case 'orWhereJsonOverlaps': case 'orWhereJsonDoesntOverlap': {
      const target = propertyArgument(args[0]);
      if (target === undefined) return undefined;
      const parts = target.value.value.split('->');
      const column = createPropertyName(parts[0]);
      const path: Expression = { kind: 'literal', value: { kind: 'string_literal', value: { kind: 'string_value', value: parts.slice(1).join('->') } }, source: args[0].source };
      const baseName = name.startsWith('orWhere') ? name.slice(2) : name;
      const condition = baseName === 'whereJsonContains' ? { kind: 'json' as const, condition: { kind: 'contains' as const, column, path, value: args[1] } } : baseName === 'whereJsonDoesntContain' ? { kind: 'json' as const, condition: { kind: 'doesnt_contain' as const, column, path, value: args[1] } } : baseName === 'whereJsonContainsKey' ? { kind: 'json' as const, condition: { kind: 'contains_key' as const, column, path } } : baseName === 'whereJsonDoesntContainKey' ? { kind: 'json' as const, condition: { kind: 'doesnt_contain_key' as const, column, path } } : baseName === 'whereJsonOverlaps' ? { kind: 'json' as const, condition: { kind: 'overlaps' as const, column, path, value: args[1] } } : baseName === 'whereJsonDoesntOverlap' ? { kind: 'json' as const, condition: { kind: 'doesnt_overlap' as const, column, path, value: args[1] } } : { kind: 'json' as const, condition: { kind: 'length' as const, column, path, operator: args.length >= 3 ? comparisonOperator(args[1]) : { kind: 'equal' as const }, length: args.length >= 3 ? args[2] : args[1] } };
      if ((condition.condition.kind === 'contains' || condition.condition.kind === 'doesnt_contain') && condition.condition.value === undefined) return undefined;
      if (condition.condition.kind === 'length' && condition.condition.length === undefined) return undefined;
      return { kind: 'instance', operation: name.startsWith('orWhere') ? { kind: 'or_where', condition } : { kind: 'where', condition } };
    }
    case 'whereFullText': case 'orWhereFullText': {
      const target = propertyArgument(args[0]);
      const operand = args[1];
      if (target === undefined || operand === undefined) return undefined;
      const condition = { kind: 'full_text' as const, field: target, value: operand };
      return { kind: 'instance', operation: name === 'whereFullText' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereVectorDistanceLessThan': case 'orWhereVectorDistanceLessThan': {
      const target = propertyArgument(args[0]);
      const vector = args[1];
      const maxDistance = args[2];
      if (target === undefined || vector === undefined || maxDistance === undefined) return undefined;
      const condition = { kind: 'vector_distance' as const, field: target, vector, maxDistance };
      return { kind: 'instance', operation: name === 'whereVectorDistanceLessThan' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'whereVectorSimilarTo': {
      const target = propertyArgument(args[0]);
      const vector = args[1];
      if (target === undefined || vector === undefined) return undefined;
      const threshold = args[2] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[2] };
      const order = args[3] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[3] };
      return { kind: 'instance', operation: { kind: 'where', condition: { kind: 'vector_similarity', field: target, vector, threshold, order } } };
    }
    case 'whereColumn': case 'orWhereColumn': {
      const first = args[0];
      if (first === undefined) return undefined;
      if (first.kind === 'array') {
        const comparisons: import('../../../types/upstream/expression').QueryColumnComparison[] = [];
        let current = first.entries;
        while (current.kind === 'cons') {
          if (current.head.value.kind !== 'array') return undefined;
          const pair = current.head.value.entries;
          if (pair.kind !== 'cons' || pair.tail.kind !== 'cons' || pair.tail.tail.kind !== 'empty') return undefined;
          const leftExpression = pair.head.value;
          const rightExpression = pair.tail.head.value;
          if (leftExpression.kind !== 'literal' || leftExpression.value.kind !== 'string_literal') return undefined;
          if (rightExpression.kind !== 'literal' || rightExpression.value.kind !== 'string_literal') return undefined;
          comparisons.push({
            kind: 'query_column_comparison',
            left: { kind: 'query_column_reference', expression: leftExpression, source: leftExpression.source },
            operator: { kind: 'equal' },
            right: { kind: 'query_column_reference', expression: rightExpression, source: rightExpression.source },
          });
          current = current.tail;
        }
        if (comparisons.length === 0) return undefined;
        const condition = { kind: 'column_group' as const, comparisons: { kind: 'query_column_comparisons' as const, comparisons: sequenceFromArray(comparisons) } };
        return { kind: 'instance', operation: name === 'whereColumn' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
      }
      const leftExpression = first;
      const rightExpression = args.length >= 3 ? args[2] : args[1];
      if (rightExpression === undefined) return undefined;
      if (leftExpression.kind !== 'literal' || leftExpression.value.kind !== 'string_literal') return undefined;
      if (rightExpression.kind !== 'literal' || rightExpression.value.kind !== 'string_literal') return undefined;
      const operator = args.length >= 3 ? comparisonOperator(args[1]) : { kind: 'equal' as const };
      const comparison = {
        kind: 'query_column_comparison' as const,
        left: { kind: 'query_column_reference' as const, expression: leftExpression, source: leftExpression.source },
        operator,
        right: { kind: 'query_column_reference' as const, expression: rightExpression, source: rightExpression.source },
      };
      const condition = { kind: 'column' as const, comparison };
      return { kind: 'instance', operation: name === 'whereColumn' ? { kind: 'where', condition } : { kind: 'or_where', condition } };
    }
    case 'with': case 'load': {
      const paths = relationPathsArgument(args);
      if (paths === undefined) return undefined;
      const relations = { kind: 'relation_paths' as const, items: sequenceFromArray(paths) };
      return { kind: 'instance', operation: name === 'with' ? { kind: 'with', relations } : { kind: 'load', relations } };
    }
    case 'latest': {
      const target = orderingTarget(args[0]);
      return { kind: 'instance', operation: { kind: 'latest', target } };
    }
    case 'oldest': {
      const target = orderingTarget(args[0]);
      return { kind: 'instance', operation: { kind: 'oldest', target } };
    }
    case 'orderBy': case 'orderByAsc': case 'orderByDesc': {
      const target = orderingTarget(args[0]);
      if (target === undefined) return undefined;
      const direction = name === 'orderByDesc' ? { kind: 'descending' as const } : name === 'orderByAsc' ? { kind: 'ascending' as const } : orderingDirection(args[1]);
      return { kind: 'instance', operation: { kind: 'order_by', target, direction } };
    }
    case 'orderByVectorDistance': {
      const column = args[0];
      const vector = args[1];
      if (column === undefined || vector === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'order_by_vector_distance', column, vector } };
    }
    case 'orderByRaw': {
      const expression = args[0];
      if (expression === undefined) return undefined;
      const bindings = args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] };
      return { kind: 'instance', operation: { kind: 'order_by_raw', target: { kind: 'raw', expression, bindings } } };
    }
    case 'orderByNullsFirst': case 'orderByNullsLast': {
      const target = orderingTarget(args[0]);
      if (target === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'order_by_nulls', target, direction: { kind: 'ascending' }, nulls: name === 'orderByNullsFirst' ? { kind: 'first' } : { kind: 'last' } } };
    }
    case 'reorder': {
      const target = orderingTarget(args[0]);
      const direction = args[0] === undefined ? undefined : orderingDirection(args[1]);
      return { kind: 'instance', operation: { kind: 'reorder', target, direction } };
    }
    case 'reorderDesc': {
      const target = orderingTarget(args[0]);
      return { kind: 'instance', operation: { kind: 'reorder', target, direction: { kind: 'descending' } } };
    }
    case 'groupLimit': {
      const value = args[0];
      const column = orderingTarget(args[1]);
      if (value === undefined || column === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'group_limit', value, column } };
    }
    case 'inOrderOf': {
      const column = propertyArgument(args[0]);
      const values = args[1];
      if (column === undefined || values === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'in_order_of', column, values } };
    }
    case 'fromRaw': {
      const raw = args[0];
      if (raw === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'from_raw', expression: raw, bindings: args[1] === undefined ? { kind: 'none' } : { kind: 'some', value: args[1] } } };
    }
    case 'select': return { kind: 'instance', operation: { kind: 'select', projection: { kind: 'columns', arguments: expression.arguments } } };
    case 'addSelect': return { kind: 'instance', operation: { kind: 'add_select', projection: { kind: 'columns', arguments: expression.arguments } } };
    case 'selectSub': {
      const query = args[0]; const alias = args[1];
      return query === undefined || alias === undefined ? undefined : { kind: 'instance', operation: { kind: 'select_sub', projection: { kind: 'subquery', query, alias } } };
    }
    case 'selectExpression': {
      const selected = args[0]; const alias = args[1];
      return selected === undefined || alias === undefined ? undefined : { kind: 'instance', operation: { kind: 'select_expression', projection: { kind: 'expression', expression: selected, alias } } };
    }
    case 'fromSub': {
      const query = args[0]; const alias = args[1];
      return query === undefined || alias === undefined ? undefined : { kind: 'instance', operation: { kind: 'from_sub', query, alias } };
    }
    case 'useIndex': case 'forceIndex': case 'ignoreIndex': {
      const index = args[0];
      if (index === undefined) return undefined;
      const hint = name === 'useIndex' ? { kind: 'use' as const, index } : name === 'forceIndex' ? { kind: 'force' as const, index } : { kind: 'ignore' as const, index };
      return { kind: 'instance', operation: { kind: 'index_hint', hint } };
    }
    case 'selectVectorDistance': {
      const column = args[0]; const vector = args[1];
      if (column === undefined || vector === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'select_vector_distance', projection: { kind: 'vector_distance', column, vector, alias: args[2] } } };
    }
    case 'explain': return { kind: 'instance', operation: { kind: 'explain' } };
    case 'limit': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'limit', value } };
    case 'offset': case 'skip': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'offset', value } };
    case 'take': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'limit', value } };
    case 'first': return { kind: 'instance', operation: { kind: 'first' } };
    case 'firstOrFail': return { kind: 'instance', operation: { kind: 'first_or_fail' } };
    case 'find': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'find', key: value } };
    case 'get': return args.length === 0 ? { kind: 'instance', operation: { kind: 'get' } } : { kind: 'instance', operation: { kind: 'get_with_columns', columns: args[0] } };
    case 'findOrFail': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'find_or_fail', key: value } };
    case 'findOr': {
      const key = args[0];
      if (key === undefined) return undefined;
      const columns = args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] };
      const callback = args[2] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[2] };
      return { kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'find_or', key, columns, callback } } };
    }
    case 'findOr': {
      const key = args[0];
      if (key === undefined) return undefined;
      const columns = args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] };
      const callback = args[2] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[2] };
      return { kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'find_or', key, columns, callback } } };
    }
    case 'paginate': {
      const perPage = args[0];
      if (perPage === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'paginate', perPage, columns: args[1] === undefined ? { kind: 'none' } : { kind: 'some', value: args[1] }, pageName: args[2] === undefined ? { kind: 'none' } : { kind: 'some', value: args[2] }, page: args[3] === undefined ? { kind: 'none' } : { kind: 'some', value: args[3] } } };
    }
    case 'simplePaginate': {
      const perPage = args[0];
      if (perPage === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'simple_paginate', perPage, columns: args[1] === undefined ? { kind: 'none' } : { kind: 'some', value: args[1] }, pageName: args[2] === undefined ? { kind: 'none' } : { kind: 'some', value: args[2] } } };
    }
    case 'cursorPaginate': {
      const perPage = args[0];
      if (perPage === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'cursor_paginate', perPage, columns: args[1] === undefined ? { kind: 'none' } : { kind: 'some', value: args[1] }, cursorName: args[2] === undefined ? { kind: 'none' } : { kind: 'some', value: args[2] }, cursor: args[3] === undefined ? { kind: 'none' } : { kind: 'some', value: args[3] } } };
    }
    case 'distinct': return { kind: 'instance', operation: { kind: 'distinct' } };
    case 'union': case 'unionAll': {
      const query = args[0];
      if (query === undefined) return undefined;
      return { kind: 'instance', operation: name === 'union' ? { kind: 'union', query } : { kind: 'union_all', query } };
    }
    case 'inRandomOrder': return { kind: 'instance', operation: { kind: 'in_random_order' } };
    case 'randomOrder': return { kind: 'instance', operation: { kind: 'random_order' } };
    case 'count': return { kind: 'instance', operation: { kind: 'count' } };
    case 'sum': case 'avg': case 'min': case 'max': {
      const aggregate = field === undefined ? undefined : { kind: 'property' as const, name: field };
      return aggregate === undefined ? undefined : { kind: 'instance', operation: { kind: name, value: aggregate } };
    }
    case 'exists': return { kind: 'instance', operation: { kind: 'exists' } };
    case 'doesntExist': return { kind: 'instance', operation: { kind: 'doesnt_exist' } };
    case 'sole': return { kind: 'instance', operation: { kind: 'sole' } };
    case 'pluck': {
      if (field === undefined) return undefined;
      const keyProperty = args[1] === undefined ? undefined : propertyArgument(args[1]);
      if (args[1] !== undefined && keyProperty === undefined) return undefined;
      const key: Option<PropertyName> = keyProperty === undefined ? { kind: 'none' } : { kind: 'some', value: keyProperty };
      return { kind: 'instance', operation: { kind: 'pluck', field, key } };
    }
    case 'value': return field === undefined ? undefined : { kind: 'instance', operation: { kind: 'value', field } };
    case 'soleValue': return field === undefined ? undefined : { kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'sole_value', field } } };
    case 'rawValue': {
      const rawExpression = args[0];
      if (rawExpression === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'terminal', terminal: { kind: 'raw_value', expression: rawExpression, bindings: args[1] === undefined ? { kind: 'none' } : { kind: 'some', value: args[1] } } } };
    }
    case 'groupBy': {
      const grouping = queryGrouping(args);
      return grouping === undefined ? undefined : { kind: 'instance', operation: { kind: 'group_by', grouping } };
    }
    case 'groupByRaw': {
      const expression = args[0];
      if (expression === undefined) return undefined;
      const bindings = args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] };
      return { kind: 'instance', operation: { kind: 'group_by', grouping: { kind: 'raw', expression, bindings } } };
    }
    case 'having': case 'orHaving': {
      if (field === undefined || args.length < 2) return undefined;
      const operator = args.length >= 3 ? comparisonOperator(args[1]) : { kind: 'equal' as const };
      const operand = args.length >= 3 ? args[2] : args[1];
      if (operand === undefined) return undefined;
      const having = { kind: 'query_having' as const, condition: { kind: 'basic' as const, field, operator, value: operand } };
      return name === 'orHaving'
        ? { kind: 'instance', operation: { kind: 'or_having', having } }
        : { kind: 'instance', operation: { kind: 'having', having } };
    }
    case 'havingBetween': case 'orHavingBetween': {
      const field = propertyArgument(args[0]); const range = args[1];
      if (field === undefined || range === undefined) return undefined;
      const having = { kind: 'query_having' as const, condition: { kind: 'between' as const, field, values: range } };
      return name === 'orHavingBetween'
        ? { kind: 'instance', operation: { kind: 'or_having', having } }
        : { kind: 'instance', operation: { kind: 'having', having } };
    }
    case 'havingRaw': case 'orHavingRaw': {
      const expression = args[0];
      if (expression === undefined) return undefined;
      const bindings = args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] };
      const having = { kind: 'query_having' as const, condition: { kind: 'raw' as const, expression, bindings } };
      return name === 'orHavingRaw'
        ? { kind: 'instance', operation: { kind: 'or_having', having } }
        : { kind: 'instance', operation: { kind: 'having', having } };
    }
    case 'selectRaw': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'select_raw_expression', expression: value, bindings: args[1] === undefined ? { kind: 'none' } : { kind: 'some', value: args[1] } } };
    case 'insert': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'insert', values: value } };
    case 'insertOrIgnore': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'mutation', mutation: { kind: 'insert_or_ignore', values: value } } };
    case 'insertOrIgnoreReturning': {
      const values = args[0];
      const returning = args[1];
      const uniqueBy = args[2];
      if (values === undefined || returning === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'mutation', mutation: { kind: 'insert_or_ignore_returning', values, returning: { columns: returning, uniqueBy: uniqueBy === undefined ? { kind: 'none' } : { kind: 'some', value: uniqueBy } } } } };
    }

    case 'insertUsing': case 'insertOrIgnoreUsing': {
      if (args.length < 2) return undefined;
      return { kind: 'instance', operation: { kind: 'mutation', mutation: name === 'insertUsing' ? { kind: 'insert_using', columns: args[0], query: args[1] } : { kind: 'insert_or_ignore_using', columns: args[0], query: args[1] } } };
    }
    case 'insertGetId': {
      if (value === undefined) return undefined;
      const sequence = args[1] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[1] };
      return { kind: 'instance', operation: { kind: 'insert_get_id', values: value, sequence } };
    }
    case 'upsert': {
      if (args.length < 3) return undefined;
      return { kind: 'instance', operation: { kind: 'upsert', values: args[0], uniqueBy: args[1], update: args[2] } };
    }
    case 'chunkMap': {
      const callback = args[0];
      const count = args[1];
      if (callback === undefined || (callback.kind !== 'closure' && callback.kind !== 'arrow_function')) return undefined;
      return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'chunk_map', callback, count } } };
    }
    case 'each': {
      const callback = args[0];
      const count = args[1];
      if (callback === undefined || (callback.kind !== 'closure' && callback.kind !== 'arrow_function')) return undefined;
      return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'each', callback, count } } };
    }
    case 'eachById': case 'orderedChunkById': case 'orderedLazyById': {
      const callback = args.find((item) => item.kind === 'closure' || item.kind === 'arrow_function');
      const eachById = name === 'eachById';
      const orderedChunkById = name === 'orderedChunkById';
      const count = eachById ? args[1] : args[0];
      const callbackIndex = eachById || orderedChunkById ? 1 : -1;
      const columnIndex = eachById || orderedChunkById ? 2 : 1;
      const aliasIndex = eachById || orderedChunkById ? 3 : 2;
      const column = args[columnIndex] === undefined ? undefined : propertyArgument(args[columnIndex]);
      const alias = args[aliasIndex] === undefined ? undefined : propertyArgument(args[aliasIndex]);
      if (args[columnIndex] !== undefined && column === undefined) return undefined;
      if (args[aliasIndex] !== undefined && alias === undefined) return undefined;
      const descending = name === 'orderedChunkById' ? args[4] : name === 'orderedLazyById' ? args[3] : undefined;
      const direction = descending === undefined
        ? { kind: 'ascending' as const }
        : descending.kind === 'literal' && descending.value.kind === 'boolean_literal'
          ? descending.value.value.value ? { kind: 'descending' as const } : { kind: 'ascending' as const }
          : { kind: 'dynamic' as const, expression: descending };
      if (name === 'orderedLazyById') return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'ordered_lazy_by_id', chunkSize: count, column, alias, direction } } };
      if (callback === undefined || callbackIndex < 0) return undefined;
      if (eachById) return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'each_by_id', callback, count, column, alias, direction } } };
      return { kind: 'instance', operation: { kind: 'iteration', iteration: { kind: 'ordered_chunk_by_id', count, callback, column, alias, direction } } };
    }
    case 'chunk': {
      const count = args[0];
      const callback = args.find((item) => item.kind === 'closure' || item.kind === 'arrow_function');
      if (count === undefined || callback === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'chunk', count, callback } };
    }
    case 'lazy': return { kind: 'instance', operation: { kind: 'lazy', chunkSize: args[0] } };
    case 'delete': return { kind: 'instance', operation: { kind: 'delete' } };
    case 'fill': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'fill', values: value } };
    case 'create': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'create', values: value } };
    case 'update': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'update', values: value } };
    case 'updateFrom': return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'update_from', values: value } };
    case 'updateOrCreate': return args.length < 2 ? undefined : { kind: 'instance', operation: { kind: 'update_or_create', lookup: args[0], values: args[1] } };
    case 'updateOrInsert': return args.length < 2 ? undefined : { kind: 'instance', operation: { kind: 'update_or_insert', lookup: args[0], values: args[1] } };
    case 'firstOrCreate': return args.length < 2 ? undefined : { kind: 'instance', operation: { kind: 'first_or_create', attributes: args[0], values: args[1] } };
    case 'incrementEach': case 'decrementEach': {
      if (value === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'mutation', mutation: name === 'incrementEach' ? { kind: 'increment_each', columns: value } : { kind: 'decrement_each', columns: value } } };
    }
    case 'truncate': return { kind: 'instance', operation: { kind: 'mutation', mutation: { kind: 'truncate' } } };
    case 'increment': case 'decrement': {
      if (field === undefined || value === undefined) return undefined;
      const updates = args[2] === undefined ? { kind: 'none' as const } : { kind: 'some' as const, value: args[2] };
      return { kind: 'instance', operation: name === 'increment' ? { kind: 'increment', field, amount: value, updates } : { kind: 'decrement', field, amount: value, updates } };
    }
    case 'save': return { kind: 'instance', operation: { kind: 'save' } };
    case 'lock': {
      const lockValue = args[0];
      if (lockValue === undefined) return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'custom', value: expression } } };
      return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'custom', value: lockValue } } };
    }
    case 'lockForUpdate': return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'for_update' } } };
    case 'sharedLock': return { kind: 'instance', operation: { kind: 'lock', lock: { kind: 'shared' } } };
    case 'chunkById': case 'chunkByIdDesc': {
      const count = args[0];
      const callback = args.find((item) => item.kind === 'closure' || item.kind === 'arrow_function');
      if (count === undefined || callback === undefined) return undefined;
      const column = args[2] === undefined ? undefined : propertyArgument(args[2]);
      if (args[2] !== undefined && column === undefined) return undefined;
      const alias = args[3] === undefined ? undefined : propertyArgument(args[3]);
      if (args[3] !== undefined && alias === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'chunk_by_id', value: { kind: 'query_chunk_by_id', count, callback, column, alias, direction: name === 'chunkByIdDesc' ? { kind: 'descending' } : { kind: 'ascending' } } } };
    }
    case 'lazyById': case 'lazyByIdDesc': {
      const chunkSize = args[0];
      const column = args[1] === undefined ? undefined : propertyArgument(args[1]);
      if (args[1] !== undefined && column === undefined) return undefined;
      const alias = args[2] === undefined ? undefined : propertyArgument(args[2]);
      if (args[2] !== undefined && alias === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'lazy_by_id', value: { kind: 'query_lazy_by_id', chunkSize, column, alias, direction: name === 'lazyByIdDesc' ? { kind: 'descending' } : { kind: 'ascending' } } } };
    }
    case 'when': case 'unless': case 'tap': case 'pipe': {
      if (args.length === 0) return undefined;
      const foundCallback = args.find((item) => item.kind === 'closure' || item.kind === 'arrow_function');
      const callback = foundCallback === undefined ? args[1] : foundCallback;
      if (callback === undefined) return undefined;
      if (name === 'tap' || name === 'pipe') return { kind: 'instance', operation: { kind: 'pipeline', pipeline: { kind: name, callback } } };
      return { kind: 'instance', operation: { kind: 'pipeline', pipeline: { kind: name, condition: args[0], callback, defaultCallback: args.find((item, index) => index > 0 && item !== callback && (item.kind === 'closure' || item.kind === 'arrow_function')) } } };
    }
    case 'timeout': {
      return value === undefined ? undefined : { kind: 'instance', operation: { kind: 'timeout', seconds: value } };
    }
    case 'beforeQuery': case 'afterQuery': {
      const callback = args[0];
      if (callback === undefined) return undefined;
      return { kind: 'instance', operation: { kind: 'execution_hook', hook: name === 'beforeQuery' ? { kind: 'before_query', callback } : { kind: 'after_query', callback } } };
    }
    case 'useWritePdo': return { kind: 'instance', operation: { kind: 'execution_configuration', configuration: { kind: 'use_write_pdo' } } };
    case 'fetchUsing': return { kind: 'instance', operation: { kind: 'execution_configuration', configuration: { kind: 'fetch_using', arguments: expression.arguments } } };
    default: return undefined;
  }
};

const comparisonOperator = (expression: Expression): import('../../../types/upstream/expression').ComparisonOperator => {
  if (expression.kind === 'literal' && expression.value.kind === 'string_literal') {
    switch (expression.value.value.value) {
      case '=': return { kind: 'equal' }; case '===': return { kind: 'strict_equal' }; case '!=': return { kind: 'not_equal' }; case '!==': return { kind: 'strict_not_equal' };
      case '>': return { kind: 'greater' }; case '>=': return { kind: 'greater_equal' }; case '<': return { kind: 'less' }; case '<=': return { kind: 'less_equal' }; case 'like': return { kind: 'like' }; case 'not like': return { kind: 'not_like' };
    }
  }
  return { kind: 'equal' };
};

const modelStaticOperationFromExpression = (expression: Extract<Expression, { readonly kind: 'static_method' }>): QueryOperationAst | undefined => {
  if (expression.action.kind !== 'domain' || expression.receiver.kind !== 'class') return undefined;
  const name = expression.action.name.value.value;
  const args = expression.arguments.items;
  const positional: Expression[] = [];
  let current = args;
  while (current.kind === 'cons') {
    if (current.head.kind === 'positional') positional.push(current.head.value);
    current = current.tail;
  }
  const field = propertyArgument(positional[0]);
  const value = positional[positional.length - 1];
  switch (name) {
    case 'all': return { kind: 'model_static', operation: { kind: 'all' } };
    case 'query': return { kind: 'model_static', operation: { kind: 'query' } };
    case 'where': {
      if (field === undefined || positional.length < 2) return undefined;
      const operator = positional.length >= 3 ? comparisonOperator(positional[1]) : { kind: 'equal' as const };
      const operand = positional.length >= 3 ? positional[2] : positional[1];
      return { kind: 'model_static', operation: { kind: 'where', condition: { kind: 'basic', field, operator, value: operand } } };
    }
    case 'whereKey': return value === undefined ? undefined : { kind: 'model_static', operation: { kind: 'where_key', value } };
    case 'with': {
      const paths = relationPathsArgument(positional);
      if (paths === undefined) return undefined;
      const relations = { kind: 'relation_paths' as const, items: sequenceFromArray(paths) };
      return { kind: 'model_static', operation: { kind: 'with', relations } };
    }
    case 'orderBy': case 'orderByAsc': case 'orderByDesc': {
      const target = orderingTarget(positional[0]);
      if (target === undefined) return undefined;
      const direction = name === 'orderByDesc' ? { kind: 'descending' as const } : orderingDirection(positional[1]);
      return { kind: 'model_static', operation: { kind: 'order_by', target, direction } };
    }
    case 'select': return { kind: 'model_static', operation: { kind: 'select', projection: { kind: 'columns', arguments: expression.arguments } } };
    case 'findOrFail': return value === undefined ? undefined : { kind: 'model_static', operation: { kind: 'find_or_fail', key: value } };
    case 'create': return value === undefined ? undefined : { kind: 'model_static', operation: { kind: 'create', values: value } };
    case 'updateOrCreate': return positional.length < 2 ? undefined : { kind: 'model_static', operation: { kind: 'update_or_create', lookup: positional[0], values: positional[1] } };
    case 'firstOrCreate': return positional.length < 2 ? undefined : { kind: 'model_static', operation: { kind: 'first_or_create', attributes: positional[0], values: positional[1] } };
    default: return undefined;
  }
};

const operationFromExpression = (expression: Expression): QueryOperationAst | undefined => {
  switch (expression.kind) {
    case 'method': case 'nullsafe_method': return queryOperationFromNamedMethod(expression);
    case 'static_method':
      if (expression.action.kind === 'model') return { kind: 'model_static', operation: expression.action.operation };
      if (expression.action.kind === 'database_table') return { kind: 'database_table', expression };
      return modelStaticOperationFromExpression(expression);
    default: return undefined;
  }
};

const argumentExpressions = (expression: Expression): readonly Expression[] => {
  switch (expression.kind) {
    case 'method':
    case 'nullsafe_method': {
      const items = expression.arguments.items;
      const result: Expression[] = [];
      let current = items;
      while (current.kind === 'cons') {
        result.push(current.head);
        current = current.tail;
      }
      return [expression.receiver, ...result];
    }
    case 'static_method': {
      const items = expression.arguments.items;
      const result: Expression[] = [];
      let current = items;
      while (current.kind === 'cons') {
        result.push(current.head);
        current = current.tail;
      }
      return result;
    }
    case 'closure':
      return closureExpressions(expression.value);
    case 'arrow_function':
      return [expression.body];
    case 'binary':
      return [expression.left, expression.right];
    case 'unary':
      return [expression.operand];
    case 'cast':
      return [expression.expression];
    case 'coalesce':
      return [expression.left, expression.right];
    case 'property':
    case 'relation':
    case 'nullsafe_property':
      return [expression.receiver];
    case 'index':
      return [expression.receiver, expression.key];
    case 'conditional':
      return [expression.condition, expression.branches.whenTrue, ...(expression.branches.kind === 'then_else' ? [expression.branches.whenFalse] : [])];
    case 'short_conditional':
      return [expression.condition, expression.whenFalse];
    case 'array':
      return expression.entries.flatMap(entry => entry.kind === 'keyed' ? [entry.key, entry.value] : [entry.value]);
    case 'object': {
      const result: Expression[] = [];
      let current = expression.properties.items;
      while (current.kind === 'cons') {
        result.push(current.head.value);
        current = current.tail;
      }
      return result;
    }
    case 'match': {
      const result: Expression[] = [expression.subject];
      let current = expression.arms.items;
      while (current.kind === 'cons') {
        const arm = current.head;
        if (arm.kind === 'conditional') {
          let conditions = arm.conditions.items;
          while (conditions.kind === 'cons') {
            result.push(conditions.head);
            conditions = conditions.tail;
          }
        }
        result.push(arm.result);
        current = current.tail;
      }
      return result;
    }
    case 'builtin':
    case 'call':
    case 'callable_call':
    case 'construct':
    case 'dynamic_construct': {
      const items = expression.arguments.items;
      const result: Expression[] = [];
      let current = items;
      while (current.kind === 'cons') {
        result.push(current.head);
        current = current.tail;
      }
      if (expression.kind === 'callable_call') result.push(expression.callable);
      if (expression.kind === 'dynamic_construct') result.push(expression.classExpression);
      return result;
    }
    case 'anonymous_class':
      return expression.arguments.items.kind === 'empty' ? [] : sequenceArgumentExpressions(expression.arguments);
    case 'assignment_expression':
      return [expression.value.expression];
    default:
      return [];
  }
};

const arrayExpressionItems = (expression: Extract<Expression, { readonly kind: 'array' }>): Expression[] => {
  const result: Expression[] = [];
  let current = expression.entries;
  while (current.kind === 'cons') {
    const entry = current.head;
    if (entry.kind === 'keyed') result.push(entry.value);
    if (entry.kind === 'value') result.push(entry.value);
    current = current.tail;
  }
  return result;
};

const queryDateRelative = (name: string): import('../../../types/upstream/expression').QueryDateRelative => {
  switch (name) {
    case 'whereToday': case 'orWhereToday': return { kind: 'today' };
    case 'whereBeforeToday': case 'orWhereBeforeToday': return { kind: 'before_today' };
    case 'whereAfterToday': case 'orWhereAfterToday': return { kind: 'after_today' };
    case 'whereTodayOrBefore': case 'orWhereTodayOrBefore': return { kind: 'today_or_before' };
    case 'whereTodayOrAfter': case 'orWhereTodayOrAfter': return { kind: 'today_or_after' };
    case 'wherePast': case 'orWherePast': return { kind: 'past' };
    case 'whereFuture': case 'orWhereFuture': return { kind: 'future' };
    case 'whereNowOrPast': case 'orWhereNowOrPast': return { kind: 'now_or_past' };
    case 'whereNowOrFuture': case 'orWhereNowOrFuture': return { kind: 'now_or_future' };
  }
  return { kind: 'today' };
};

const queryDatePart = (name: string): import('../../../types/upstream/expression').QueryDatePart => {
  switch (name) {
    case 'whereDate': case 'orWhereDate': return { kind: 'date' };
    case 'whereMonth': case 'orWhereMonth': return { kind: 'month' };
    case 'whereDay': case 'orWhereDay': return { kind: 'day' };
    case 'whereYear': case 'orWhereYear': return { kind: 'year' };
    case 'whereTime': case 'orWhereTime': return { kind: 'time' };
    case 'whereToday': case 'orWhereToday': return { kind: 'today' };
    case 'whereBeforeToday': case 'orWhereBeforeToday': return { kind: 'before_today' };
    case 'whereAfterToday': case 'orWhereAfterToday': return { kind: 'after_today' };
    case 'whereTodayOrBefore': case 'orWhereTodayOrBefore': return { kind: 'today_or_before' };
    case 'whereTodayOrAfter': case 'orWhereTodayOrAfter': return { kind: 'today_or_after' };
    case 'wherePast': case 'orWherePast': return { kind: 'past' };
    case 'whereFuture': case 'orWhereFuture': return { kind: 'future' };
    case 'whereNowOrPast': case 'orWhereNowOrPast': return { kind: 'now_or_past' };
    case 'whereNowOrFuture': case 'orWhereNowOrFuture': return { kind: 'now_or_future' };
  }
  return { kind: 'date' };
};

const sequenceArgumentExpressions = (arguments_: import('../../../types/upstream/expression').ExpressionArguments): readonly Expression[] => {
  const result: Expression[] = [];
  let current = arguments_.items;
  while (current.kind === 'cons') {
    result.push(current.head);
    current = current.tail;
  }
  return result;
};

const closureExpressions = (closure: import('../../../types/upstream/expression').Closure): readonly Expression[] => {
  switch (closure.body.kind) {
    case 'expression_body': return [closure.body.expression];
    case 'statement_body': return sequenceExpressions(closure.body.statements);
  }
};

const closureStatementExpressions = (statement: import('../../../types/upstream/expression').ClosureStatement): readonly Expression[] => {
  switch (statement.kind) {
    case 'expression': return [statement.expression];
    case 'return_value': return [statement.expression];
    case 'return_void': return [];
    case 'assignment': return [statement.value.expression];
    case 'if': return [statement.condition, ...sequenceExpressions(statement.thenBlock), ...(statement.alternative.kind === 'else_block' ? sequenceExpressions(statement.alternative.block) : statement.alternative.kind === 'else_if' ? closureStatementExpressions(statement.alternative.statement) : [])];
    case 'foreach': return [statement.iterable, ...sequenceExpressions(statement.body)];
    case 'for': return [...forClauseExpressions(statement.initializer), ...forClauseExpressions(statement.condition), ...forClauseExpressions(statement.update), ...sequenceExpressions(statement.body)];
    case 'try': {
      const catches = sequenceCatches(statement.catches);
      return [...sequenceExpressions(statement.body), ...catches, ...(statement.finallyBlock.kind === 'present' ? sequenceExpressions(statement.finallyBlock.block) : [])];
    }
    case 'throw': return [statement.expression];
  }
};

const sequenceCatches = (catches: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/expression').ClosureCatchClause>): readonly Expression[] => {
  const result: Expression[] = [];
  let current = catches;
  while (current.kind === 'cons') {
    result.push(...sequenceExpressions(current.head.body));
    current = current.tail;
  }
  return result;
};

const sequenceExpressions = (statements: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/expression').ClosureStatement>): readonly Expression[] => {
  const result: Expression[] = [];
  let current = statements;
  while (current.kind === 'cons') {
    result.push(...closureStatementExpressions(current.head));
    current = current.tail;
  }
  return result;
};

const forClauseExpressions = (clause: import('../../../types/upstream/expression').ClosureForClause): readonly Expression[] => {
  switch (clause.kind) {
    case 'empty': return [];
    case 'expression': return [clause.value];
    case 'assignment': return [clause.value.value];
  }
};


const sequenceFromArray = <T>(items: readonly T[]): Sequence<T> => {
  let result: Sequence<T> = { kind: 'empty' };
  for (let index = items.length - 1; index >= 0; index -= 1) {
    result = { kind: 'cons', head: items[index], tail: result };
  }
  return result;
};

const queryChainOperations = (expression: Expression): readonly QueryOperationAst[] => {
  const operations: QueryOperationAst[] = [];
  const visit = (current: Expression): void => {
    const operation = operationFromExpression(current);
    if (current.kind === 'method' || current.kind === 'nullsafe_method') {
      visit(current.receiver);
    }
    if (operation !== undefined) operations.push(operation);
  };
  visit(expression);
  return operations;
};

const subqueryRole = (parent: Expression, child: Expression): import('../../../types/upstream/query').QuerySubqueryRole => {
  if (parent.kind !== 'method' && parent.kind !== 'nullsafe_method') return { kind: 'nested' };
  if (parent.operation.kind !== 'domain') return { kind: 'nested' };
  const name = parent.operation.name.value.value;
  switch (name) {
    case 'selectSub': return { kind: 'select' };
    case 'fromSub': return { kind: 'from' };
    case 'whereExists': case 'orWhereExists': case 'whereNotExists': case 'orWhereNotExists': return { kind: 'where_exists' };
    case 'whereIn': case 'whereNotIn': case 'orWhereIn': case 'orWhereNotIn': return { kind: 'where_in' };
    case 'where': case 'orWhere': return { kind: 'where_scalar' };
    case 'joinSub': case 'leftJoinSub': case 'rightJoinSub': case 'crossJoinSub': case 'straightJoinSub': return { kind: 'join' };
    case 'joinLateral': case 'leftJoinLateral': return { kind: 'lateral_join' };
    case 'union': case 'unionAll': return { kind: 'union' };
    case 'whereHas': case 'whereDoesntHave': case 'withWhereHas': return { kind: 'relation' };
    default: return { kind: 'nested' };
  }
};

const subqueryAlias = (parent: Expression, child: Expression): import('../../../types/upstream/collections').Option<Expression> => {
  if (parent.kind !== 'method' && parent.kind !== 'nullsafe_method') return { kind: 'none' };
  if (parent.operation.kind !== 'domain') return { kind: 'none' };
  const name = parent.operation.name.value.value;
  const args = positionalArguments(parent);
  const targetIndex = args.indexOf(child);
  const aliasIndex = name === 'selectSub' || name === 'fromSub' || name === 'joinSub' || name === 'leftJoinSub' || name === 'rightJoinSub' || name === 'crossJoinSub' || name === 'straightJoinSub' || name === 'joinLateral' || name === 'leftJoinLateral' ? targetIndex + 1 : -1;
  if (aliasIndex < 0 || aliasIndex >= args.length) return { kind: 'none' };
  return { kind: 'some', value: args[aliasIndex] };
};

const closureCaptureExpressions = (expression: Expression): readonly Expression[] => {
  if (expression.kind === 'closure') {
    const captures: Expression[] = [];
    let current = expression.value.captures.items;
    while (current.kind === 'cons') {
      const capture = current.head;
      captures.push({ kind: 'variable', name: capture.variable, source: expression.source });
      current = current.tail;
    }
    return captures;
  }
  if (expression.kind === 'arrow_function') return [];
  return [];
};

const subqueryCorrelation = (expression: Expression): import('../../../types/upstream/query').QuerySubqueryCorrelation => {
  const references = closureCaptureExpressions(expression);
  if (references.length === 0) return { kind: 'uncorrelated' };
  return {
    kind: 'correlated',
    references: sequenceFromArray(references.map(reference => ({
      kind: 'query_outer_reference' as const,
      expression: reference,
      source: reference.source,
    }))),
  };
};

const nestedQueriesFromExpression = (expression: Expression, inheritedRole: import('../../../types/upstream/query').QuerySubqueryRole = { kind: 'nested' }): readonly QuerySubqueryAst[] => argumentExpressions(expression).flatMap(child => {
  const operation = operationFromExpression(child);
  const role = expression.kind === 'method' || expression.kind === 'nullsafe_method' ? subqueryRole(expression, child) : inheritedRole;
  const nested = nestedQueriesFromExpression(child, role);
  if (operation === undefined) return nested;
  const model = modelFromReceiver(child);
  return [{
    kind: 'query_subquery_ast',
    operations: sequenceFromArray(queryChainOperations(child)),
    role,
    alias: subqueryAlias(expression, child),
    correlation: subqueryCorrelation(child),
    expression: child,
    model: model === undefined ? { kind: 'unknown' as const } : { kind: 'known' as const, name: model },
    source: child.source,
    nestedQueries: nested,
  }];
});

export const queryProducer: QueryProducer = {
  produce: ({ expressions }) => expressions.flatMap(expressionAst => {
    const operation = operationFromExpression(expressionAst.expression);
    if (operation === undefined) return [];
    const model = modelFromReceiver(expressionAst.expression);
    return [{
      kind: 'query_ast',
      operations: sequenceFromArray(queryChainOperations(expressionAst.expression)),
      expression: expressionAst,
      model: model === undefined ? { kind: 'unknown' as const } : { kind: 'known' as const, name: model },
      source: expressionAst.source,
      nestedQueries: nestedQueriesFromExpression(expressionAst.expression),
    }];
  }),
};
