import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import type { RouteMiddlewareIdentity, RouteMiddlewareIdentityAuthorityInterface, RouteMiddlewareIdentityComparisonHandlers, RouteMiddlewareIdentityComparisonJudgment, RouteMiddlewareReference, RouteMiddlewareScope, RouteMiddlewareScopeApplicabilityAuthorityInterface, RouteMiddlewareScopeApplicabilityHandlers, RouteMiddlewareScopeApplicabilityJudgment, RouteMiddlewareScopeNotApplicableJudgment } from '../../../../types/upstream/routeMiddleware';
import type { LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface, LaravelRouteAuthorizationSemanticJudgment } from '../../../../types/upstream/routeAuthorizationSemanticJudgmentInterface';
import type { Presence } from '../../../../types/upstream/presence';

const sameMiddlewareIdentityJudgment = (
  identity: RouteMiddlewareIdentity,
): RouteMiddlewareIdentityComparisonJudgment => Object.freeze({
  continueWith: <Result>(handlers: RouteMiddlewareIdentityComparisonHandlers<Result>): Result =>
    handlers.onSameIdentity(identity),
});

const differentMiddlewareIdentityJudgment = (
  left: RouteMiddlewareIdentity,
  right: RouteMiddlewareIdentity,
): RouteMiddlewareIdentityComparisonJudgment => Object.freeze({
  continueWith: <Result>(handlers: RouteMiddlewareIdentityComparisonHandlers<Result>): Result =>
    handlers.onDifferentIdentity(left, right),
});

const identifyMiddlewareImplementation = (
  reference: RouteMiddlewareReference,
): RouteMiddlewareIdentity => Object.freeze({ kind: 'named', name: reference.name });

const compareMiddlewareIdentityImplementation = (
  left: RouteMiddlewareIdentity,
  right: RouteMiddlewareIdentity,
): RouteMiddlewareIdentityComparisonJudgment => {
  switch (Object.is(left.kind, right.kind)) {
    case false:
      return differentMiddlewareIdentityJudgment(left, right);
    case true:
      switch (Object.is(left.name.value.value, right.name.value.value)) {
        case true: return sameMiddlewareIdentityJudgment(left);
        case false: return differentMiddlewareIdentityJudgment(left, right);
      }
  }
};

/** Identity comparison is a domain judgment, not a boolean consumed by the resolver. */
export const routeMiddlewareIdentityAuthority: RouteMiddlewareIdentityAuthorityInterface = Object.freeze({
  kind: 'route_middleware_identity_authority',
  identify: identifyMiddlewareImplementation,
  compare: compareMiddlewareIdentityImplementation,
});

const applicableScopeJudgment = (
  scope: RouteMiddlewareScope,
  action: Presence<ActionName>,
): RouteMiddlewareScopeApplicabilityJudgment => Object.freeze({
  continueWith: <Result>(handlers: RouteMiddlewareScopeApplicabilityHandlers<Result>): Result =>
    handlers.onApplicable(scope, action),
});

const notApplicableScopeJudgment = (
  judgment: RouteMiddlewareScopeNotApplicableJudgment,
): RouteMiddlewareScopeApplicabilityJudgment => Object.freeze({
  continueWith: <Result>(handlers: RouteMiddlewareScopeApplicabilityHandlers<Result>): Result =>
    handlers.onNotApplicable(judgment),
});

const classifyMiddlewareScopeApplicabilityImplementation = (
  scope: RouteMiddlewareScope,
  action: Presence<ActionName>,
): RouteMiddlewareScopeApplicabilityJudgment => {
  switch (scope.kind) {
    case 'blocked':
      return notApplicableScopeJudgment({ kind: 'middleware_scope_blocked' });
    case 'all':
      return applicableScopeJudgment(scope, action);
    case 'only':
    case 'except':
    case 'only_except':
      switch (action.kind) {
        case 'absent':
          return notApplicableScopeJudgment({ kind: 'middleware_scope_action_required' });
        case 'present': {
          const actionName = action.value;
          switch (scope.kind) {
            case 'only':
              return scope.actions.some(item => item.value.value === actionName.value.value)
                ? applicableScopeJudgment(scope, action)
                : notApplicableScopeJudgment({ kind: 'middleware_scope_action_not_included', action: actionName });
            case 'except':
              return scope.actions.some(item => item.value.value === actionName.value.value)
                ? notApplicableScopeJudgment({ kind: 'middleware_scope_action_excluded', action: actionName })
                : applicableScopeJudgment(scope, action);
            case 'only_except':
              return scope.only.some(item => item.value.value === actionName.value.value)
                ? scope.except.some(item => item.value.value === actionName.value.value)
                  ? notApplicableScopeJudgment({ kind: 'middleware_scope_action_excluded', action: actionName })
                  : applicableScopeJudgment(scope, action)
                : notApplicableScopeJudgment({ kind: 'middleware_scope_action_not_included', action: actionName });
            default:
              return notApplicableScopeJudgment({ kind: 'middleware_scope_blocked' });
          }
        }
      }
  }
};

/** Interface-first domain authority; callers must handle applicability as a judgment, not a boolean. */
export const routeMiddlewareScopeApplicabilityAuthority: RouteMiddlewareScopeApplicabilityAuthorityInterface = Object.freeze({
  kind: 'route_middleware_scope_applicability_authority',
  classify: classifyMiddlewareScopeApplicabilityImplementation,
});

/** Laravel's built-in authentication aliases/classes, kept exact to avoid prefix collisions. */
const authenticationMiddlewareNames: readonly string[] = Object.freeze([
  'auth',
  'auth.basic',
  'auth.session',
  'Illuminate\\Auth\\Middleware\\Authenticate',
  'Illuminate\\Auth\\Middleware\\AuthenticateWithBasicAuth',
  'Illuminate\\Session\\Middleware\\AuthenticateSession',
]);

const isAuthenticationMiddleware = (middleware: MiddlewareName): boolean => {
  const name = middleware.value.value;
  return authenticationMiddlewareNames.includes(name) || (name.startsWith('auth:') && name.slice('auth:'.length).trim().length > 0);
};

/** Canonical authority: preserve only exact, known authentication evidence in the existing closed judgment. */
export const routeAuthorizationSemanticJudgmentAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface = Object.freeze({
  kind: 'laravel_route_authorization_semantic_judgment_authority',
  closed: true,
  contractVersion: 1,
  judge: (middlewares: readonly MiddlewareName[]): LaravelRouteAuthorizationSemanticJudgment => {
    const authorization = Object.freeze(middlewares.filter(isAuthenticationMiddleware));
    switch (authorization.length) {
      case 0:
        return Object.freeze({ kind: 'laravel_route_authorization_middleware_absent', middleware: authorization });
      default:
        return Object.freeze({ kind: 'laravel_route_authorization_middleware_present', middleware: authorization });
    }
  },
});
