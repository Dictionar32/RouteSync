import { describe, expect, it } from 'vitest';
import { resolveEffectiveControllerActionPolicy, resolveEffectiveControllerActionPolicyFromEvidence } from './effectiveControllerActionPolicyResolver';
import { routeMiddlewareReference } from './resourceMiddlewareProjection';
import type { ControllerAuthorizationRelation, ControllerInheritanceRelation, ControllerPolicyRelation } from '../../../../types/upstream/controller';
import { createActionName, createControllerName, stringValue } from '../../../../types/upstream/names';
import type { RouteMiddlewareContract } from '../../../../types/upstream/routeMiddleware';

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

    expect(policy).toMatchObject({ judgment: { kind: 'complete' }, middleware: [{ middleware: { name: { value: { value: 'audit' } } } }] });
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

describe('Phase 2335 current controller policy catalog fallback', () => {
  it('uses the current controller entry from the existing policy catalog when no separate own-policy slice is supplied', () => {
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policyCatalog: [
        { controller: createControllerName('OrderController'), relations: [middleware('auth'), auth('store')] },
      ],
    });

    expect(policy.middleware.map(item => item.middleware.name.value.value)).toEqual(['auth']);
    expect(policy.authorization).toHaveLength(1);
  });
});


describe('Phase 2046 canonical authorization scope delegation', () => {
  it('filters only_except authorization through the existing upstream algebra', () => {
    const scoped: ControllerAuthorizationRelation = {
      ...auth('store'),
      actions: {
        kind: 'only_except',
        only: { kind: 'cons', head: createActionName('store'), tail: { kind: 'empty' } },
        except: { kind: 'cons', head: createActionName('destroy'), tail: { kind: 'empty' } },
      },
    };
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policy: [scoped],
    });
    expect(policy.authorization).toHaveLength(1);
  });

  it('keeps blocked authorization evidence in the overall judgment while omitting it from resolved authorization products', () => {
    const source = Object.freeze({
      kind: 'source_span' as const,
      file: Object.freeze({ kind: 'source_file' as const, value: stringValue('Controller.php') }),
      start: Object.freeze({ kind: 'number_value' as const, value: 0 }),
      end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
    });
    const argument = Object.freeze({
      kind: 'named' as const,
      name: Object.freeze({ kind: 'expression_argument_name' as const, value: stringValue('only') }),
      value: Object.freeze({
        kind: 'variable' as const,
        name: Object.freeze({ kind: 'variable_name' as const, value: stringValue('methods') }),
        source,
      }),
    });
    const blocked: ControllerAuthorizationRelation = {
      ...auth('store'),
      actions: {
        kind: 'blocked',
        reason: { kind: 'unsupported_only_expression', argument },
      },
    };
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policy: [blocked],
    });
    expect(policy.judgment.kind).toBe('blocked');
    expect('middleware' in policy).toBe(false);
    expect('authorization' in policy).toBe(false);
  });
});


describe('Phase 2336 inherited policy catalog closure', () => {
  it('uses the existing inheritedFrom identity when the scanner already supplied a closed ancestry list', () => {
    const inheritedMiddleware: ControllerPolicyRelation = {
      kind: 'controller_middleware_relation',
      middleware: { kind: 'middleware_name', value: { kind: 'string_value', value: 'audit' } },
      origin: { kind: 'attribute' },
      scope: { kind: 'class' },
      actions: { kind: 'all' },
      exclusion: false,
      source: { kind: 'source_span', file: { kind: 'source_file', value: stringValue('BaseController.php') }, start: { kind: 'number_value', value: 10 }, end: { kind: 'number_value', value: 25 } },
    };
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policy: [],
      policyCatalog: [
        { controller: createControllerName('BaseController'), relations: [inheritedMiddleware] },
      ],
      inheritedFrom: [createControllerName('BaseController')],
    });

    expect(policy.kind).toBe('effective_controller_action_policy');
    expect(policy.inheritedFrom.map(item => item.value.value)).toEqual(['BaseController']);
    expect(policy).toMatchObject({ judgment: { kind: 'complete' }, middleware: [{ middleware: { name: { value: { value: 'audit' } } } }] });
  });

  it('does not duplicate inherited class policy repeated in several action catalog entries when source identity is the same', () => {
    const inheritedMiddleware: ControllerPolicyRelation = {
      kind: 'controller_middleware_relation',
      middleware: { kind: 'middleware_name', value: { kind: 'string_value', value: 'audit' } },
      origin: { kind: 'attribute' },
      scope: { kind: 'class' },
      actions: { kind: 'all' },
      exclusion: false,
      source: { kind: 'source_span', file: { kind: 'source_file', value: stringValue('BaseController.php') }, start: { kind: 'number_value', value: 10 }, end: { kind: 'number_value', value: 25 } },
    };
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policy: [],
      policyCatalog: [
        { controller: createControllerName('BaseController'), relations: [inheritedMiddleware] },
        { controller: createControllerName('BaseController'), relations: [inheritedMiddleware] },
      ],
      inheritedFrom: [createControllerName('BaseController')],
    });

    expect(policy).toMatchObject({ judgment: { kind: 'complete' }, middleware: [{ middleware: { name: { value: { value: 'audit' } } } }] });
  });
});


describe('Phase 2337 inherited policy scope closure', () => {
  it('inherits class-level policy but does not leak an ancestor method-only policy into a child action', () => {
    const source = Object.freeze({
      kind: 'source_span' as const,
      file: Object.freeze({ kind: 'source_file' as const, value: stringValue('BaseController.php') }),
      start: Object.freeze({ kind: 'number_value' as const, value: 10 }),
      end: Object.freeze({ kind: 'number_value' as const, value: 25 }),
    });
    const inheritedClassMiddleware: ControllerPolicyRelation = {
      kind: 'controller_middleware_relation',
      middleware: { kind: 'middleware_name', value: stringValue('auth') },
      origin: { kind: 'attribute' },
      scope: { kind: 'class' },
      actions: { kind: 'all' },
      exclusion: false,
      source,
    };
    const ancestorMethodMiddleware: ControllerPolicyRelation = {
      kind: 'controller_middleware_relation',
      middleware: { kind: 'middleware_name', value: stringValue('audit') },
      origin: { kind: 'attribute' },
      scope: { kind: 'method' },
      actions: { kind: 'only', actions: { kind: 'cons', head: createActionName('store'), tail: { kind: 'empty' } } },
      exclusion: false,
      source: Object.freeze({ ...source, start: Object.freeze({ kind: 'number_value' as const, value: 30 }), end: Object.freeze({ kind: 'number_value' as const, value: 40 }) }),
    };
    const policy = resolveEffectiveControllerActionPolicy({
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: createActionName('store') } },
      policy: [],
      policyCatalog: [{
        controller: createControllerName('BaseController'),
        relations: [inheritedClassMiddleware, ancestorMethodMiddleware],
      }],
      inheritedFrom: [createControllerName('BaseController')],
    });

    expect(policy.judgment.kind).toBe('complete');
    expect(policy.middleware.map(item => item.middleware.name.value.value)).toEqual(['auth']);
  });
});
