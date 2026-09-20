import type { ResourceExpressionModel } from './resourceExpressionModel';
import { SemanticValueFactory, type MethodName, type PropertyName, type RelationName } from './semanticValues';

export type ResourceQueryComparisonOperator =
  | 'equal' | 'not_equal' | 'less_than' | 'less_than_or_equal'
  | 'greater_than' | 'greater_than_or_equal' | 'like' | 'not_like'
  | 'in' | 'not_in' | 'null' | 'not_null';

export interface ResourceQueryPredicate {
  readonly property: PropertyName;
  readonly operator: ResourceQueryComparisonOperator;
  readonly operand: ResourceExpressionModel;
}

/** Semantic filter input. Argument position has already been resolved at the query boundary. */
export type ResourceArgumentPresence =
  | { readonly kind: 'present'; readonly value: ResourceExpressionModel }
  | { readonly kind: 'missing'; readonly index: number };

export interface ResourceArgumentPresenceVisitor<R> {
  readonly present: (argument: Extract<ResourceArgumentPresence, { readonly kind: 'present' }>) => R;
  readonly missing: (argument: Extract<ResourceArgumentPresence, { readonly kind: 'missing' }>) => R;
}

export function matchResourceArgumentPresence<R>(argument: ResourceArgumentPresence, visitor: ResourceArgumentPresenceVisitor<R>): R {
  return argument.kind === 'present' ? visitor.present(argument) : visitor.missing(argument);
}

export type ResourceStringLiteralResolution =
  | { readonly kind: 'resolved'; readonly value: string }
  | { readonly kind: 'not_string' };

export interface ResourceStringLiteralResolutionVisitor<R> {
  readonly resolved: (value: Extract<ResourceStringLiteralResolution, { readonly kind: 'resolved' }>) => R;
  readonly not_string: (value: Extract<ResourceStringLiteralResolution, { readonly kind: 'not_string' }>) => R;
}

export function matchResourceStringLiteralResolution<R>(value: ResourceStringLiteralResolution, visitor: ResourceStringLiteralResolutionVisitor<R>): R {
  return value.kind === 'resolved' ? visitor.resolved(value) : visitor.not_string(value);
}

export type ResourcePropertyResolution =
  | { readonly kind: 'resolved'; readonly property: PropertyName }
  | { readonly kind: 'missing' }
  | { readonly kind: 'invalid_value' };

export interface ResourcePropertyResolutionVisitor<R> {
  readonly resolved: (value: Extract<ResourcePropertyResolution, { readonly kind: 'resolved' }>) => R;
  readonly missing: (value: Extract<ResourcePropertyResolution, { readonly kind: 'missing' }>) => R;
  readonly invalid_value: (value: Extract<ResourcePropertyResolution, { readonly kind: 'invalid_value' }>) => R;
}

export function matchResourcePropertyResolution<R>(value: ResourcePropertyResolution, visitor: ResourcePropertyResolutionVisitor<R>): R {
  switch (value.kind) {
    case 'resolved': return visitor.resolved(value);
    case 'missing': return visitor.missing(value);
    case 'invalid_value': return visitor.invalid_value(value);
  }
}

export type ResourceComparisonOperatorResolution =
  | { readonly kind: 'default' }
  | { readonly kind: 'resolved'; readonly operator: ResourceQueryComparisonOperator }
  | { readonly kind: 'invalid_value' }
  | { readonly kind: 'unsupported' };

export interface ResourceComparisonOperatorResolutionVisitor<R> {
  readonly default: (value: Extract<ResourceComparisonOperatorResolution, { readonly kind: 'default' }>) => R;
  readonly resolved: (value: Extract<ResourceComparisonOperatorResolution, { readonly kind: 'resolved' }>) => R;
  readonly invalid_value: (value: Extract<ResourceComparisonOperatorResolution, { readonly kind: 'invalid_value' }>) => R;
  readonly unsupported: (value: Extract<ResourceComparisonOperatorResolution, { readonly kind: 'unsupported' }>) => R;
}

export function matchResourceComparisonOperatorResolution<R>(value: ResourceComparisonOperatorResolution, visitor: ResourceComparisonOperatorResolutionVisitor<R>): R {
  switch (value.kind) {
    case 'default': return visitor.default(value);
    case 'resolved': return visitor.resolved(value);
    case 'invalid_value': return visitor.invalid_value(value);
    case 'unsupported': return visitor.unsupported(value);
  }
}

