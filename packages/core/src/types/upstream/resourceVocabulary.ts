import type { Expression } from './expression';
import type { ColumnName, PropertyName, RelationName, TableName } from './names';
import type { RelationPaths, ResourceFields } from './collections';

export type ResourceOperationValue =
  | { readonly kind: 'implicit_resource_value' }
  | { readonly kind: 'expression'; readonly expression: Expression };

export type ResourceOperationDefault =
  | { readonly kind: 'missing_value' }
  | { readonly kind: 'expression'; readonly expression: Expression };

export type ResourceAggregateFunction =
  | { readonly kind: 'avg' }
  | { readonly kind: 'sum' }
  | { readonly kind: 'min' }
  | { readonly kind: 'max' };

export type ResourceOperation =
  | { readonly kind: 'when'; readonly condition: Expression; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'unless'; readonly condition: Expression; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'merge_when'; readonly condition: Expression; readonly value: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'merge_unless'; readonly condition: Expression; readonly value: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'merge'; readonly value: Expression }
  | { readonly kind: 'transform'; readonly value: Expression; readonly callback: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'attributes'; readonly fields: ResourceFields }
  | { readonly kind: 'when_has'; readonly attribute: PropertyName; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_null'; readonly value: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_not_null'; readonly value: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_appended'; readonly attribute: PropertyName; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_loaded'; readonly relation: RelationName; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_counted'; readonly relation: RelationName; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_aggregated'; readonly relation: RelationName; readonly column: ColumnName; readonly aggregate: ResourceAggregateFunction; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_exists_loaded'; readonly relation: RelationName; readonly value: ResourceOperationValue; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_pivot_loaded'; readonly table: TableName; readonly value: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'when_pivot_loaded_as'; readonly accessor: PropertyName; readonly table: TableName; readonly value: Expression; readonly default: ResourceOperationDefault }
  | { readonly kind: 'additional'; readonly value: Expression }
  | { readonly kind: 'with'; readonly relations: RelationPaths };

export type ResourceOperationKind = ResourceOperation['kind'];

const RESOURCE_OPERATION_KINDS: ReadonlyArray<readonly [string, ResourceOperationKind]> = [
  ['when', 'when'],
  ['unless', 'unless'],
  ['mergeWhen', 'merge_when'],
  ['mergeUnless', 'merge_unless'],
  ['merge', 'merge'],
  ['transform', 'transform'],
  ['attributes', 'attributes'],
  ['whenHas', 'when_has'],
  ['whenNull', 'when_null'],
  ['whenNotNull', 'when_not_null'],
  ['whenAppended', 'when_appended'],
  ['whenLoaded', 'when_loaded'],
  ['whenCounted', 'when_counted'],
  ['whenAggregated', 'when_aggregated'],
  ['whenExistsLoaded', 'when_exists_loaded'],
  ['whenPivotLoaded', 'when_pivot_loaded'],
  ['whenPivotLoadedAs', 'when_pivot_loaded_as'],
  ['additional', 'additional'],
  ['with', 'with'],
];

export const resourceOperationKindForMethod = (name: string): ResourceOperationKind | 'ordinary' =>
  RESOURCE_OPERATION_KINDS.find(([method]) => method === name)?.[1] ?? 'ordinary';

export interface ResourceOperationKindVisitor<R> {
  readonly when: () => R;
  readonly unless: () => R;
  readonly merge_when: () => R;
  readonly merge_unless: () => R;
  readonly merge: () => R;
  readonly transform: () => R;
  readonly attributes: () => R;
  readonly when_has: () => R;
  readonly when_null: () => R;
  readonly when_not_null: () => R;
  readonly when_appended: () => R;
  readonly when_loaded: () => R;
  readonly when_counted: () => R;
  readonly when_aggregated: () => R;
  readonly when_exists_loaded: () => R;
  readonly when_pivot_loaded: () => R;
  readonly when_pivot_loaded_as: () => R;
  readonly additional: () => R;
  readonly with: () => R;
  readonly ordinary: () => R;
}

export const matchResourceOperationKind = <R>(kind: ResourceOperationKind | 'ordinary', visitor: ResourceOperationKindVisitor<R>): R => {
  switch (kind) {
    case 'when': return visitor.when();
    case 'unless': return visitor.unless();
    case 'merge_when': return visitor.merge_when();
    case 'merge_unless': return visitor.merge_unless();
    case 'merge': return visitor.merge();
    case 'transform': return visitor.transform();
    case 'attributes': return visitor.attributes();
    case 'when_has': return visitor.when_has();
    case 'when_null': return visitor.when_null();
    case 'when_not_null': return visitor.when_not_null();
    case 'when_appended': return visitor.when_appended();
    case 'when_loaded': return visitor.when_loaded();
    case 'when_counted': return visitor.when_counted();
    case 'when_aggregated': return visitor.when_aggregated();
    case 'when_exists_loaded': return visitor.when_exists_loaded();
    case 'when_pivot_loaded': return visitor.when_pivot_loaded();
    case 'when_pivot_loaded_as': return visitor.when_pivot_loaded_as();
    case 'additional': return visitor.additional();
    case 'with': return visitor.with();
    case 'ordinary': return visitor.ordinary();
  }
};
