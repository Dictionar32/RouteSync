import { strict as assert } from 'node:assert';
import { extractRouteBindingFactsFromAst } from '../routeBindingAstAdapter';
import { resolveRouteBindingFacts } from '../routeBindingSemanticResolver';

describe('phase 70 route binding AAT to ADT elevation', () => {
  it('keeps the semantic binding resolver independent of AST types', () => {
    const facts = extractRouteBindingFactsFromAst({
      bindings: [{ parameter: 'post', customKey: 'slug', withTrashed: { kind: 'disabled' as const } }],
    } as any);
    const bindings = resolveRouteBindingFacts(facts);
    assert.equal(bindings[0].parameter.value.value, 'post');
    assert.equal(bindings[0].key.kind, 'custom');
    assert.equal(bindings[0].key.column.value.value, 'slug');
    assert.equal(bindings[0].withTrashed, false);
  });
});