export type ResourcePredicateOperandResolution =
  | { readonly kind: 'resolved'; readonly operand: ResourceExpressionModel }
  | { readonly kind: 'missing' };

export interface ResourcePredicateOperandResolutionVisitor<R> {
  readonly resolved: (value: Extract<ResourcePredicateOperandResolution, { readonly kind: 'resolved' }>) => R;
  readonly missing: (value: Extract<ResourcePredicateOperandResolution, { readonly kind: 'missing' }>) => R;
}

export function matchResourcePredicateOperandResolution<R>(value: ResourcePredicateOperandResolution, visitor: ResourcePredicateOperandResolutionVisitor<R>): R {
  return value.kind === 'resolved' ? visitor.resolved(value) : visitor.missing(value);
}

export type ResourcePredicateArgumentShape =
  | { readonly kind: 'property_operand'; readonly property: ResourceExpressionModel; readonly operand: ResourceExpressionModel }
  | { readonly kind: 'property_operator_operand'; readonly property: ResourceExpressionModel; readonly operator: ResourceExpressionModel; readonly operand: ResourceExpressionModel }
  | { readonly kind: 'invalid'; readonly reason: 'missing_property' | 'missing_operand' | 'unsupported_arity' };

export interface ResourcePredicateArgumentShapeVisitor<R> {
  readonly property_operand: (shape: Extract<ResourcePredicateArgumentShape, { readonly kind: 'property_operand' }>) => R;
  readonly property_operator_operand: (shape: Extract<ResourcePredicateArgumentShape, { readonly kind: 'property_operator_operand' }>) => R;
  readonly invalid: (shape: Extract<ResourcePredicateArgumentShape, { readonly kind: 'invalid' }>) => R;
}

export function matchResourcePredicateArgumentShape<R>(shape: ResourcePredicateArgumentShape, visitor: ResourcePredicateArgumentShapeVisitor<R>): R {
  switch (shape.kind) {
    case 'property_operand': return visitor.property_operand(shape);
    case 'property_operator_operand': return visitor.property_operator_operand(shape);
    case 'invalid': return visitor.invalid(shape);
  }
}

export interface ResourceQueryFilterArguments {
  readonly property: PropertyName;
  readonly operator: ResourceQueryComparisonOperator;
  readonly operand: ResourceExpressionModel;
}
export type ResourceQueryFilterArgumentsResolution =
  | { readonly kind: 'valid'; readonly arguments: ResourceQueryFilterArguments }
  | { readonly kind: 'invalid'; readonly reason: 'missing_property' | 'invalid_property_value' | 'invalid_operator_value' | 'unsupported_operator' | 'missing_operand' | 'unsupported_arity' };

