import { describe, expect, it } from 'vitest';
import { resolveRouteMiddlewareFlow } from '../routeMiddlewareFlowResolver';
import type { RouteMiddlewareSemanticInput } from '../../../../../types/upstream/routeMiddleware';
import { present } from '../../../../../types/upstream/presence';
import { createActionName, createMiddlewareName, stringValue } from '../../../../../types/upstream/names';

const middleware = (name: string, scope: RouteMiddlewareSemanticInput['declarations'][number]['scope'], source: 'route' | 'controller_class' | 'controller_method' = 'route') => ({
  middleware: { name: createMiddlewareName(name), parameters: Object.freeze([]) },
  source: { kind: source },
  scope,
});

const exclusion = (name: string, scope: RouteMiddlewareSemanticInput['exclusions'][number]['scope']) => ({
  middleware: { name: createMiddlewareName(name), parameters: Object.freeze([]) },
  source: { kind: 'controller_method' as const },
  scope,
});

describe('Phase 899 route middleware semantic resolver', () => {
  it('keeps all declarations and filters only/except for the concrete action', () => {
    const input: RouteMiddlewareSemanticInput = {
      declarations: [
        middleware('auth', { kind: 'all' }),
        middleware('subscribed', { kind: 'only', actions: [createActionName('show')] }, 'controller_class'),
        middleware('audit', { kind: 'except', actions: [createActionName('store')] }, 'controller_method'),
      ],
      exclusions: [],
      action: present(createActionName('show')),
    };

    const flow = resolveRouteMiddlewareFlow(input);
    expect(flow.middleware).toHaveLength(3);
    expect(flow.effectiveMiddleware.map(item => item.middleware.name.value.value)).toEqual(['auth', 'subscribed', 'audit']);
  });

  it('applies middleware exclusions by middleware identity', () => {
    const input: RouteMiddlewareSemanticInput = {
      declarations: [middleware('auth', { kind: 'all' }), middleware('subscribed', { kind: 'all' })],
      exclusions: [exclusion('subscribed', { kind: 'except', actions: [createActionName('index')] })],
      action: present(createActionName('show')),
    };

    const flow = resolveRouteMiddlewareFlow(input);
    expect(flow.effectiveMiddleware.map(item => item.middleware.name.value.value)).toEqual(['auth']);
  });

  it('matches exclusions by middleware identity rather than invocation parameters', () => {
    const input: RouteMiddlewareSemanticInput = {
      declarations: [
        { ...middleware('auth:web', { kind: 'all' }), middleware: { name: createMiddlewareName('auth'), parameters: [{ kind: 'string_value', value: 'web' }] } },
        { ...middleware('verified', { kind: 'all' }) },
      ],
      exclusions: [
        { ...exclusion('auth', { kind: 'all' }), middleware: { name: createMiddlewareName('auth'), parameters: Object.freeze([]) } },
      ],
      action: present(createActionName('show')),
    };

    const flow = resolveRouteMiddlewareFlow(input);
    expect(flow.effectiveMiddleware.map(item => item.middleware.name.value.value)).toEqual(['verified']);
  });


  it('preserves blocked scope judgment instead of reporting a complete empty result', () => {
    const source = Object.freeze({
      kind: 'source_span' as const,
      file: Object.freeze({ kind: 'source_file' as const, value: stringValue('Controller.php') }),
      start: Object.freeze({ kind: 'number_value' as const, value: 0 }),
      end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
    });
    const argument = Object.freeze({
      kind: 'named' as const,
      name: Object.freeze({ kind: 'expression_argument_name' as const, value: stringValue('only') }),
      value: Object.freeze({
        kind: 'variable' as const,
        name: Object.freeze({ kind: 'variable_name' as const, value: stringValue('methods') }),
        source,
      }),
    });
    const input: RouteMiddlewareSemanticInput = {
      declarations: [middleware('auth', { kind: 'blocked', reason: { kind: 'unsupported_only_expression', argument } }, 'controller_class')],
      exclusions: [],
      action: present(createActionName('show')),
    };
    const flow = resolveRouteMiddlewareFlow(input);
    expect(flow.judgment.kind).toBe('blocked');
    expect(flow.middleware).toHaveLength(1);
    expect(flow.effectiveMiddleware).toHaveLength(0);
  });

  it('does not invent applicability for scoped middleware without a concrete action', () => {
    const input: RouteMiddlewareSemanticInput = {
      declarations: [middleware('auth', { kind: 'all' }), middleware('subscribed', { kind: 'only', actions: [createActionName('show')] })],
      exclusions: [],
      action: { kind: 'absent' },
    };

    const flow = resolveRouteMiddlewareFlow(input);
    expect(flow.effectiveMiddleware.map(item => item.middleware.name.value.value)).toEqual(['auth']);
  });
});
