import type { ActionName, MiddlewareName } from './names';
import type { Presence } from './presence';
import type { StringValue } from './valueObjects';

export interface RouteMiddlewareReference {
  readonly name: MiddlewareName;
  /** Laravel middleware arguments after the `:` separator, in declaration order. */
  readonly parameters: readonly StringValue[];
}

/**
 * Canonical identity for a named route middleware. Parameters configure a
 * middleware invocation but do not change the middleware identity used by
 * Laravel exclusions. Keeping this identity explicit prevents the resolver
 * from comparing raw host strings and leaves room for class/unresolved
 * identities without changing the route contract.
 */
export type RouteMiddlewareIdentity = {
  readonly kind: 'named';
  readonly name: MiddlewareName;
};

export const routeMiddlewareIdentity = (reference: RouteMiddlewareReference): RouteMiddlewareIdentity =>
  Object.freeze({ kind: 'named' as const, name: reference.name });

export type RouteMiddlewareSource =
  | { readonly kind: 'route_group' }
  | { readonly kind: 'route' }
  | { readonly kind: 'controller_class' }
  | { readonly kind: 'controller_method' }
  | { readonly kind: 'resource' };

export type RouteMiddlewareScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'only'; readonly actions: readonly ActionName[] }
  | { readonly kind: 'except'; readonly actions: readonly ActionName[] };

export interface RouteMiddlewareContract {
  readonly middleware: RouteMiddlewareReference;
  readonly source: RouteMiddlewareSource;
  /** Laravel controller middleware applicability; route/group middleware is `all`. */
  readonly scope: RouteMiddlewareScope;
}

export interface RouteMiddlewareExclusionContract {
  readonly middleware: RouteMiddlewareReference;
  readonly source: RouteMiddlewareSource;
  readonly scope: RouteMiddlewareScope;
}

/**
 * AST-free input to the route middleware semantic resolver.
 *
 * Declarations and exclusions are already canonical semantic facts. `action`
 * is explicit presence because scoped controller middleware cannot be resolved
 * against an absent concrete action without inventing applicability.
 */
export interface RouteMiddlewareSemanticInput {
  readonly declarations: readonly RouteMiddlewareContract[];
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  readonly action: Presence<ActionName>;
}

export interface RouteMiddlewareFlow {
  readonly kind: 'route_middleware_flow';
  /** Declared middleware facts, not execution order. */
  readonly middleware: readonly RouteMiddlewareContract[];
  /** Semantic exclusions produced by upstream route/controller analysis. */
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  /** Middleware already filtered for the concrete route action. Not execution order. */
  readonly effectiveMiddleware: readonly RouteMiddlewareContract[];
}
