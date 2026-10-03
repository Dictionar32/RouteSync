import { describe, expect, it } from 'vitest';
import { composeRouteSemanticFlow } from '../routeSemanticFlowResolver';
import { createActionName, createControllerName, createRoutePath } from '../../../../../types/upstream/names';
import type { RouteGroupContext } from '../../../../../types/upstream/route';
import type { RouteMiddlewareFlow } from '../../../../../types/upstream/routeMiddleware';
import type { RouteConstraintFlow } from '../../../../../types/upstream/routeConstraints';

const group = {
  middlewareMutations: { kind: 'empty' },
  prefix: { kind: 'none' },
  namePrefix: { kind: 'none' },
  controller: { kind: 'none' },
  domain: { kind: 'default' },
  bindingScope: { kind: 'default' },
  constraints: { kind: 'empty' },
} as RouteGroupContext;

const constraints: RouteConstraintFlow = Object.freeze({
  kind: 'route_constraint_flow',
  route: Object.freeze([]),
  effective: Object.freeze([]),
});

const middleware: RouteMiddlewareFlow = Object.freeze({
  kind: 'route_middleware_flow',
  middleware: Object.freeze([]),
  exclusions: Object.freeze([]),
  effectiveMiddleware: Object.freeze([]),
});

describe('phase 60 route semantic flow', () => {
  it('composes semantic ADTs without exposing AST', () => {
    const flow = composeRouteSemanticFlow({
      identity: {
        method: 'get',
        path: createRoutePath('/users/{user}'),
        target: {
          kind: 'controller_action',
          controller: createControllerName('UserController'),
          action: createActionName('show'),
        },
      },
      group,
      middleware,
      bindings: [],
      resolvedBindings: [],
      missing: { kind: 'route_missing_behavior_flow', behavior: { kind: 'default_404' } },
      constraints,
    });

    expect(flow.kind).toBe('route_semantic_flow');
    expect(flow.identity.method).toBe('get');
    expect(flow.identity.target.kind).toBe('controller_action');
    expect('ast' in flow).toBe(false);
    expect('source' in flow).toBe(false);
  });
});
