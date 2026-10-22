/**
 * AST-free Laravel route middleware semantic resolver.
 *
 * Authority boundary:
 * - receives canonical middleware declarations/exclusions only;
 * - evaluates only/except against an explicit concrete action;
 * - applies middleware exclusions by middleware identity;
 * - never claims runtime middleware execution order.
 */
import { routeMiddlewareIdentity, type RouteMiddlewareContract, type RouteMiddlewareExclusionContract, type RouteMiddlewareFlow, type RouteMiddlewareScope, type RouteMiddlewareSemanticInput } from '../../../../types/upstream/routeMiddleware';
import type { ActionName } from '../../../../types/upstream/names';
import type { ControllerPolicyActionScopeBlockReason } from '../../../../types/upstream/controller';
import type { Presence } from '../../../../types/upstream/presence';

const actionValue = (action: Presence<ActionName>): string => {
  switch (action.kind) {
    case 'absent': return '';
    case 'present': return action.value.value.value;
  }
};

const blockedScopeReasons = (scope: RouteMiddlewareScope): readonly ControllerPolicyActionScopeBlockReason[] => {
  switch (scope.kind) {
    case 'blocked': return [scope.reason];
    case 'all':
    case 'only':
    case 'except':
    case 'only_except': return [];
  }
};

const scopeApplies = (scope: RouteMiddlewareScope, action: Presence<ActionName>): boolean => {
  switch (scope.kind) {
    case 'blocked': return false;
    case 'all': return true;
    case 'only': return action.kind === 'present' && scope.actions.some(candidate => Object.is(candidate.value.value, actionValue(action)));
    case 'except': return action.kind === 'present' && !scope.actions.some(candidate => Object.is(candidate.value.value, actionValue(action)));
    case 'only_except': return action.kind === 'present'
      && scope.only.some(candidate => Object.is(candidate.value.value, actionValue(action)))
      && !scope.except.some(candidate => Object.is(candidate.value.value, actionValue(action)));
  }
};

const middlewareIdentityEqual = (
  left: RouteMiddlewareContract | RouteMiddlewareExclusionContract,
  right: RouteMiddlewareContract | RouteMiddlewareExclusionContract,
): boolean => {
  const leftIdentity = routeMiddlewareIdentity(left.middleware);
  const rightIdentity = routeMiddlewareIdentity(right.middleware);
  return Object.is(leftIdentity.kind, rightIdentity.kind)
    && Object.is(leftIdentity.name.value.value, rightIdentity.name.value.value);
};

const exclusionApplies = (
  declaration: RouteMiddlewareContract,
  exclusions: readonly RouteMiddlewareExclusionContract[],
  action: Presence<ActionName>,
): boolean => exclusions.some(exclusion =>
  middlewareIdentityEqual(declaration, exclusion) && scopeApplies(exclusion.scope, action));

/** Resolve declared middleware into the concrete action's effective middleware set. */
export const resolveRouteMiddlewareFlow = (
  input: RouteMiddlewareSemanticInput,
): RouteMiddlewareFlow => {
  const blockedScopes = Object.freeze([
    ...input.declarations.flatMap(declaration => blockedScopeReasons(declaration.scope)),
    ...input.exclusions.flatMap(exclusion => blockedScopeReasons(exclusion.scope)),
  ]);
  const effectiveMiddleware = input.declarations.filter(
    declaration => scopeApplies(declaration.scope, input.action) && !exclusionApplies(declaration, input.exclusions, input.action),
  );
  const judgment = (() => {
    switch (blockedScopes.length) {
      case 0: return Object.freeze({ kind: 'complete' as const });
      default: return Object.freeze({ kind: 'blocked' as const, reasons: blockedScopes });
    }
  })();
  return Object.freeze({
    kind: 'route_middleware_flow' as const,
    judgment,
    middleware: Object.freeze([...input.declarations]),
    exclusions: Object.freeze([...input.exclusions]),
    effectiveMiddleware: Object.freeze(effectiveMiddleware),
  });
};