export interface ResourceQueryFilterArgumentsResolutionVisitor<R> {
  readonly valid: (resolution: Extract<ResourceQueryFilterArgumentsResolution, { readonly kind: 'valid' }>) => R;
  readonly invalid: (resolution: Extract<ResourceQueryFilterArgumentsResolution, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceQueryFilterArgumentsResolution<R>(
  resolution: ResourceQueryFilterArgumentsResolution,
  visitor: ResourceQueryFilterArgumentsResolutionVisitor<R>,
): R {
  return resolution.kind === 'valid' ? visitor.valid(resolution) : visitor.invalid(resolution);
}

export type ResourceRelationLoadSelection =
  | { readonly kind: 'all' }
  | { readonly kind: 'properties'; readonly properties: readonly PropertyName[] };

export interface ResourceRelationLoadTarget {
  readonly path: readonly RelationName[];
  readonly selection: ResourceRelationLoadSelection;
}

export type ResourceRelationLoadTargetResolution =
  | { readonly kind: 'resolved'; readonly target: ResourceRelationLoadTarget }
  | { readonly kind: 'invalid'; readonly reason: 'empty_path' | 'empty_selection' };

export interface ResourceRelationLoadTargetResolutionVisitor<R> {
  readonly resolved: (value: Extract<ResourceRelationLoadTargetResolution, { readonly kind: 'resolved' }>) => R;
  readonly invalid: (value: Extract<ResourceRelationLoadTargetResolution, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceRelationLoadTargetResolution<R>(value: ResourceRelationLoadTargetResolution, visitor: ResourceRelationLoadTargetResolutionVisitor<R>): R {
  return value.kind === 'resolved' ? visitor.resolved(value) : visitor.invalid(value);
}

export type ResourceRelationLoadBatchResolution =
  | { readonly kind: 'resolved'; readonly targets: readonly ResourceRelationLoadTarget[] }
  | { readonly kind: 'invalid'; readonly reason: 'invalid_target' };

export interface ResourceRelationLoadBatchResolutionVisitor<R> {
  readonly resolved: (value: Extract<ResourceRelationLoadBatchResolution, { readonly kind: 'resolved' }>) => R;
  readonly invalid: (value: Extract<ResourceRelationLoadBatchResolution, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceRelationLoadBatchResolution<R>(
  value: ResourceRelationLoadBatchResolution,
  visitor: ResourceRelationLoadBatchResolutionVisitor<R>,
): R {
  return value.kind === 'resolved' ? visitor.resolved(value) : visitor.invalid(value);
}

export type ResourceRelationLoadArguments =
  | { readonly kind: 'targets'; readonly targets: readonly ResourceRelationLoadTarget[] }
  | { readonly kind: 'invalid'; readonly reason: 'missing_target' | 'empty_target_list' | 'invalid_target' };

export type ResourceRelationLoadSelectionParts =
  | { readonly kind: 'properties'; readonly properties: readonly PropertyName[] }
  | { readonly kind: 'invalid'; readonly reason: 'empty_selection' };

export type ResourceRelationLoadTargetParts =
  | { readonly kind: 'path_only'; readonly path: readonly RelationName[] }
  | { readonly kind: 'path_with_selection'; readonly path: readonly RelationName[]; readonly selection: ResourceRelationLoadSelectionParts }
  | { readonly kind: 'invalid'; readonly reason: 'empty_path' };

export function matchResourceRelationLoadTargetParts<R>(
  parts: ResourceRelationLoadTargetParts,
  visitor: {
    readonly path_only: (value: Extract<ResourceRelationLoadTargetParts, { readonly kind: 'path_only' }>) => R;
    readonly path_with_selection: (value: Extract<ResourceRelationLoadTargetParts, { readonly kind: 'path_with_selection' }>) => R;
    readonly invalid: (value: Extract<ResourceRelationLoadTargetParts, { readonly kind: 'invalid' }>) => R;
  },
): R {
  switch (parts.kind) {
    case 'path_only': return visitor.path_only(parts);
    case 'path_with_selection': return visitor.path_with_selection(parts);
    case 'invalid': return visitor.invalid(parts);
  }
}

export function matchResourceRelationLoadSelectionParts<R>(
  selection: ResourceRelationLoadSelectionParts,
  visitor: {
    readonly properties: (value: Extract<ResourceRelationLoadSelectionParts, { readonly kind: 'properties' }>) => R;
    readonly invalid: (value: Extract<ResourceRelationLoadSelectionParts, { readonly kind: 'invalid' }>) => R;
  },
): R {
  return selection.kind === 'properties' ? visitor.properties(selection) : visitor.invalid(selection);
}

function relationLoadSelectionParts(raw: string): ResourceRelationLoadSelectionParts {
  const properties = raw.split(',').filter(Boolean).map(SemanticValueFactory.propertyName);
  if (properties.length === 0) return { kind: 'invalid', reason: 'empty_selection' };
  return { kind: 'properties', properties: Object.freeze(properties) };
}

function relationLoadPath(raw: string): readonly RelationName[] {
  return Object.freeze(raw.split('.').filter(Boolean).map(SemanticValueFactory.relationName));
}

export function parseResourceRelationLoadTargetParts(raw: string): ResourceRelationLoadTargetParts {
  const parts = raw.split(':', 2);
  const path = relationLoadPath(parts[0]);
  if (path.length === 0) return { kind: 'invalid', reason: 'empty_path' };
  if (parts.length === 1) return { kind: 'path_only', path };
  return { kind: 'path_with_selection', path, selection: relationLoadSelectionParts(parts[1]) };
}

export function parseResourceRelationLoadTarget(raw: string): ResourceRelationLoadTargetResolution {
  return matchResourceRelationLoadTargetParts<ResourceRelationLoadTargetResolution>(parseResourceRelationLoadTargetParts(raw), {
    path_only: value => ({
      kind: 'resolved',
      target: Object.freeze({
        path: value.path,
        selection: { kind: 'all' as const },
      }),
    }),
    path_with_selection: value => matchResourceRelationLoadSelectionParts<ResourceRelationLoadTargetResolution>(value.selection, {
      properties: selection => ({
        kind: 'resolved',
        target: Object.freeze({
          path: value.path,
          selection: { kind: 'properties' as const, properties: selection.properties },
        }),
      }),
      invalid: reason => ({ kind: 'invalid', reason: reason.reason }),
    }),
    invalid: value => ({ kind: 'invalid', reason: value.reason }),
  });
}

export type ResourceQueryProjection =
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'raw'; readonly expression: ResourceExpressionModel };

export type ResourceQueryOrderingTarget =
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'raw'; readonly expression: ResourceExpressionModel };

export type ResourceQueryOrderingTargetResolution =
  | { readonly kind: 'resolved'; readonly target: ResourceQueryOrderingTarget }
  | { readonly kind: 'invalid'; readonly reason: 'missing_target' | 'unsupported_target' };

export interface ResourceQueryProjectionVisitor<R> {
  readonly property: (projection: Extract<ResourceQueryProjection, { readonly kind: 'property' }>) => R;
  readonly raw: (projection: Extract<ResourceQueryProjection, { readonly kind: 'raw' }>) => R;
}

export function matchResourceQueryProjection<R>(projection: ResourceQueryProjection, visitor: ResourceQueryProjectionVisitor<R>): R {
  switch (projection.kind) {
    case 'property': return visitor.property(projection);
    case 'raw': return visitor.raw(projection);
  }
}

export interface ResourceQueryOrderingTargetResolutionVisitor<R> {
  readonly resolved: (resolution: Extract<ResourceQueryOrderingTargetResolution, { readonly kind: 'resolved' }>) => R;
  readonly invalid: (resolution: Extract<ResourceQueryOrderingTargetResolution, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceQueryOrderingTargetResolution<R>(
  resolution: ResourceQueryOrderingTargetResolution,
  visitor: ResourceQueryOrderingTargetResolutionVisitor<R>,
): R {
  switch (resolution.kind) {
    case 'resolved': return visitor.resolved(resolution);
    case 'invalid': return visitor.invalid(resolution);
  }
}

export type ResourceFilterOperationError =
  | { readonly kind: 'missing_property' }
  | { readonly kind: 'invalid_property_value' }
  | { readonly kind: 'invalid_operator_value' }
  | { readonly kind: 'unsupported_operator' }
  | { readonly kind: 'missing_operand' }
  | { readonly kind: 'unsupported_arity' };

export type ResourceRelationFilterOperationError =
  | { readonly kind: 'missing_target' }
  | { readonly kind: 'empty_target_list' }
  | { readonly kind: 'invalid_target' }
  | { readonly kind: 'missing_callback' };

export type ResourceRelationLoadOperationError =
  | { readonly kind: 'missing_target' }
  | { readonly kind: 'empty_target_list' }
  | { readonly kind: 'invalid_target' };

export type ResourceOrderingOperationError =
  | { readonly kind: 'missing_target' }
  | { readonly kind: 'unsupported_target' };

export type ResourceWindowOperationError =
  | { readonly kind: 'missing_value' };

export type ResourceGroupingOperationError =
  | { readonly kind: 'invalid_property' };

export type ResourceConditionalOperationError =
  | { readonly kind: 'missing_condition' }
  | { readonly kind: 'missing_callback' };

export type ResourceProjectionOperationError =
  | { readonly kind: 'empty_projection_list' }
  | { readonly kind: 'unsupported_primary_projection' };

export type ResourceQueryOperationError =
  | { readonly kind: 'filter'; readonly error: ResourceFilterOperationError }
  | { readonly kind: 'relation_filter'; readonly error: ResourceRelationFilterOperationError }
  | { readonly kind: 'relation_load'; readonly error: ResourceRelationLoadOperationError }
  | { readonly kind: 'ordering'; readonly error: ResourceOrderingOperationError }
  | { readonly kind: 'window'; readonly error: ResourceWindowOperationError }
  | { readonly kind: 'grouping'; readonly error: ResourceGroupingOperationError }
  | { readonly kind: 'having'; readonly error: ResourceFilterOperationError }
  | { readonly kind: 'conditional'; readonly error: ResourceConditionalOperationError }
  | { readonly kind: 'projection'; readonly error: ResourceProjectionOperationError };

export interface ResourceQueryOperationErrorVisitor<R> {
  readonly filter: (error: Extract<ResourceQueryOperationError, { readonly kind: 'filter' }>) => R;
  readonly relation_filter: (error: Extract<ResourceQueryOperationError, { readonly kind: 'relation_filter' }>) => R;
  readonly relation_load: (error: Extract<ResourceQueryOperationError, { readonly kind: 'relation_load' }>) => R;
  readonly ordering: (error: Extract<ResourceQueryOperationError, { readonly kind: 'ordering' }>) => R;
  readonly window: (error: Extract<ResourceQueryOperationError, { readonly kind: 'window' }>) => R;
  readonly grouping: (error: Extract<ResourceQueryOperationError, { readonly kind: 'grouping' }>) => R;
  readonly having: (error: Extract<ResourceQueryOperationError, { readonly kind: 'having' }>) => R;
  readonly conditional: (error: Extract<ResourceQueryOperationError, { readonly kind: 'conditional' }>) => R;
  readonly projection: (error: Extract<ResourceQueryOperationError, { readonly kind: 'projection' }>) => R;
}

export function matchResourceQueryOperationError<R>(
  error: ResourceQueryOperationError,
  visitor: ResourceQueryOperationErrorVisitor<R>,
): R {
  switch (error.kind) {
    case 'filter': return visitor.filter(error);
    case 'relation_filter': return visitor.relation_filter(error);
    case 'relation_load': return visitor.relation_load(error);
    case 'ordering': return visitor.ordering(error);
    case 'window': return visitor.window(error);
    case 'grouping': return visitor.grouping(error);
    case 'having': return visitor.having(error);
    case 'conditional': return visitor.conditional(error);
    case 'projection': return visitor.projection(error);
  }
}

export type ResourcePaginationSize =
  | { readonly kind: 'framework_default' }
  | { readonly kind: 'explicit'; readonly value: ResourceExpressionModel };

export type ResourcePaginationArguments = ResourcePaginationSize;

export type ResourceWindowArguments =
  | { readonly kind: 'value'; readonly value: ResourceExpressionModel }
  | { readonly kind: 'invalid'; readonly reason: 'missing_value' };

export interface ResourceWindowArgumentsVisitor<R> {
  readonly value: (value: Extract<ResourceWindowArguments, { readonly kind: 'value' }>) => R;
  readonly invalid: (value: Extract<ResourceWindowArguments, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceWindowArguments<R>(value: ResourceWindowArguments, visitor: ResourceWindowArgumentsVisitor<R>): R {
  return value.kind === 'value' ? visitor.value(value) : visitor.invalid(value);
}

export type ResourceGroupingPropertyBatchResolution =
  | { readonly kind: 'resolved'; readonly properties: readonly PropertyName[] }
  | { readonly kind: 'invalid'; readonly reason: 'invalid_property' };

export interface ResourceGroupingPropertyBatchResolutionVisitor<R> {
  readonly resolved: (value: Extract<ResourceGroupingPropertyBatchResolution, { readonly kind: 'resolved' }>) => R;
  readonly invalid: (value: Extract<ResourceGroupingPropertyBatchResolution, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceGroupingPropertyBatchResolution<R>(value: ResourceGroupingPropertyBatchResolution, visitor: ResourceGroupingPropertyBatchResolutionVisitor<R>): R {
  return value.kind === 'resolved' ? visitor.resolved(value) : visitor.invalid(value);
}

export type ResourceGroupingArguments =
  | { readonly kind: 'properties'; readonly properties: readonly PropertyName[] }
  | { readonly kind: 'invalid'; readonly reason: 'invalid_property' };

export interface ResourceGroupingArgumentsVisitor<R> {
  readonly properties: (value: Extract<ResourceGroupingArguments, { readonly kind: 'properties' }>) => R;
  readonly invalid: (value: Extract<ResourceGroupingArguments, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceGroupingArguments<R>(value: ResourceGroupingArguments, visitor: ResourceGroupingArgumentsVisitor<R>): R {
  return value.kind === 'properties' ? visitor.properties(value) : visitor.invalid(value);
}

export type ResourceConditionalArguments =
  | { readonly kind: 'condition_callback'; readonly condition: ResourceExpressionModel; readonly callback: ResourceExpressionModel }
  | { readonly kind: 'invalid'; readonly reason: 'missing_condition' | 'missing_callback' };

export interface ResourceConditionalArgumentsVisitor<R> {
  readonly condition_callback: (value: Extract<ResourceConditionalArguments, { readonly kind: 'condition_callback' }>) => R;
  readonly invalid: (value: Extract<ResourceConditionalArguments, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceConditionalArguments<R>(value: ResourceConditionalArguments, visitor: ResourceConditionalArgumentsVisitor<R>): R {
  return value.kind === 'condition_callback' ? visitor.condition_callback(value) : visitor.invalid(value);
}

export type ResourceQueryOperationInput =
  | { readonly kind: 'filter'; readonly arguments: ResourceQueryFilterArgumentsResolution }
  | { readonly kind: 'relation_filter'; readonly arguments: ResourceRelationFilterArgumentsResolution }
  | { readonly kind: 'relation_load'; readonly arguments: ResourceRelationLoadArguments }
  | { readonly kind: 'ordering'; readonly arguments: ResourceOrderingArguments }
  | { readonly kind: 'projection'; readonly arguments: ResourceProjectionArguments }
  | { readonly kind: 'pagination'; readonly arguments: ResourcePaginationArguments }
  | { readonly kind: 'window'; readonly arguments: ResourceWindowOperationArguments }
  | { readonly kind: 'grouping'; readonly arguments: ResourceGroupingArguments }
  | { readonly kind: 'having'; readonly arguments: ResourceQueryFilterArgumentsResolution }
  | { readonly kind: 'locking'; readonly arguments: ResourceLockingArguments }
  | { readonly kind: 'distinct'; readonly arguments: ResourceDistinctArguments }
  | { readonly kind: 'conditional'; readonly arguments: ResourceConditionalOperationArguments };

export interface ResourceQueryOperationInputVisitor<R> {
  readonly filter: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'filter' }>) => R;
  readonly relation_filter: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'relation_filter' }>) => R;
  readonly relation_load: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'relation_load' }>) => R;
  readonly ordering: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'ordering' }>) => R;
  readonly projection: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'projection' }>) => R;
  readonly pagination: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'pagination' }>) => R;
  readonly window: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'window' }>) => R;
  readonly grouping: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'grouping' }>) => R;
  readonly having: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'having' }>) => R;
  readonly locking: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'locking' }>) => R;
  readonly distinct: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'distinct' }>) => R;
  readonly conditional: (input: Extract<ResourceQueryOperationInput, { readonly kind: 'conditional' }>) => R;
}

