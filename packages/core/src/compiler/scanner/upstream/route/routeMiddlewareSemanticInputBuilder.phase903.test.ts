import { buildRouteMiddlewareSemanticInput, middlewareNames } from './routeMiddlewareSemanticInputBuilder';
import { projectRouteResourceMiddleware } from './resourceMiddlewareProjection';
import { present } from '../../../../types/upstream/presence';
import { createRouteResourceControllerAst, createRouteResourceNameAst } from '../../lexer/routeAst/routeResourceDeclarationAst';

describe('phase 903 route middleware semantic input builder', () => {
  it('aggregates route, resource, and controller evidence without resolving applicability', () => {
    const resource = projectRouteResourceMiddleware({
      method: 'resource',
      resource: createRouteResourceNameAst('users'),
      controller: createRouteResourceControllerAst('UserController'),
      shallow: false,
      creatable: true,
      destroyable: true,
      middleware: [{ middleware: ['verified'], scope: { kind: 'only', actions: ['show'] } }],
      middlewareExclusions: [{ middleware: ['subscribed'], scope: { kind: 'only', actions: ['destroy'] } }],
      source: { file: 'routes/web.php', line: 10, column: 1, offset: 0 },
    });
    const input = buildRouteMiddlewareSemanticInput({
      routeGroup: middlewareNames(['auth']),
      route: middlewareNames(['throttle:api']),
      resource,
      controller: {
        declarations: [{ middleware: { name: middlewareNames(['can'])[0], parameters: [] }, source: { kind: 'controller_method' }, scope: { kind: 'all' } }],
        exclusions: [],
      },
    }, present({ kind: 'show' }));

    expect(input.declarations).toHaveLength(4);
    expect(input.exclusions).toHaveLength(1);
    expect(input.declarations[0]).toMatchObject({ source: { kind: 'route_group' }, scope: { kind: 'all' } });
    expect(input.declarations[1]).toMatchObject({ source: { kind: 'route' }, middleware: { parameters: [] } });
    expect(input.declarations[2]).toMatchObject({ source: { kind: 'resource' }, scope: { kind: 'only' } });
    expect(input.exclusions[0]).toMatchObject({ source: { kind: 'resource' }, scope: { kind: 'only' } });
  });
});
