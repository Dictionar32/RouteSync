import type { ActionName, ControllerName, ResourceName, RouteName, RouteParameterName } from './names';
import type { ResourceRegistrationContract, ResourceMiddlewareContract, ResourceMiddlewareExclusionContract } from './routeResourceMode';

export type ResourceRouteAction =
  | 'index' | 'create' | 'store' | 'show' | 'edit' | 'update' | 'destroy';

export type ResourceActionSelection =
  | { readonly kind: 'all' }
  | { readonly kind: 'only'; readonly actions: readonly ActionName[] }
  | { readonly kind: 'except'; readonly actions: readonly ActionName[] };

export interface ResourceRouteNameOverride {
  readonly action: ActionName;
  readonly name: RouteName;
}

export interface ResourceRouteParameterOverride {
  readonly resource: ResourceName;
  readonly parameter: RouteParameterName;
}

export type ResourceWithTrashed =
  | { readonly kind: 'none' }
  | { readonly kind: 'default_actions'; readonly actions: readonly ActionName[] }
  | { readonly kind: 'selected_actions'; readonly actions: readonly ActionName[] };

export interface RouteResourceContract {
  readonly kind: 'route_resource_contract';
  readonly resource: ResourceName;
  readonly controller: ControllerName;
  readonly actions: readonly ActionName[];
  readonly selection: ResourceActionSelection;
  readonly routeNames: readonly ResourceRouteNameOverride[];
  readonly parameters: readonly ResourceRouteParameterOverride[];
  readonly withTrashed: ResourceWithTrashed;
  readonly registration: ResourceRegistrationContract;
  readonly middleware: readonly ResourceMiddlewareContract[];
  readonly middlewareExclusions: readonly ResourceMiddlewareExclusionContract[];
}
