import type { StringValue } from './valueObjects';
import type { ResourceRegistrationMode } from './routeResourceMode';
import type { ControllerName, ResourceName, RouteParameterName } from './names';
import type { Presence } from './presence';

/** Syntax fact for an action filter; action spelling is preserved without semantic validation. */
export interface RouteResourceActionFilterFact {
  readonly kind: 'only' | 'except';
  readonly actions: readonly StringValue[];
}

export interface RouteResourceNameOverrideFact {
  readonly action: StringValue;
  readonly name: StringValue;
}

export interface RouteResourceNamesFact {
  readonly overrides: readonly RouteResourceNameOverrideFact[];
}

export interface RouteResourceParameterOverrideFact {
  readonly resource: ResourceName;
  readonly parameter: StringValue;
}

export interface RouteResourceParametersFact {
  readonly overrides: readonly RouteResourceParameterOverrideFact[];
}

export type RouteResourceMethodFact = ResourceRegistrationMode;

export interface RouteResourceScopedFact {
  readonly parameter: RouteParameterName;
  readonly key: StringValue;
}

export type RouteResourceMiddlewareScopeFact =
  | { readonly kind: 'all' }
  | { readonly kind: 'only'; readonly actions: readonly StringValue[] }
  | { readonly kind: 'except'; readonly actions: readonly StringValue[] };

export interface RouteResourceMiddlewareFact {
  readonly middleware: readonly StringValue[];
  readonly scope: RouteResourceMiddlewareScopeFact;
}

export interface RouteResourceFact {
  readonly method: RouteResourceMethodFact;
  readonly shallow: { readonly kind: 'absent' } | { readonly kind: 'present' };
  readonly scoped: Presence<readonly RouteResourceScopedFact[]>;
  readonly middleware: readonly RouteResourceMiddlewareFact[];
  readonly middlewareExclusions: readonly RouteResourceMiddlewareFact[];
  readonly creatable: { readonly kind: 'absent' } | { readonly kind: 'present' };
  readonly destroyable: { readonly kind: 'absent' } | { readonly kind: 'present' };
  readonly resource: ResourceName;
  readonly controller: ControllerName;
  readonly withTrashed: Presence<readonly StringValue[]>;
  readonly actionFilter: Presence<RouteResourceActionFilterFact>;
  readonly names: Presence<RouteResourceNamesFact>;
  readonly parameters: Presence<RouteResourceParametersFact>;
}
