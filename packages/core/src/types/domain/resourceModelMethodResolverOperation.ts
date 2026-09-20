import type { ResourceExpressionModel } from './resourceExpressionModel';
import { matchResourceExpression, matchResourceLiteralValue, type ResourceFieldExpressionVisitor } from './expressions';
import { matchResourceArgumentPresence, matchResourceStringLiteralResolution, matchResourcePropertyResolution, matchResourceComparisonOperatorResolution, matchResourcePredicateOperandResolution, matchResourceQueryFilterArgumentsResolution, matchResourceRelationFilterArgumentsResolution, matchResourcePredicateArgumentShape, matchResourceQueryOperationInput, matchResourceQueryOrderingTargetResolution, matchResourceQueryProjection, matchResourceWindowArguments, matchResourceGroupingArguments, matchResourceGroupingPropertyBatchResolution, matchResourceConditionalArguments, matchResourceProjectionArguments, matchResourceRelationLoadTargetResolution, matchResourceRelationLoadBatchResolution, parseResourceRelationLoadTarget, type ResourceArgumentPresence, type ResourceQueryFilterArguments, type ResourceQueryOrderingTarget, type ResourceQueryOrderingTargetResolution, type ResourceQueryPredicate, type ResourceQueryProjection, type ResourceRelationLoadArguments, type ResourceRelationLoadTarget, type ResourceRelationLoadTargetResolution, type ResourceRelationLoadBatchResolution, type ResourceResolvedQueryOperation, type ResourceQueryOperationInput, type ResourceQueryFilterArgumentsResolution, type ResourceRelationFilterArgumentsResolution, type ResourcePredicateArgumentShape, type ResourceOrderingArguments, type ResourceProjectionArguments, type ResourceLockingArguments, type ResourceDistinctArguments, type ResourceWindowOperationArguments, type ResourceConditionalOperationArguments, type ResourceQueryOperationError, type ResourceStringLiteralResolution, type ResourcePropertyResolution, type ResourceComparisonOperatorResolution, type ResourcePredicateOperandResolution, type ResourceGroupingPropertyBatchResolution } from './resourceQueryOperation';
import { SemanticValueFactory, type MethodName, type PropertyName } from './semanticValues';
import { matchResourceQueryMutation, matchResourceModelMethodMeaning, type ResourceModelMethodMeaning } from './resourceModelMethodMeaning';
import type { ResourceConditionalArguments, ResourceGroupingArguments, ResourcePaginationArguments, ResourceWindowArguments } from './resourceQueryOperation';

function literalString(expression: ResourceExpressionModel): ResourceStringLiteralResolution {
  if (expression.expression.kind !== 'literal') return { kind: 'not_string' };
  return matchResourceLiteralValue<ResourceStringLiteralResolution>(expression.expression.value, {
    string: value => ({ kind: 'resolved', value: value.value }),
    number: () => ({ kind: 'not_string' }),
    boolean: () => ({ kind: 'not_string' }),
    null: () => ({ kind: 'not_string' }),
  });
}

function relationLoadTargets(args: readonly ResourceExpressionModel[]): ResourceRelationLoadArguments {
  return matchResourceArgumentPresence<ResourceRelationLoadArguments>(argumentAt(args, 0), {
    missing: (): ResourceRelationLoadArguments => ({ kind: 'invalid', reason: 'missing_target' }),
    present: argument => matchRelationLoadLexemes<ResourceRelationLoadArguments>(relationLoadLexemes(argument.value), {
      targets: value => matchResourceRelationLoadBatchResolution<ResourceRelationLoadArguments>(resolveRelationLoadBatch(value.values), {
        resolved: batch => ({ kind: 'targets', targets: batch.targets }),
        invalid: () => ({ kind: 'invalid', reason: 'invalid_target' }),
      }),
      empty: () => ({ kind: 'invalid', reason: 'empty_target_list' }),
      invalid: () => ({ kind: 'invalid', reason: 'invalid_target' }),
    }),
  });
}

