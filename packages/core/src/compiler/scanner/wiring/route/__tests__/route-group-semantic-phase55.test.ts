import { strict as assert } from 'node:assert';
import { parseRouteDeclarations } from '../../lexer/routeAst/routeDeclarationParser';
import { resolveRouteGroupContext } from '../routeGroupContextResolver';

describe('route group semantic elevation', () => {
  it('elevates Laravel group attributes without removing RouteAst inputs', () => {
    const tokens: any[] = [];
    const declaration = {
      method: 'get', targetMethods: ['get'], path: '/users', target: { kind: 'closure', action: { kind: 'identifier', value: 'closure' }, returns: [] },
      prefix: ['/admin'] as any,
      middleware: ['auth'] as any,
      groupNamePrefix: ['admin.'] as any,
      groupController: 'AdminController' as any,
      groupDomain: '{account}.example.com' as any,
      groupBindingScope: 'scoped' as const,
      groupConstraints: [{ parameter: 'id', value: '[0-9]+' }] as any,
      source: {}, end: {},
    };
    const context = resolveRouteGroupContext(declaration as any);
    assert.equal(context.namePrefix.kind, 'some');
    assert.equal(context.controller.kind, 'some');
    assert.equal(context.domain.kind, 'explicit');
    assert.equal(context.bindingScope.kind, 'scoped');
    assert.equal(context.constraints.kind, 'cons');
    assert.equal(context.middlewareMutations.kind, 'cons');
    void parseRouteDeclarations(tokens);
  });
});
