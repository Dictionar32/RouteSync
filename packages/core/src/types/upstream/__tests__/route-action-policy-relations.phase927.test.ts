import { routeActionPolicyRelations } from '../routeActionPolicyRelations';

describe('Phase 927 route action policy relation', () => {
  it('keeps route identity and middleware provenance explicit', () => {
    const route = { kind: 'route_reference' as const, name: { kind: 'route_name' as const, value: { kind: 'string_value' as const, value: 'orders.store' } } };
    const controller = {
      kind: 'controller_reference' as const,
      name: { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: 'OrderController' } },
      action: { kind: 'action_name' as const, value: { kind: 'string_value' as const, value: 'store' } },
    };
    const middleware = { name: { kind: 'middleware_name' as const, value: { kind: 'string_value' as const, value: 'auth' } }, parameters: [] };
    const source = { kind: 'source_span' as const, file: 'routes/web.php', start: { line: 1, column: 1 }, end: { line: 1, column: 10 } };
    const relations = routeActionPolicyRelations(route, controller, [
      { middleware, source: { kind: 'route_group' }, scope: { kind: 'all' } },
      { middleware, source: { kind: 'route' }, scope: { kind: 'all' } },
    ], source);
    expect(relations).toHaveLength(2);
    expect(relations[0].route).toEqual(route);
    expect(relations[0].provenance).toBe('route_group');
    expect(relations[1].provenance).toBe('route');
  });
});
