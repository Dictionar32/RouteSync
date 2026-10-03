import { describe, expect, it } from 'vitest';
import { absent, present } from '../../../../../types/upstream/presence';
import { createActionName, createMiddlewareName } from '../../../../../types/upstream/names';
import { resolveRouteMiddlewareFlow } from '../routeMiddlewareResolver';

describe('phase 62 route middleware ADT normalization', () => {
  it('elevates middleware parameters into a semantic reference', () => {
    const flow = resolveRouteMiddlewareFlow({
      action: present(createActionName('index')),
      groupMiddleware: [createMiddlewareName('web')],
      routeMiddleware: [createMiddlewareName('auth:sanctum')],
      classMiddleware: present([createMiddlewareName('throttle:60,1')]),

      methodMiddleware: present([{
        middleware: createMiddlewareName('subscribed:pro,team'),
        scope: { kind: 'only', actions: [createActionName('index')] },
      }]),
      classExclusions: absent(),
      methodExclusions: absent(),
    });

    expect(flow.middleware[0]?.middleware).toEqual({
      name: createMiddlewareName('web'),
      parameters: [],
    });
    expect(flow.middleware[1]?.middleware.name).toEqual(createMiddlewareName('auth'));
    expect(flow.middleware[1]?.middleware.parameters.map(item => item.value)).toEqual(['sanctum']);
    expect(flow.middleware[2]?.middleware.parameters.map(item => item.value)).toEqual(['60', '1']);
    expect(flow.middleware[3]?.middleware.parameters.map(item => item.value)).toEqual(['pro', 'team']);
    expect(flow.middleware[3]?.scope.kind).toBe('only');
    expect(flow.effectiveMiddleware).toHaveLength(4);
    expect('ast' in flow).toBe(false);
  });

  it('keeps the semantic resolver AST-free', () => {
    const source = resolveRouteMiddlewareFlow({
      action: absent(),
      groupMiddleware: [],
      routeMiddleware: [createMiddlewareName('auth')],
      classMiddleware: absent(), methodMiddleware: absent(), classExclusions: absent(), methodExclusions: absent(),
    });

    expect(source.kind).toBe('route_middleware_flow');
    expect(Object.keys(source)).not.toContain('ast');
  });
});


describe('phase 63 effective route middleware', () => {
  it('applies only/except and exclusions before exposing the flow', () => {
    const flow = resolveRouteMiddlewareFlow({
      action: present(createActionName('show')),
      groupMiddleware: [createMiddlewareName('web')],
      routeMiddleware: [createMiddlewareName('auth')],
      classMiddleware: present([
        { middleware: createMiddlewareName('audit'), scope: { kind: 'only', actions: [createActionName('index')] } },
        { middleware: createMiddlewareName('verified'), scope: { kind: 'except', actions: [createActionName('store')] } },
      ]),
      methodMiddleware: present([createMiddlewareName('local')]),
      classExclusions: present([createMiddlewareName('auth')]),
      methodExclusions: absent(),
    });

    expect(flow.middleware).toHaveLength(5);
    expect(flow.effectiveMiddleware.map(item => item.middleware.name.value.value))
      .toEqual(['web', 'verified', 'local']);
    expect(flow.effectiveMiddleware).not.toContainEqual(expect.objectContaining({
      middleware: expect.objectContaining({ name: createMiddlewareName('auth') }),
    }));
  });
});
