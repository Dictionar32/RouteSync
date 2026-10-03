import type { ActionName, MiddlewareName } from './names';
import type { StringValue } from './valueObjects';

export interface RouteMiddlewareReference {
  readonly name: MiddlewareName;
  /** Laravel middleware arguments after the `:` separator, in declaration order. */
  readonly parameters: readonly StringValue[];
}

export type RouteMiddlewareSource =
  | { readonly kind: 'route_group' }
  | { readonly kind: 'route' }
  | { readonly kind: 'controller_class' }
  | { readonly kind: 'controller_method' };

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

export interface RouteMiddlewareFlow {
  readonly kind: 'route_middleware_flow';
  /** Declared middleware facts, not execution order. */
  readonly middleware: readonly RouteMiddlewareContract[];
  /** Semantic exclusions produced by upstream route/controller analysis. */
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  /** Middleware already filtered for the concrete route action. Not execution order. */
  readonly effectiveMiddleware: readonly RouteMiddlewareContract[];
}
