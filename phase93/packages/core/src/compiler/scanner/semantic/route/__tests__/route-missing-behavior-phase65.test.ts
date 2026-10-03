import { extractRouteMissingFactFromAst } from '../routeMissingAstAdapter';
import { resolveRouteMissingFact } from '../routeMissingSemanticResolver';

describe('route missing behavior', () => {
  it('resolves custom missing handler semantics upstream', () => {
    const fact = extractRouteMissingFactFromAst({ missingHandler: true });
    expect(resolveRouteMissingFact(fact).behavior).toEqual({ kind: 'custom_handler' });
  });

  it('resolves the Laravel default when no custom handler exists', () => {
    const fact = extractRouteMissingFactFromAst({ missingHandler: false });
    expect(resolveRouteMissingFact(fact).behavior).toEqual({ kind: 'default_404' });
  });
});
