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
      source: [source],
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
});
