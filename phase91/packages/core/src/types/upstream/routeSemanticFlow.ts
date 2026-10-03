import type { ActionName, ControllerName, RoutePath } from './names';
import type { RouteBindingContract } from './routeBinding';
import type { ResolvedRouteBindingContract } from './routeBindingResolution';
import type { RouteMiddlewareFlow } from './routeMiddleware';
import type { RouteGroupContext } from './route';
import type { RouteMissingBehaviorFlow } from './routeMissing';
import type { RouteConstraintFlow } from './routeConstraints';

/** Semantic HTTP method. Deliberately independent from the lexer AST. */
export type RouteMethod =
  | 'get' | 'post' | 'put' | 'patch' | 'delete'
  | 'options' | 'head' | 'match' | 'any';

export type RouteTargetContract =
  | {
      readonly kind: 'controller_action';
      readonly controller: ControllerName;
      readonly action: ActionName;
    }
  | {
      readonly kind: 'controller_invokable';
      readonly controller: ControllerName;
    }
  | {
      readonly kind: 'closure';
      readonly action: ActionName;
    };

export interface RouteIdentityContract {
  readonly method: RouteMethod;
  readonly path: RoutePath;
  readonly target: RouteTargetContract;
}

/**
 * Fully semantic route contract produced upstream.
 *
 * No AST type is exposed here. Consumers receive the route identity plus the
 * already-resolved Laravel semantics and therefore do not need to parse PHP.
 */
export interface RouteSemanticFlow {
  readonly kind: 'route_semantic_flow';
  readonly identity: RouteIdentityContract;
  readonly group: RouteGroupContext;
  readonly middleware: RouteMiddlewareFlow;
  readonly bindings: readonly RouteBindingContract[];
  readonly resolvedBindings: readonly ResolvedRouteBindingContract[];
  readonly missing: RouteMissingBehaviorFlow;
  readonly constraints: RouteConstraintFlow;
}
