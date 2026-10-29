import type { ActionName, MiddlewareName } from './names';
import type { Presence } from './presence';
import type { StringValue } from './valueObjects';
import type { ControllerPolicyActionScopeBlockReason } from './controller';

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

export interface RouteMiddlewareIdentityComparisonHandlers<Result> {
  readonly onSameIdentity: (identity: RouteMiddlewareIdentity) => Result;
  readonly onDifferentIdentity: (left: RouteMiddlewareIdentity, right: RouteMiddlewareIdentity) => Result;
}

export interface RouteMiddlewareIdentityComparisonJudgment {
  readonly continueWith: <Result>(handlers: RouteMiddlewareIdentityComparisonHandlers<Result>) => Result;
}

export interface RouteMiddlewareIdentityAuthorityInterface {
  readonly kind: 'route_middleware_identity_authority';
  readonly identify: (reference: RouteMiddlewareReference) => RouteMiddlewareIdentity;
  readonly compare: (left: RouteMiddlewareIdentity, right: RouteMiddlewareIdentity) => RouteMiddlewareIdentityComparisonJudgment;
}

export type RouteMiddlewareSource =
  | { readonly kind: 'route_group' }
  | { readonly kind: 'route' }
  | { readonly kind: 'controller_class' }
  | { readonly kind: 'controller_method' }
  | { readonly kind: 'resource' };

export type RouteMiddlewareScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'only'; readonly actions: readonly ActionName[] }
  | { readonly kind: 'except'; readonly actions: readonly ActionName[] }
  | { readonly kind: 'only_except'; readonly only: readonly ActionName[]; readonly except: readonly ActionName[] }
  | { readonly kind: 'blocked'; readonly reason: ControllerPolicyActionScopeBlockReason };

/** Closed, actionable judgment for a middleware scope against an explicit action presence. */
export type RouteMiddlewareScopeNotApplicableJudgment =
  | { readonly kind: 'middleware_scope_blocked' }
  | { readonly kind: 'middleware_scope_action_required' }
  | { readonly kind: 'middleware_scope_action_excluded'; readonly action: ActionName }
  | { readonly kind: 'middleware_scope_action_not_included'; readonly action: ActionName };

export interface RouteMiddlewareScopeApplicabilityHandlers<Result> {
  readonly onApplicable: (scope: RouteMiddlewareScope, action: Presence<ActionName>) => Result;
  readonly onNotApplicable: (judgment: RouteMiddlewareScopeNotApplicableJudgment) => Result;
}

export interface RouteMiddlewareScopeApplicabilityJudgment {
  readonly continueWith: <Result>(handlers: RouteMiddlewareScopeApplicabilityHandlers<Result>) => Result;
}

export interface RouteMiddlewareScopeApplicabilityAuthorityInterface {
  readonly kind: 'route_middleware_scope_applicability_authority';
  readonly classify: (scope: RouteMiddlewareScope, action: Presence<ActionName>) => RouteMiddlewareScopeApplicabilityJudgment;
}

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

export type RouteMiddlewareFlowJudgment =
  | Readonly<{ readonly kind: 'complete' }>
  | Readonly<{ readonly kind: 'blocked'; readonly reasons: readonly ControllerPolicyActionScopeBlockReason[] }>;

export interface RouteMiddlewareFlow {
  readonly kind: 'route_middleware_flow';
  readonly judgment: RouteMiddlewareFlowJudgment;
  /** Declared middleware facts, not execution order. */
  readonly middleware: readonly RouteMiddlewareContract[];
  /** Semantic exclusions produced by upstream route/controller analysis. */
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  /** Middleware already filtered for the concrete route action. Not execution order. */
  readonly effectiveMiddleware: readonly RouteMiddlewareContract[];
}
