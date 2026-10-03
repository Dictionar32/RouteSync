/**
 * Upstream composition boundary for a Laravel route.
 *
 * This resolver consumes semantic ADTs only. AST scanning belongs before this
 * boundary; the returned RouteSemanticFlow is the contract intended for the
 * downstream interface / flow layer.
 */
import type { RouteBindingContract } from '../../../../types/upstream/routeBinding';
import type { ResolvedRouteBindingContract } from '../../../../types/upstream/routeBindingResolution';
import type { RouteMiddlewareFlow } from '../../../../types/upstream/routeMiddleware';
import type { RouteGroupContext } from '../../../../types/upstream/route';
import type { RouteMissingBehaviorFlow } from '../../../../types/upstream/routeMissing';
import type { RouteConstraintFlow } from '../../../../types/upstream/routeConstraints';
import type {
  RouteIdentityContract,
  RouteSemanticFlow,
} from '../../../../types/upstream/routeSemanticFlow';

export interface RouteSemanticFlowInput {
  readonly identity: RouteIdentityContract;
  readonly group: RouteGroupContext;
  readonly middleware: RouteMiddlewareFlow;
  readonly bindings: readonly RouteBindingContract[];
  readonly resolvedBindings: readonly ResolvedRouteBindingContract[];
  readonly missing: RouteMissingBehaviorFlow;
  readonly constraints: RouteConstraintFlow;
}

export function composeRouteSemanticFlow(
  input: RouteSemanticFlowInput,
): RouteSemanticFlow {
  return Object.freeze({
    kind: 'route_semantic_flow' as const,
    identity: Object.freeze(input.identity),
    group: Object.freeze(input.group),
    middleware: Object.freeze(input.middleware),
    bindings: Object.freeze([...input.bindings]),
    resolvedBindings: Object.freeze([...input.resolvedBindings]),
    missing: Object.freeze(input.missing),
    constraints: Object.freeze(input.constraints),
  });
}
