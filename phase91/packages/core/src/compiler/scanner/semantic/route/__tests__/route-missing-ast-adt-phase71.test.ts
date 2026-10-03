import { extractRouteMissingFactFromAst } from '../routeMissingAstAdapter';
import { resolveRouteMissingFact } from '../routeMissingSemanticResolver';

describe('route missing AST -> ADT elevation', () => {
  it('extracts the custom-handler fact without resolving semantics', () => {
    expect(extractRouteMissingFactFromAst({ missingHandler: true })).toEqual({
      kind: 'custom_handler' as const,
    });
  });

  it('resolves the fact into the Laravel semantic ADT', () => {
    expect(resolveRouteMissingFact({ kind: 'custom_handler' as const })).toEqual({
      kind: 'route_missing_behavior_flow',
      behavior: { kind: 'custom_handler' },
    });

    expect(resolveRouteMissingFact({ kind: 'absent' as const })).toEqual({
      kind: 'route_missing_behavior_flow',
      behavior: { kind: 'default_404' },
    });
  });
});