function resolveRelationLoadBatch(values: readonly string[]): ResourceRelationLoadBatchResolution {
  const resolutions = Object.freeze(values.map(parseResourceRelationLoadTarget));
  return resolutions.reduce<ResourceRelationLoadBatchResolution>(
    (batch, resolution) => matchResourceRelationLoadBatchResolution(batch, {
      invalid: () => batch,
      resolved: current => matchResourceRelationLoadTargetResolution<ResourceRelationLoadBatchResolution>(resolution, {
        invalid: () => ({ kind: 'invalid', reason: 'invalid_target' }),
        resolved: value => ({ kind: 'resolved', targets: Object.freeze([...current.targets, value.target]) }),
      }),
    }),
    { kind: 'resolved', targets: Object.freeze([]) },
  );
}

type ResourceRelationLoadLexemes =
  | { readonly kind: 'targets'; readonly values: readonly string[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid' };

function matchRelationLoadLexemes<R>(value: ResourceRelationLoadLexemes, visitor: {
  readonly targets: (value: Extract<ResourceRelationLoadLexemes, { readonly kind: 'targets' }>) => R;
  readonly empty: (value: Extract<ResourceRelationLoadLexemes, { readonly kind: 'empty' }>) => R;
  readonly invalid: (value: Extract<ResourceRelationLoadLexemes, { readonly kind: 'invalid' }>) => R;
}): R {
  return value.kind === 'targets' ? visitor.targets(value) : value.kind === 'empty' ? visitor.empty(value) : visitor.invalid(value);
}

function relationLoadLexemes(expression: ResourceExpressionModel): ResourceRelationLoadLexemes {
  return matchResourceStringLiteralResolution(literalString(expression), {
    resolved: value => ({ kind: 'targets', values: Object.freeze([value.value]) }),
    not_string: () => arrayLiteralValues(expression),
  });
}

function arrayLiteralValues(expression: ResourceExpressionModel): ResourceRelationLoadLexemes {
  if (expression.expression.kind !== 'array') return { kind: 'invalid' };
  const values: string[] = [];
  for (const entry of expression.expression.entries) {
    const resolution = matchResourceStringLiteralResolution<{ readonly kind: 'resolved'; readonly value: string } | { readonly kind: 'invalid' }>(literalString(entry.value), {
      resolved: item => ({ kind: 'resolved', value: item.value }),
      not_string: () => ({ kind: 'invalid' }),
    });
    if (resolution.kind === 'invalid') return { kind: 'invalid' };
    values.push(resolution.value);
  }
  return values.length === 0
    ? ({ kind: 'empty' } as const)
    : ({ kind: 'targets', values: Object.freeze(values) } as const);
}

function matchRelationLoadArguments<R>(
  value: ResourceRelationLoadArguments,
  visitor: { readonly targets: (value: Extract<ResourceRelationLoadArguments, { readonly kind: 'targets' }>) => R; readonly invalid: (value: Extract<ResourceRelationLoadArguments, { readonly kind: 'invalid' }>) => R },
): R {
  return value.kind === 'targets' ? visitor.targets(value) : visitor.invalid(value);
}

type ComparisonOperatorLexeme =
  | '=' | '==' | '!=' | '<>' | '<' | '<=' | '>' | '>='
  | 'like' | 'not like' | 'in' | 'not in';

interface ComparisonOperatorRegistry {
  readonly [lexeme: string]: Extract<ResourceResolvedQueryOperation, { kind: 'filter' }>['predicate']['operator'];
}

const comparisonOperators: ComparisonOperatorRegistry = Object.freeze({
  '=': 'equal', '==': 'equal', '!=': 'not_equal', '<>': 'not_equal',
  '<': 'less_than', '<=': 'less_than_or_equal', '>': 'greater_than', '>=': 'greater_than_or_equal',
  like: 'like', 'not like': 'not_like', in: 'in', 'not in': 'not_in',
});

function comparisonOperatorFromLexeme(lexeme: string): ResourceComparisonOperatorResolution {
  const operator = comparisonOperators[lexeme];
  return operator === undefined ? { kind: 'unsupported' } : { kind: 'resolved', operator };
}

function predicatePropertyOperandShape(args: readonly ResourceExpressionModel[]): ResourcePredicateArgumentShape {
  return matchResourceArgumentPresence<ResourcePredicateArgumentShape>(argumentAt(args, 0), {
    missing: () => ({ kind: 'invalid', reason: 'missing_property' } as const),
    present: property => matchResourceArgumentPresence<ResourcePredicateArgumentShape>(argumentAt(args, 1), {
      missing: () => ({ kind: 'invalid', reason: 'missing_operand' } as const),
      present: operand => ({ kind: 'property_operand', property: property.value, operand: operand.value } as const),
    }),
  });
}

function predicatePropertyOperatorOperandShape(args: readonly ResourceExpressionModel[]): ResourcePredicateArgumentShape {
  return matchResourceArgumentPresence<ResourcePredicateArgumentShape>(argumentAt(args, 0), {
    missing: () => ({ kind: 'invalid', reason: 'missing_property' } as const),
    present: property => matchResourceArgumentPresence<ResourcePredicateArgumentShape>(argumentAt(args, 1), {
      missing: () => ({ kind: 'invalid', reason: 'missing_operand' } as const),
      present: operator => matchResourceArgumentPresence<ResourcePredicateArgumentShape>(argumentAt(args, 2), {
        missing: () => ({ kind: 'invalid', reason: 'missing_operand' } as const),
        present: operand => ({ kind: 'property_operator_operand', property: property.value, operator: operator.value, operand: operand.value } as const),
      }),
    }),
  });
}

function predicateArgumentShape(args: readonly ResourceExpressionModel[]): ResourcePredicateArgumentShape {
  const resolvers: Readonly<Record<number, () => ResourcePredicateArgumentShape>> = Object.freeze({
    2: () => predicatePropertyOperandShape(args),
    3: () => predicatePropertyOperatorOperandShape(args),
  });
  const resolver = resolvers[args.length];
  return resolver === undefined ? { kind: 'invalid', reason: 'unsupported_arity' } : resolver();
}

function predicateFromShape(shape: ResourcePredicateArgumentShape): ResourceQueryFilterArgumentsResolution {
  return matchResourcePredicateArgumentShape<ResourceQueryFilterArgumentsResolution>(shape, {
    invalid: value => ({ kind: 'invalid', reason: value.reason }),
    property_operand: value => predicateFromExpressions(value.property, value.operand, 'equal'),
    property_operator_operand: value => matchResourceComparisonOperatorResolution(comparisonOperatorFromExpression(value.operator), {
      default: () => predicateFromExpressions(value.property, value.operand, 'equal'),
      resolved: operator => predicateFromExpressions(value.property, value.operand, operator.operator),
      invalid_value: () => ({ kind: 'invalid', reason: 'invalid_operator_value' }),
      unsupported: () => ({ kind: 'invalid', reason: 'unsupported_operator' }),
    }),
  });
}

function predicateFromExpressions(
  propertyExpression: ResourceExpressionModel,
  operand: ResourceExpressionModel,
  operator: Extract<ResourceResolvedQueryOperation, { kind: 'filter' }>['predicate']['operator'],
): ResourceQueryFilterArgumentsResolution {
  return matchResourcePropertyResolution<ResourceQueryFilterArgumentsResolution>(propertyExpressionResolution(propertyExpression), {
    missing: () => ({ kind: 'invalid', reason: 'missing_property' }),
    invalid_value: () => ({ kind: 'invalid', reason: 'invalid_property_value' }),
    resolved: property => ({ kind: 'valid', arguments: Object.freeze({ property: property.property, operator, operand }) }),
  });
}

function propertyExpressionResolution(expression: ResourceExpressionModel): ResourcePropertyResolution {
  return matchResourceStringLiteralResolution<ResourcePropertyResolution>(literalString(expression), {
    resolved: value => ({ kind: 'resolved', property: SemanticValueFactory.propertyName(value.value) }),
    not_string: () => ({ kind: 'invalid_value' }),
  });
}

function comparisonOperatorFromExpression(expression: ResourceExpressionModel): ResourceComparisonOperatorResolution {
  return matchResourceStringLiteralResolution<ResourceComparisonOperatorResolution>(literalString(expression), {
    resolved: item => comparisonOperatorFromLexeme(item.value),
    not_string: () => ({ kind: 'invalid_value' }),
  });
}

const rawProjection = (expression: ResourceExpressionModel): ResourceQueryProjection => Object.freeze({ kind: 'raw', expression });

function projectionFromExpression(expression: ResourceExpressionModel): ResourceQueryProjection {
  const visitors: ResourceFieldExpressionVisitor<ResourceQueryProjection> = {
    primitive: () => rawProjection(expression),
    model: () => rawProjection(expression),
    resource: () => rawProjection(expression),
    object: () => rawProjection(expression),
    array: () => rawProjection(expression),
    property_access: () => rawProjection(expression),
    nullsafe_property_access: () => rawProjection(expression),
    variable: () => rawProjection(expression),
    type_cast: () => rawProjection(expression),
    binary_expression: () => rawProjection(expression),
    method_call: () => rawProjection(expression),
    nullsafe_method_call: () => rawProjection(expression),
    static_method_call: () => rawProjection(expression),
    array_access: () => rawProjection(expression),
    function_call: () => rawProjection(expression),
    ternary: () => rawProjection(expression),
    short_ternary: () => rawProjection(expression),
    null_coalesce: () => rawProjection(expression),
    unary_expression: () => rawProjection(expression),
    match_expression: () => rawProjection(expression),
    class_reference: () => rawProjection(expression),
    construct: () => rawProjection(expression),
    instance_of: () => rawProjection(expression),
    closure: () => rawProjection(expression),
    arrow_function: () => rawProjection(expression),
    literal: value => matchResourceLiteralValue(value.value, {
      string: literal => Object.freeze({ kind: 'property', property: SemanticValueFactory.propertyName(literal.value) }),
      number: () => rawProjection(expression),
      boolean: () => rawProjection(expression),
      null: () => rawProjection(expression),
    }),
    unsupported: () => rawProjection(expression),
  };
  return matchResourceExpression(expression.expression, visitors);
}

function projectionArguments(args: readonly ResourceExpressionModel[]): ResourceProjectionArguments {
  const projections = Object.freeze(args.map(projectionFromExpression));
  const primary = projections[0];
  if (primary === undefined) return { kind: 'invalid', reason: 'empty_projection_list' };
  return matchResourceQueryProjection<ResourceProjectionArguments>(primary, {
    property: value => ({ kind: 'resolved', projections, primary: value }),
    raw: () => ({ kind: 'invalid', reason: 'unsupported_primary_projection' }),
  });
}

function orderingTargetFromArguments(args: readonly ResourceExpressionModel[]): ResourceQueryOrderingTargetResolution {
  return matchResourceArgumentPresence<ResourceQueryOrderingTargetResolution>(argumentAt(args, 0), {
    missing: () => ({ kind: 'invalid', reason: 'missing_target' }),
    present: argument => orderingTargetFromProjection(projectionFromExpression(argument.value)),
  });
}

function propertyOrderingTarget(property: PropertyName): ResourceQueryOrderingTarget {
  return { kind: 'property', property };
}

function rawOrderingTarget(expression: ResourceExpressionModel): ResourceQueryOrderingTarget {
  return { kind: 'raw', expression };
}

function orderingTargetFromProjection(projection: ResourceQueryProjection): ResourceQueryOrderingTargetResolution {
  return matchResourceQueryProjection(projection, {
    property: value => ({ kind: 'resolved', target: propertyOrderingTarget(value.property) }),
    raw: value => ({ kind: 'resolved', target: rawOrderingTarget(value.expression) }),
  });
}

function matchOrderingTarget<R>(resolution: ResourceQueryOrderingTargetResolution, visitor: {
  readonly resolved: (value: Extract<ResourceQueryOrderingTargetResolution, { readonly kind: 'resolved' }>) => R;
  readonly invalid: (value: Extract<ResourceQueryOrderingTargetResolution, { readonly kind: 'invalid' }>) => R;
}): R {
  return matchResourceQueryOrderingTargetResolution(resolution, {
    resolved: visitor.resolved,
    invalid: value => visitor.invalid(value),
  });
}

function paginationArguments(args: readonly ResourceExpressionModel[]): ResourcePaginationArguments {
  return matchResourceArgumentPresence<ResourcePaginationArguments>(argumentAt(args, 0), {
    missing: () => ({ kind: 'framework_default' }),
    present: argument => ({ kind: 'explicit', value: argument.value }),
  });
}

function windowArguments(args: readonly ResourceExpressionModel[]): ResourceWindowArguments {
  return matchResourceArgumentPresence<ResourceWindowArguments>(argumentAt(args, 0), {
    missing: () => ({ kind: 'invalid', reason: 'missing_value' }),
    present: argument => ({ kind: 'value', value: argument.value }),
  });
}

function groupingPropertyBatch(args: readonly ResourceExpressionModel[]): ResourceGroupingPropertyBatchResolution {
  const properties: PropertyName[] = [];
  for (const argument of args) {
    const resolution = propertyExpressionResolution(argument);
    const property = matchResourcePropertyResolution<ResourceGroupingPropertyBatchResolution>(resolution, {
      resolved: value => { properties.push(value.property); return { kind: 'resolved', properties: Object.freeze(properties) }; },
      missing: () => ({ kind: 'invalid' as const, reason: 'invalid_property' as const }),
      invalid_value: () => ({ kind: 'invalid' as const, reason: 'invalid_property' as const }),
    });
    if (property.kind === 'invalid') return property;
  }
  return { kind: 'resolved', properties: Object.freeze(properties) };
}

function groupingArguments(args: readonly ResourceExpressionModel[]): ResourceGroupingArguments {
  return matchResourceGroupingPropertyBatchResolution<ResourceGroupingArguments>(groupingPropertyBatch(args), {
    resolved: value => ({ kind: 'properties', properties: value.properties }),
    invalid: value => ({ kind: 'invalid', reason: value.reason }),
  });
}

function conditionalArguments(args: readonly ResourceExpressionModel[]): ResourceConditionalArguments {
  return matchResourceArgumentPresence<ResourceConditionalArguments>(argumentAt(args, 0), {
    missing: () => ({ kind: 'invalid', reason: 'missing_condition' }),
    present: condition => matchResourceArgumentPresence<ResourceConditionalArguments>(argumentAt(args, 1), {
      missing: () => ({ kind: 'invalid', reason: 'missing_callback' }),
      present: callback => ({ kind: 'condition_callback', condition: condition.value, callback: callback.value }),
    }),
  });
}

function argumentAt(args: readonly ResourceExpressionModel[], index: number): ResourceArgumentPresence {
  const value = args[index];
  return value === undefined ? { kind: 'missing', index } : { kind: 'present', value };
}

function queryOperationInput(
  operation: Extract<ResourceModelMethodMeaning, { readonly kind: 'query_mutation' }>['operation'],
  args: readonly ResourceExpressionModel[],
): ResourceQueryOperationInput {
  return matchResourceQueryMutation<ResourceQueryOperationInput>(operation, {
    filter: () => ({ kind: 'filter', arguments: predicateFromShape(predicateArgumentShape(args)) }),
    relation_filter: () => ({ kind: 'relation_filter', arguments: relationFilterArguments(args) }),
    relation_load: () => ({ kind: 'relation_load', arguments: relationLoadTargets(args) }),
    ordering: value => ({ kind: 'ordering', arguments: orderingArguments(args, value.direction) }),
    projection: () => ({ kind: 'projection', arguments: projectionArguments(args) }),
    pagination: () => ({ kind: 'pagination', arguments: paginationArguments(args) }),
    window: value => ({ kind: 'window', arguments: Object.freeze({ operation: value.operation, value: windowArguments(args) }) }),
    grouping: () => ({ kind: 'grouping', arguments: groupingArguments(args) }),
    having: () => ({ kind: 'having', arguments: predicateFromShape(predicateArgumentShape(args)) }),
    locking: value => ({ kind: 'locking', arguments: Object.freeze({ mode: value.mode }) }),
    distinct: () => ({ kind: 'distinct', arguments: Object.freeze({}) }),
    conditional: value => ({ kind: 'conditional', arguments: Object.freeze({ branch: value.branch, value: conditionalArguments(args) }) }),
  });
}

function relationFilterArguments(args: readonly ResourceExpressionModel[]): ResourceRelationFilterArgumentsResolution {
  const targets = relationLoadTargets(args);
  return matchRelationLoadArguments<ResourceRelationFilterArgumentsResolution>(targets, {
    targets: value => matchResourceArgumentPresence<ResourceRelationFilterArgumentsResolution>(argumentAt(args, 1), {
      missing: () => ({ kind: 'invalid', reason: 'missing_callback' }),
      present: callback => ({ kind: 'valid', arguments: Object.freeze({ targets: value.targets, callback: callback.value }) }),
    }),
    invalid: value => ({ kind: 'invalid', reason: value.reason }),
  });
}

function orderingArguments(args: readonly ResourceExpressionModel[], direction: 'ascending' | 'descending'): ResourceOrderingArguments {
  return matchOrderingTarget<ResourceOrderingArguments>(orderingTargetFromArguments(args), {
    resolved: value => ({ kind: 'valid', target: value.target, direction }),
    invalid: value => ({ kind: 'invalid', reason: value.reason }),
  });
}

type Mutation = Extract<ResourceModelMethodMeaning, { readonly kind: 'query_mutation' }>['operation'];
type MutationHandlerMap = {
  [K in ResourceQueryOperationInput['kind']]: (method: MethodName, input: Extract<ResourceQueryOperationInput, { readonly kind: K }>) => ResourceResolvedQueryOperation;
};

const invalid = (method: MethodName, error: ResourceQueryOperationError): ResourceResolvedQueryOperation =>
  Object.freeze({ kind: 'invalid', method, error });

const mutationHandlers: Readonly<MutationHandlerMap> = {
  filter: (method, input) => matchResourceQueryFilterArgumentsResolution(input.arguments, {
    valid: value => ({ kind: 'filter', method, predicate: value.arguments }),
    invalid: value => invalid(method, { kind: 'filter', error: { kind: value.reason } }),
  }),
  relation_filter: (method, input) => matchResourceRelationFilterArgumentsResolution(input.arguments, {
    valid: value => ({ kind: 'relation_filter', method, targets: value.arguments.targets, callback: value.arguments.callback }),
    invalid: value => invalid(method, { kind: 'relation_filter', error: { kind: value.reason } }),
  }),
  relation_load: (method, input) => matchRelationLoadArguments(input.arguments, {
    targets: value => ({ kind: 'relation_load', method, targets: value.targets }),
    invalid: value => invalid(method, { kind: 'relation_load', error: { kind: value.reason } }),
  }),
  ordering: (method, input) => matchResourceOrderingArguments(input.arguments, {
    valid: value => ({ kind: 'ordering', method, target: value.target, direction: value.direction }),
    invalid: value => invalid(method, { kind: 'ordering', error: { kind: value.reason } }),
  }),
  projection: (method, input) => matchResourceProjectionArguments(input.arguments, {
    resolved: value => ({ kind: 'projection', method, projections: value.projections, primary: value.primary }),
    invalid: value => invalid(method, { kind: 'projection', error: { kind: value.reason } }),
  }),
  pagination: (method, input) => ({ kind: 'pagination', method, pageSize: input.arguments }),
  window: (method, input) => matchResourceWindowArguments(input.arguments.value, {
    value: resolved => ({ kind: 'window', method, operation: input.arguments.operation, value: resolved.value }),
    invalid: value => invalid(method, { kind: 'window', error: { kind: value.reason } }),
  }),
  grouping: (method, input) => matchResourceGroupingArguments(input.arguments, {
    properties: value => ({ kind: 'grouping', method, properties: value.properties }),
    invalid: value => invalid(method, { kind: 'grouping', error: { kind: value.reason } }),
  }),
  having: (method, input) => matchResourceQueryFilterArgumentsResolution(input.arguments, {
    valid: value => ({ kind: 'having', method, predicate: value.arguments }),
    invalid: value => invalid(method, { kind: 'having', error: { kind: value.reason } }),
  }),
  locking: (method, input) => ({ kind: 'locking', method, mode: input.arguments.mode }),
  distinct: method => ({ kind: 'distinct', method }),
  conditional: (method, input) => matchResourceConditionalArguments(input.arguments.value, {
    condition_callback: value => ({ kind: 'conditional', method, branch: input.arguments.branch, condition: value.condition, callback: value.callback }),
    invalid: value => invalid(method, { kind: 'conditional', error: { kind: value.reason } }),
  }),
};

function matchResourceOrderingArguments<R>(value: ResourceOrderingArguments, visitor: {
  readonly valid: (value: Extract<ResourceOrderingArguments, { readonly kind: 'valid' }>) => R;
  readonly invalid: (value: Extract<ResourceOrderingArguments, { readonly kind: 'invalid' }>) => R;
}): R {
  return value.kind === 'valid' ? visitor.valid(value) : visitor.invalid(value);
}

function dispatchOperationInput(method: MethodName, input: ResourceQueryOperationInput): ResourceResolvedQueryOperation {
  return matchResourceQueryOperationInput(input, {
    filter: value => mutationHandlers.filter(method, value),
    relation_filter: value => mutationHandlers.relation_filter(method, value),
    relation_load: value => mutationHandlers.relation_load(method, value),
    ordering: value => mutationHandlers.ordering(method, value),
    projection: value => mutationHandlers.projection(method, value),
    pagination: value => mutationHandlers.pagination(method, value),
    window: value => mutationHandlers.window(method, value),
    grouping: value => mutationHandlers.grouping(method, value),
    having: value => mutationHandlers.having(method, value),
    locking: value => mutationHandlers.locking(method, value),
    distinct: value => mutationHandlers.distinct(method, value),
    conditional: value => mutationHandlers.conditional(method, value),
  });
}

export function resolveResourceQueryOperation(method: MethodName, meaning: ResourceModelMethodMeaning, args: readonly ResourceExpressionModel[]): ResourceResolvedQueryOperation {
  return matchResourceModelMethodMeaning(meaning, {
    query_origin: () => Object.freeze({ kind: 'none' }),
    query_mutation: value => dispatchOperationInput(method, queryOperationInput(value.operation, args)),
    single_model: () => Object.freeze({ kind: 'none' }),
    model_collection: () => Object.freeze({ kind: 'none' }),
    paginated_collection: () => Object.freeze({ kind: 'none' }),
    scalar: () => Object.freeze({ kind: 'none' }),
    value_collection: () => Object.freeze({ kind: 'none' }),
    unsupported: () => Object.freeze({ kind: 'none' }),
  });
}
