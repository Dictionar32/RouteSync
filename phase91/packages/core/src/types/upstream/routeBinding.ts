import type { RouteParameterName, ColumnName } from './names';
import type { Presence } from './presence';

export type RouteBindingKey =
  | { readonly kind: 'default' }
  | { readonly kind: 'custom'; readonly column: ColumnName };

export type RouteBindingWithTrashed =
  | { readonly kind: 'enabled' }
  | { readonly kind: 'disabled' };

export type RouteBindingContract = Readonly<{
  readonly parameter: RouteParameterName;
  /** Semantic parent relation extracted from the route path; never positional. */
  readonly parent: Presence<RouteParameterName>;
  readonly key: RouteBindingKey;
  /** Laravel withTrashed() semantic, resolved upstream from route syntax. */
  readonly withTrashed: RouteBindingWithTrashed;
}>;

export interface RouteBindingContractFlow {
  readonly kind: 'route_binding_contract_flow';
  readonly bindings: readonly RouteBindingContract[];
}
