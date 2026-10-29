import { strict as assert } from 'node:assert';
import { routeGroupAstFactsOperations } from '../../../operations/domain-model/route/routeGroupAstAdapter';
import { routeGroupSemanticResolver } from '../../../upstream/route/routeGroupSemanticResolver';

describe('phase 69 route group AST to semantic ADT elevation', () => {
  it('keeps the semantic resolver AST-free', () => {
    const facts = routeGroupAstFactsOperations.extractFacts({
      prefix: ['/admin'],
      middleware: ['auth'],
      groupNamePrefix: ['admin.'],
      groupController: 'AdminController',
      groupDomain: '{account}.example.com',
      groupBindingScope: 'scoped',
      groupConstraints: [{ parameter: 'id', method: 'where', argument: { kind: 'pattern', value: '[0-9]+' } }],
    } as any);

    const context = routeGroupSemanticResolver.resolveContext(facts);
    assert.equal(context.namePrefix.kind, 'some');
    assert.equal(context.controller.kind, 'some');
    assert.equal(context.domain.kind, 'explicit');
    assert.equal(context.bindingScope.kind, 'scoped');
    assert.equal(context.constraints.kind, 'cons');
    if (context.constraints.kind === 'cons') {
      assert.equal(context.constraints.head.kind, 'pattern');
      if (context.constraints.head.kind === 'pattern') assert.equal(context.constraints.head.value.value, '[0-9]+');
    }
    assert.equal(context.middlewareMutations.kind, 'cons');
  });
});
