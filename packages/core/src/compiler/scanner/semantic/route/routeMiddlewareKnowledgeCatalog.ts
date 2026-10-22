import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import type { RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import type { LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface, LaravelRouteAuthorizationSemanticJudgment } from '../../../../types/upstream/routeAuthorizationSemanticJudgmentInterface';
import type { Presence } from '../../../../types/upstream/presence';

export const middlewareScopeApplicability = (
  scope: RouteMiddlewareScope,
  action: Presence<ActionName>,
): boolean => {
  switch (scope.kind) {
    case 'blocked': return false;
    case 'all': return true;
    case 'only': return action.kind === 'present' && scope.actions.some(item => item.value.value === action.value.value.value);
    case 'except': return action.kind === 'present' && !scope.actions.some(item => item.value.value === action.value.value.value);
    case 'only_except': return action.kind === 'present'
      && scope.only.some(item => item.value.value === action.value.value.value)
      && !scope.except.some(item => item.value.value === action.value.value.value);
  }
};

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
