import { strict as assert } from 'node:assert';
import { parseRouteBindingDeclarations } from '../../lexer/routeAst/routeBindingDeclarationAst';
import { extractRouteBindingFactsFromAst } from '../routeBindingAstAdapter';
import { resolveRouteBindingContracts } from '../routeBindingContractResolver';

describe('route binding semantic elevation', () => {
  it('preserves URI binding syntax in AST and elevates custom keys upstream', () => {
    const bindings = parseRouteBindingDeclarations('/users/{user}/posts/{post:slug}');
    assert.equal(bindings.length, 2);
    assert.equal(bindings[0].parameter, 'user');
    assert.equal(bindings[0].customKey, undefined);
    assert.equal(bindings[1].customKey, 'slug');

    const declaration = {
      bindings,
    } as any;
    const facts = extractRouteBindingFactsFromAst(declaration);
    const contracts = resolveRouteBindingContracts(facts);
    assert.equal(contracts[0].key.kind, 'default');
    assert.equal(contracts[1].key.kind, 'custom');
    assert.equal(contracts[1].key.column.value.value, 'slug');
  });
});
