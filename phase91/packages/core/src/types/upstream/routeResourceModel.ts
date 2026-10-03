import type { ActionName, ResourceName, RouteName, RouteParameterName } from './names';
import type {
  ResourceRegistrationMode,
  ResourceNesting,
  ResourceNestingBehavior,
  ResourceBindingBehavior,
  SingletonCreationBehavior,
  SingletonDestructionBehavior,
  ResourceMiddlewareContract,
  ResourceMiddlewareExclusionContract,
} from './routeResourceMode';

export type ResourceCapability =
  | { readonly kind: 'action'; readonly action: ActionName }
  | { readonly kind: 'creatable_singleton' }
  | { readonly kind: 'destroyable_singleton' };

export interface ResourceActionProfile {
  readonly actions: readonly ActionName[];
  readonly capabilities: readonly ResourceCapability[];
  readonly withTrashedDefaults: readonly ActionName[];
}

export interface ResourceActionSelectionModel {
  readonly all: readonly ActionName[];
  readonly only: (available: readonly ActionName[], requested: readonly ActionName[]) => readonly ActionName[];
  readonly except: (available: readonly ActionName[], requested: readonly ActionName[]) => readonly ActionName[];
}

export interface ResourceRouteNameModel {
  readonly action: ActionName;
  readonly name: RouteName;
}

export interface ResourceRouteParameterModel {
  readonly resource: ResourceName;
  readonly parameter: RouteParameterName;
}

export interface ResourceSemanticModel {
  readonly mode: ResourceRegistrationMode;
  readonly profile: ResourceActionProfile;
  readonly nesting: ResourceNesting;
  readonly nestingBehavior: ResourceNestingBehavior;
  readonly binding: ResourceBindingBehavior;
  readonly creation: SingletonCreationBehavior;
  readonly destruction: SingletonDestructionBehavior;
  readonly actions: readonly ActionName[];
  readonly selection: ResourceActionSelectionModel;
  readonly routeNames: readonly ResourceRouteNameModel[];
  readonly parameters: readonly ResourceRouteParameterModel[];
  readonly middleware: readonly ResourceMiddlewareContract[];
  readonly middlewareExclusions: readonly ResourceMiddlewareExclusionContract[];
}
