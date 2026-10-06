import { projectRouteResourceMiddleware } from './resourceMiddlewareProjection';
import { createRouteResourceControllerAst, createRouteResourceNameAst } from '../../lexer/routeAst/routeResourceDeclarationAst';

describe('phase 902 resource middleware projection', () => {
  it('projects middleware, middlewareFor, and withoutMiddlewareFor with scope and parameters', () => {
    const result = projectRouteResourceMiddleware({
      method: 'resource',
      resource: createRouteResourceNameAst('users'),
      controller: createRouteResourceControllerAst('UserController'),
      shallow: false,
      creatable: true,
      destroyable: true,
      middleware: [
        { middleware: ['auth:web'], scope: { kind: 'all', actions: [] } },
        { middleware: ['verified', 'subscribed'], scope: { kind: 'only', actions: ['show', 'update'] } },
      ],
      middlewareExclusions: [
        { middleware: ['verified'], scope: { kind: 'only', actions: ['destroy'] } },
      ],
      source: { file: 'routes/web.php', line: 10, column: 1, offset: 0 },
    });

    expect(result.declarations).toHaveLength(3);
    expect(result.declarations[0]).toMatchObject({
      middleware: { name: { value: { value: 'auth' } }, parameters: [{ value: 'web' }] },
      source: { kind: 'resource' },
      scope: { kind: 'all' },
    });
    expect(result.declarations[1]).toMatchObject({ scope: { kind: 'only', actions: [{ value: 'show' }, { value: 'update' }] } });
    expect(result.exclusions[0]).toMatchObject({
      middleware: { name: { value: { value: 'verified' } } },
      scope: { kind: 'only', actions: [{ value: 'destroy' }] },
    });
  });
});
