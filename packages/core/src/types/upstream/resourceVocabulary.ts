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
