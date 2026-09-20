import type { Expression } from './expression';
import type { PropertyName, RelationName } from './names';
import type { RelationPaths } from './collections';
export type ResourceOperation =
  | { readonly kind: 'when_loaded'; readonly relation: RelationName; readonly callback: Expression }
  | { readonly kind: 'when_not_null'; readonly property: PropertyName; readonly callback: Expression }
  | { readonly kind: 'merge_when'; readonly condition: Expression; readonly value: Expression }
  | { readonly kind: 'merge'; readonly value: Expression }
  | { readonly kind: 'additional'; readonly value: Expression }
  | { readonly kind: 'with'; readonly relations: RelationPaths };

export type ResourceOperationKind = ResourceOperation['kind'];

const RESOURCE_OPERATION_KINDS: ReadonlyArray<readonly [string, ResourceOperationKind]> = [
  ['whenLoaded', 'when_loaded'],
  ['whenNotNull', 'when_not_null'],
  ['mergeWhen', 'merge_when'],
  ['merge', 'merge'],
  ['additional', 'additional'],
  ['with', 'with'],
];

export const resourceOperationKindForMethod = (name: string): ResourceOperationKind | 'ordinary' =>
  RESOURCE_OPERATION_KINDS.find(([method]) => method === name)?.[1] ?? 'ordinary';

export interface ResourceOperationKindVisitor<R> {
  readonly when_loaded: () => R;
  readonly when_not_null: () => R;
  readonly merge_when: () => R;
  readonly merge: () => R;
  readonly additional: () => R;
  readonly with: () => R;
  readonly ordinary: () => R;
}

export const matchResourceOperationKind = <R>(kind: ResourceOperationKind | 'ordinary', visitor: ResourceOperationKindVisitor<R>): R => {
  switch (kind) {
    case 'when_loaded': return visitor.when_loaded();
    case 'when_not_null': return visitor.when_not_null();
    case 'merge_when': return visitor.merge_when();
    case 'merge': return visitor.merge();
    case 'additional': return visitor.additional();
    case 'with': return visitor.with();
    case 'ordinary': return visitor.ordinary();
  }
};
