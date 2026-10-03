import type { ResourceName, RouteParameterName } from './names';
import type { RouteMiddlewareReference, RouteMiddlewareScope } from './routeMiddleware';
import type { StringValue } from './valueObjects';

export type ResourceRegistrationMode =
  | { readonly kind: 'resource' }
  | { readonly kind: 'api_resource' }
  | { readonly kind: 'singleton' }
  | { readonly kind: 'api_singleton' };

export type ResourceNesting =
  | { readonly kind: 'flat'; readonly segments: readonly ResourceName[] }
  | { readonly kind: 'nested'; readonly segments: readonly ResourceName[]; readonly parent: readonly ResourceName[]; readonly child: ResourceName };

export type ResourceNestingBehavior =
  | { readonly kind: 'standard' }
  | { readonly kind: 'shallow' };

export interface ResourceScopedParameter {
  readonly parameter: RouteParameterName;
  readonly key: StringValue;
}

export interface ResourceMiddlewareContract {
  readonly middleware: readonly RouteMiddlewareReference[];
  readonly scope: RouteMiddlewareScope;
}

export interface ResourceMiddlewareExclusionContract {
  readonly middleware: readonly RouteMiddlewareReference[];
  readonly scope: RouteMiddlewareScope;
}

export type ResourceBindingBehavior =
  | { readonly kind: 'default' }
  | { readonly kind: 'scoped'; readonly parameters: readonly ResourceScopedParameter[] };

export type SingletonCreationBehavior =
  | { readonly kind: 'not_creatable' }
  | { readonly kind: 'creatable' };

export type SingletonDestructionBehavior =
  | { readonly kind: 'not_destroyable' }
  | { readonly kind: 'destroyable' };

export interface ResourceRegistrationContract {
  readonly mode: ResourceRegistrationMode;
  readonly nesting: ResourceNesting;
  readonly nestingBehavior: ResourceNestingBehavior;
  readonly binding: ResourceBindingBehavior;
  readonly creation: SingletonCreationBehavior;
  readonly destruction: SingletonDestructionBehavior;
}
