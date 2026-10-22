import { resolveEffectiveControllerActionPolicyUpstream } from '../effectiveControllerActionPolicyResolver';
import { routeActionPolicyRelationsFromEffectivePolicy } from '../routeActionPolicyRelations';
import { createActionName, createControllerName, createMiddlewareName } from '../names';

describe('Phase 928 effective route-action policy', () => {
  it('closes route/group and controller action policy while preserving route identity', () => {
    const action = createActionName('store');
    const controller = createControllerName('OrderController');
    const route = {
      kind: 'route_reference' as const,
      name: { kind: 'route_name' as const, value: { kind: 'string_value' as const, value: 'orders.store' } },
    };
    const auth = createMiddlewareName('auth');
    const audit = createMiddlewareName('audit');
    const source = { kind: 'source_span' as const, file: 'routes/web.php', start: { kind: 'number_value' as const, value: 1 }, end: { kind: 'number_value' as const, value: 10 } };
    const policy = resolveEffectiveControllerActionPolicyUpstream({
      controller,
      action,
      middleware: {
        declarations: [
          { middleware: { kind: 'named', name: auth, parameters: [] }, source: { kind: 'route_group' }, scope: { kind: 'all' } },
        ],
        exclusions: [],
        action: { kind: 'present', value: action },
      },
      policy: [{
        kind: 'controller_middleware_relation',
        middleware: audit,
        origin: { kind: 'has_middleware' },
        scope: { kind: 'method' },
        actions: { kind: 'only', actions: { kind: 'cons', head: action, tail: { kind: 'empty' } } },
        exclusion: false,
        source,
      }],
      policyCatalog: { kind: 'complete', entries: [] },
      source: [source],
      inheritedFrom: [],
    });
    const relations = routeActionPolicyRelationsFromEffectivePolicy(route, policy);
    expect(relations.map(relation => relation.kind)).toEqual([
      'route_action_middleware_policy',
      'route_action_middleware_policy',
    ]);
    expect(relations.every(relation => relation.route === route)).toBe(true);
    expect(relations.map(relation => relation.provenance)).toEqual(['route_group', 'controller_method']);
    expect(relations.every(relation => relation.inheritedFrom.length === 0)).toBe(true);
  });

  it('inherits class policy but never leaks an ancestor method-only policy', () => {
    const store = createActionName('store');
    const parent = createControllerName('ParentController');
    const child = createControllerName('ChildController');
    const auth = createMiddlewareName('auth');
    const audit = createMiddlewareName('audit');
    const source = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: 'app/Http/Controllers/ParentController.php' } }, start: { kind: 'number_value' as const, value: 1 }, end: { kind: 'number_value' as const, value: 10 } };
    const policy = resolveEffectiveControllerActionPolicyUpstream({
      controller: child,
      action: store,
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: store } },
      policy: [],
      policyCatalog: { kind: 'complete', entries: [{ controller: parent, relations: [
        { kind: 'controller_middleware_relation', middleware: auth, origin: { kind: 'has_middleware' }, scope: { kind: 'class' }, actions: { kind: 'all' }, exclusion: false, source },
        { kind: 'controller_middleware_relation', middleware: audit, origin: { kind: 'has_middleware' }, scope: { kind: 'method' }, actions: { kind: 'only', actions: { kind: 'cons', head: store, tail: { kind: 'empty' } } }, exclusion: false, source: { ...source, start: { kind: 'number_value' as const, value: 11 }, end: { kind: 'number_value' as const, value: 20 } } },
      ] }] },
      inheritedFrom: [parent],
      source: [source],
    });
    expect(policy.judgment.kind).toBe('complete');
    if (policy.judgment.kind === 'complete') {
      expect(policy.middleware.map(entry => entry.middleware.name.value.value)).toEqual(['auth']);
    }
  });

  it('uses known ancestor policy when an unrelated controller inventory is unavailable', () => {
    const store = createActionName('store');
    const parent = createControllerName('ParentController');
    const unrelated = createControllerName('UnrelatedController');
    const child = createControllerName('ChildController');
    const auth = createMiddlewareName('auth');
    const source = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: 'ParentController.php' } }, start: { kind: 'number_value' as const, value: 1 }, end: { kind: 'number_value' as const, value: 10 } };
    const policy = resolveEffectiveControllerActionPolicyUpstream({
      controller: child,
      action: store,
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: store } },
      policy: [],
      policyCatalog: {
        kind: 'blocked',
        entries: [{ controller: parent, relations: [
          { kind: 'controller_middleware_relation', middleware: auth, origin: { kind: 'has_middleware' }, scope: { kind: 'class' }, actions: { kind: 'all' }, exclusion: false, source },
        ] }],
        reason: { kind: 'controller_policy_inventory_unavailable', controllers: [unrelated] },
      },
      inheritedFrom: [parent],
      source: [source],
    });

    expect(policy.judgment.kind).toBe('complete');
    expect(policy.judgment.kind === 'complete' ? policy.middleware.map(entry => entry.middleware.name.value.value) : []).toEqual(['auth']);
  });

  it('blocks inherited policy when the complete catalog omits an ancestor controller', () => {
    const parent = createControllerName('ParentController');
    const child = createControllerName('ChildController');
    const action = createActionName('store');
    const source = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: 'ChildController.php' } }, start: { kind: 'number_value' as const, value: 0 }, end: { kind: 'number_value' as const, value: 1 } };
    const policy = resolveEffectiveControllerActionPolicyUpstream({
      controller: child,
      action,
      middleware: { declarations: [], exclusions: [], action: { kind: 'present', value: action } },
      policy: [],
      policyCatalog: { kind: 'complete', entries: [] },
      inheritedFrom: [parent],
      source: [source],
    });

    expect(policy.judgment.kind).toBe('blocked');
    expect(policy.judgment.kind === 'blocked' ? policy.judgment.reasons : []).toContainEqual({
      kind: 'controller_policy_inventory_unavailable',
      controllers: [parent],
    });
    expect('middleware' in policy).toBe(false);
    expect('authorization' in policy).toBe(false);
  });
});
