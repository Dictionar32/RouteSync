import { describe, expect, it } from 'vitest';
import { resolveEffectiveControllerActionPolicy } from './effectiveControllerActionPolicyResolver';
import { routeMiddlewareReference } from './resourceMiddlewareProjection';
import type { ControllerAuthorizationRelation, ControllerInheritanceRelation, ControllerPolicyRelation } from '../../../../types/upstream/controller';

const middleware = (name: string, scope: 'all' | 'only' | 'except' = 'all'): RouteMiddlewareContract => ({
  middleware: routeMiddlewareReference(name),
  source: { kind: 'controller_class' as const },
  scope: scope === 'all' ? { kind: 'all' as const } : { kind: scope, actions: [createActionName('store')] },
});

describe('Phase 921 effective controller action policy', () => {
  it('normalizes scoped controller middleware without making it a dataflow fact', () => {
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: {
        declarations: [middleware('auth'), middleware('audit', 'only')],
        exclusions: [],
        action: { kind: 'present', value: createActionName('store') },
      },
      inheritedFrom: [createControllerName('BaseController')],
    });

    expect(policy.kind).toBe('effective_controller_action_policy');
    expect(policy.middleware.map(item => item.middleware.name.value.value)).toEqual(['auth', 'audit']);
    expect(policy.inheritedFrom.map(item => item.value.value)).toEqual(['BaseController']);
  });

  it('applies middleware exclusions before producing the effective policy', () => {
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: {
        declarations: [middleware('auth'), middleware('audit', 'only')],
        exclusions: [{
          middleware: routeMiddlewareReference('auth'),
          source: { kind: 'controller_method' },
          scope: { kind: 'only', actions: [createActionName('store')] },
        }],
        action: { kind: 'present', value: createActionName('store') },
      },
    });

    expect(policy.middleware.map(item => item.middleware.name.value.value)).toEqual(['audit']);
  });
});

describe('Phase 921 evidence aggregation', () => {
  it('aggregates route, resource, and controller policy before action resolution', () => {
    const policy = resolveEffectiveControllerActionPolicyFromEvidence({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      evidence: {
        routeGroup: [{ kind: 'middleware_name', value: { kind: 'string_value', value: 'auth' } }],
        resource: { declarations: [middleware('throttle')], exclusions: [] },
        controller: { declarations: [middleware('audit', 'only')], exclusions: [] },
      },
    });
    expect(policy.middleware.map(item => item.middleware.name.value.value)).toEqual(['auth', 'throttle', 'audit']);
  });
});

const auth = (action: string): ControllerAuthorizationRelation => ({
  kind: 'controller_authorization_relation',
  scope: { kind: 'method' },
  actions: { kind: 'only', actions: [createActionName(action)] },
  arguments: { kind: 'expression_arguments', items: { kind: 'empty' } },
  source: { kind: 'source_span', file: { kind: 'source_file', value: '<phase922>' }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 1 } },
});

const inheritance = (child: string, parent: string): ControllerInheritanceRelation => ({
  kind: 'controller_inheritance_relation',
  child: createControllerName(child),
  parent: createControllerName(parent),
  source: { kind: 'source_span', file: { kind: 'source_file', value: '<phase922>' }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 1 } },
});

describe('Phase 922 closed policy resolution', () => {
  it('resolves inherited middleware and filters authorization to the concrete action', () => {
    const inheritedMiddleware: ControllerPolicyRelation = middleware('audit');
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policy: [auth('store')],
      policyCatalog: [
        { controller: createControllerName('BaseController'), relations: [inheritedMiddleware, auth('index')] },
        { controller: createControllerName('OrderController'), relations: [auth('store')] },
      ],
      inheritance: [inheritance('OrderController', 'BaseController')],
    });
    expect(policy.middleware.map(item => item.middleware.name.value.value)).toEqual(['audit']);
    expect(policy.authorization).toHaveLength(1);
  });
});
