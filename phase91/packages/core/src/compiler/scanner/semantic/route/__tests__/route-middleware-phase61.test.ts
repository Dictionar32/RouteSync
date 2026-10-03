import { describe, expect, it } from 'vitest';
import { createActionName, createMiddlewareName } from '../../../../../types/upstream/names';
import { resolveRouteMiddlewareFlow } from '../routeMiddlewareResolver';

const declaration = {
  groupMiddleware: ['web'] as never,
  routeMiddleware: ['auth'] as never,
};

describe('phase 61 route middleware semantics', () => {
  it('keeps source provenance and controller applicability upstream', () => {
    const flow = resolveRouteMiddlewareFlow({ ...declaration,
      classMiddleware: [createMiddlewareName('auth')],
      methodMiddleware: [{
        middleware: createMiddlewareName('subscribed'),
        only: [createActionName('index')],
      }],
      classExclusions: [createMiddlewareName('guest')],
      methodExclusions: [{
        middleware: createMiddlewareName('verified'),
        except: [createActionName('store')],
      }],
    });

    expect(flow.middleware.map(item => item.source.kind)).toEqual([
      'route_group', 'route', 'controller_class', 'controller_method',
    ]);
    expect(flow.middleware[2]?.scope.kind).toBe('all');
    expect(flow.middleware[3]?.scope.kind).toBe('only');
    expect(flow.exclusions.map(item => item.middleware.name.value.value)).toEqual(['guest', 'verified']);
    expect(flow.exclusions[1]?.scope.kind).toBe('except');
    expect('ast' in flow).toBe(false);
  });
});
