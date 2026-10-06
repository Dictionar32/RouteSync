import { strict as assert } from 'node:assert';
import { extractRouteGroupFactsFromAst } from '../routeGroupAstAdapter';
import { resolveRouteGroupFacts } from '../routeGroupSemanticResolver';

describe('phase 69 route group AST to semantic ADT elevation', () => {
  it('keeps the semantic resolver AST-free', () => {
    const facts = extractRouteGroupFactsFromAst({
      prefix: ['/admin'],
      middleware: ['auth'],
      groupNamePrefix: ['admin.'],
      groupController: 'AdminController',
      groupDomain: '{account}.example.com',
      groupBindingScope: 'scoped',
      groupConstraints: [{ parameter: 'id', value: '[0-9]+' }],
    } as any);

    const context = resolveRouteGroupFacts(facts);
    assert.equal(context.namePrefix.kind, 'some');
    assert.equal(context.controller.kind, 'some');
    assert.equal(context.domain.kind, 'explicit');
    assert.equal(context.bindingScope.kind, 'scoped');
    assert.equal(context.constraints.kind, 'cons');
    assert.equal(context.middlewareMutations.kind, 'cons');
  });
});