export function matchResourceQueryOperationInput<R>(input: ResourceQueryOperationInput, visitor: ResourceQueryOperationInputVisitor<R>): R {
  switch (input.kind) {
    case 'filter': return visitor.filter(input);
    case 'relation_filter': return visitor.relation_filter(input);
    case 'relation_load': return visitor.relation_load(input);
    case 'ordering': return visitor.ordering(input);
    case 'projection': return visitor.projection(input);
    case 'pagination': return visitor.pagination(input);
    case 'window': return visitor.window(input);
    case 'grouping': return visitor.grouping(input);
    case 'having': return visitor.having(input);
    case 'locking': return visitor.locking(input);
    case 'distinct': return visitor.distinct(input);
    case 'conditional': return visitor.conditional(input);
  }
}

export interface ResourceRelationFilterArguments {
  readonly targets: readonly ResourceRelationLoadTarget[];
  readonly callback: ResourceExpressionModel;
}
export type ResourceRelationFilterArgumentsResolution =
  | { readonly kind: 'valid'; readonly arguments: ResourceRelationFilterArguments }
  | { readonly kind: 'invalid'; readonly reason: 'missing_target' | 'empty_target_list' | 'invalid_target' | 'missing_callback' };

export interface ResourceRelationFilterArgumentsResolutionVisitor<R> {
  readonly valid: (resolution: Extract<ResourceRelationFilterArgumentsResolution, { readonly kind: 'valid' }>) => R;
  readonly invalid: (resolution: Extract<ResourceRelationFilterArgumentsResolution, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceRelationFilterArgumentsResolution<R>(
  resolution: ResourceRelationFilterArgumentsResolution,
  visitor: ResourceRelationFilterArgumentsResolutionVisitor<R>,
): R {
  return resolution.kind === 'valid' ? visitor.valid(resolution) : visitor.invalid(resolution);
}

export type ResourceOrderingArguments =
  | { readonly kind: 'valid'; readonly target: ResourceQueryOrderingTarget; readonly direction: 'ascending' | 'descending' }
  | { readonly kind: 'invalid'; readonly reason: 'missing_target' | 'unsupported_target' };
export type ResourceProjectionArguments =
  | { readonly kind: 'resolved'; readonly projections: readonly ResourceQueryProjection[]; readonly primary: Extract<ResourceQueryProjection, { readonly kind: 'property' }> }
  | { readonly kind: 'invalid'; readonly reason: 'empty_projection_list' | 'unsupported_primary_projection' };

export interface ResourceProjectionArgumentsVisitor<R> {
  readonly resolved: (value: Extract<ResourceProjectionArguments, { readonly kind: 'resolved' }>) => R;
  readonly invalid: (value: Extract<ResourceProjectionArguments, { readonly kind: 'invalid' }>) => R;
}

export function matchResourceProjectionArguments<R>(value: ResourceProjectionArguments, visitor: ResourceProjectionArgumentsVisitor<R>): R {
  return value.kind === 'resolved' ? visitor.resolved(value) : visitor.invalid(value);
}
export interface ResourceLockingArguments { readonly mode: 'for_update' | 'shared' }
export interface ResourceDistinctArguments {}
export interface ResourceWindowOperationArguments { readonly operation: 'limit' | 'offset' | 'take' | 'skip'; readonly value: ResourceWindowArguments }
export interface ResourceConditionalOperationArguments { readonly branch: 'when' | 'unless'; readonly value: ResourceConditionalArguments }

export interface ResourceQueryOperationArguments {
  readonly pagination: ResourcePaginationArguments;
  readonly window: ResourceWindowArguments;
  readonly grouping: ResourceGroupingArguments;
  readonly conditional: ResourceConditionalArguments;
}


export type ResourceResolvedQueryOperation =
  | { readonly kind: 'none' }
  | { readonly kind: 'filter'; readonly method: MethodName; readonly predicate: ResourceQueryPredicate }
  | { readonly kind: 'relation_load'; readonly method: MethodName; readonly targets: readonly ResourceRelationLoadTarget[] }
  | { readonly kind: 'relation_filter'; readonly method: MethodName; readonly targets: readonly ResourceRelationLoadTarget[]; readonly callback: ResourceExpressionModel }
  | { readonly kind: 'ordering'; readonly method: MethodName; readonly target: ResourceQueryOrderingTarget; readonly direction: 'ascending' | 'descending' }
  | { readonly kind: 'projection'; readonly method: MethodName; readonly projections: readonly ResourceQueryProjection[]; readonly primary: Extract<ResourceQueryProjection, { readonly kind: 'property' }> }
  | { readonly kind: 'pagination'; readonly method: MethodName; readonly pageSize: ResourcePaginationSize }
  | { readonly kind: 'window'; readonly method: MethodName; readonly operation: 'limit' | 'offset' | 'take' | 'skip'; readonly value: ResourceExpressionModel }
  | { readonly kind: 'grouping'; readonly method: MethodName; readonly properties: readonly PropertyName[] }
  | { readonly kind: 'having'; readonly method: MethodName; readonly predicate: ResourceQueryPredicate }
  | { readonly kind: 'locking'; readonly method: MethodName; readonly mode: 'for_update' | 'shared' }
  | { readonly kind: 'distinct'; readonly method: MethodName }
  | { readonly kind: 'conditional'; readonly method: MethodName; readonly branch: 'when' | 'unless'; readonly condition: ResourceExpressionModel; readonly callback: ResourceExpressionModel }
  | { readonly kind: 'invalid'; readonly method: MethodName; readonly error: ResourceQueryOperationError };
