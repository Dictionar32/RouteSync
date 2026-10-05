import { controllerActionPolicyRelationsFromRoute } from '../controllerActionPolicyRelations';

const controller = { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: 'OrderController' } };
const action = { kind: 'action_name' as const, value: { kind: 'string_value' as const, value: 'store' } };
const middleware = { name: { kind: 'middleware_name' as const, value: { kind: 'string_value' as const, value: 'auth' } }, parameters: [] };
const source = { kind: 'source_span' as const, file: 'routes/web.php', start: { line: 1, column: 1 }, end: { line: 1, column: 10 } };

describe('Phase 927 controller action route policy projection', () => {
  it('preserves route/group provenance without entering dataflow or graph-edge semantics', () => {
    const relations = controllerActionPolicyRelationsFromRoute(controller, action, [
      { middleware, source: { kind: 'route_group' }, scope: { kind: 'all' } },
      { middleware, source: { kind: 'route' }, scope: { kind: 'all' } },
    ], source);

    expect(relations).toHaveLength(2);
    expect(relations[0].kind).toBe('controller_action_middleware_policy');
    expect(relations[0].provenance).toBe('route_group');
    expect(relations[1].provenance).toBe('route');
    expect(relations[0].inheritedFrom).toEqual([]);
  });
});
