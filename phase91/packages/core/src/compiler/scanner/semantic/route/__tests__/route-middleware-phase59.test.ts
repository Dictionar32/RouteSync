import { resolveRouteMiddlewareFlow } from '../routeMiddlewareResolver';
import { createRoutePathLiteral, type RouteDeclarationAst } from '../../../lexer/routeAst/routeDeclarationAst';
import { createRouteParameterName, createClassName, createMiddlewareName } from '../../../../../types/upstream/names';

test('Phase 59 keeps middleware source semantic and ordered', () => {
  const declaration = {
    middleware: ['auth'],
    routeMiddleware: ['throttle:uploads'],
    bindings: [],
    prefix: [],
    groupNamePrefix: [],
    groupController: undefined,
    groupDomain: undefined,
    groupBindingScope: 'default',
    missingHandler: false,
    routeConstraints: [],
    groupConstraints: [],
    method: 'get',
    targetMethods: ['get'],
    path: createRoutePathLiteral('/files'),
    target: { kind: 'controller_action', controller: createRouteParameterName('FileController') as never, action: createRouteParameterName('index') as never },
    source: {} as never,
    end: {} as never,
  } satisfies RouteDeclarationAst;

  const flow = resolveRouteMiddlewareFlow({
    groupMiddleware: declaration.middleware,
    routeMiddleware: declaration.routeMiddleware,
    classMiddleware: [createMiddlewareName('verified')],
    methodMiddleware: [createMiddlewareName('subscribed')],
  });

  expect(flow.kind).toBe('route_middleware_flow');
  expect(flow.middleware.map(item => item.source.kind)).toEqual([
    'route_group', 'route', 'controller_class', 'controller_method',
  ]);
  expect(flow.middleware.map(item => item.middleware.name.value.value)).toEqual([
    'auth', 'throttle', 'verified', 'subscribed',
  ]);
  expect(flow.middleware[1]?.middleware.parameters.map(item => item.value)).toEqual(['uploads']);
});
