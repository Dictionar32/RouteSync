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
import { relationAll, relationAny, relationEqual, relationNotEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationGate, relationProject, relationSelect, relationVariantFold } from '../../../../semantic/foundation/relationalSequence';
import { presenceFold, type Presence } from '../../../../types/upstream/presence';

const actionValue = (action: Presence<ActionName>): string =>
  presenceFold(action, () => '', value => value.value.value);

const scopeApplies = (scope: RouteMiddlewareScope, action: Presence<ActionName>): boolean => {
  if (scope.kind === 'all') return true;
  const current = actionValue(action);
  const contains = relationAny(relationProject(scope.actions, candidate => relationEqual(candidate.value.value, current)));
  return scope.kind === 'only'
    ? relationAll([relationEqual(action.kind, 'present'), contains])
    : relationAll([relationEqual(action.kind, 'present'), relationNotEqual(contains, true)]);
};

const middlewareIdentityEqual = (
  left: RouteMiddlewareContract | RouteMiddlewareExclusionContract,
  right: RouteMiddlewareContract | RouteMiddlewareExclusionContract,
): boolean => {
  const leftIdentity = routeMiddlewareIdentity(left.middleware);
  const rightIdentity = routeMiddlewareIdentity(right.middleware);
  return relationEqual(
    leftIdentity.kind,
    rightIdentity.kind,
  ) && relationEqual(
    leftIdentity.name.value.value,
    rightIdentity.name.value.value,
  );
};

const exclusionApplies = (
  declaration: RouteMiddlewareContract,
  exclusions: readonly RouteMiddlewareExclusionContract[],
  action: Presence<ActionName>,
): boolean => relationProject(
  relationSelect(exclusions, exclusion =>
    middlewareIdentityEqual(declaration, exclusion) && scopeApplies(exclusion.scope, action)),
  exclusion => exclusion,
).length > 0;

/** Resolve declared middleware into the concrete action's effective middleware set. */
export const resolveRouteMiddlewareFlow = (
  input: RouteMiddlewareSemanticInput,
): RouteMiddlewareFlow => {
  const effectiveMiddleware = relationSelect(
    input.declarations,
    declaration => scopeApplies(declaration.scope, input.action) && !exclusionApplies(declaration, input.exclusions, input.action),
  );
  return Object.freeze({
    kind: 'route_middleware_flow' as const,
    middleware: Object.freeze(relationProject(input.declarations, declaration => declaration)),
    exclusions: Object.freeze(relationProject(input.exclusions, exclusion => exclusion)),
    effectiveMiddleware: Object.freeze(relationProject(effectiveMiddleware, declaration => declaration)),
  });
};
