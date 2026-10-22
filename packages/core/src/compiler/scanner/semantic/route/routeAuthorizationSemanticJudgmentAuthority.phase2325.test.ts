import { describe, expect, it } from 'vitest';
import { createMiddlewareName } from '../../../../types/upstream/names';
import { routeAuthorizationSemanticJudgmentAuthority } from './routeMiddlewareKnowledgeCatalog';

describe('route authorization semantic judgment authority', () => {
  it('recognizes the canonical auth middleware', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([createMiddlewareName('auth')]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_present');
    expect(judgment.middleware.map(middleware => middleware.value.value)).toEqual(['auth']);
  });

  it('recognizes auth middleware with a guard parameter', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([createMiddlewareName('auth:api')]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_present');
    expect(judgment.middleware.map(middleware => middleware.value.value)).toEqual(['auth:api']);
  });

  it('recognizes Laravel built-in authentication aliases exactly', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([
      createMiddlewareName('auth.basic'),
      createMiddlewareName('auth.session'),
      createMiddlewareName('Illuminate\\Auth\\Middleware\\Authenticate'),
      createMiddlewareName('Illuminate\\Auth\\Middleware\\AuthenticateWithBasicAuth'),
      createMiddlewareName('Illuminate\\Session\\Middleware\\AuthenticateSession'),
    ]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_present');
    expect(judgment.middleware.map(middleware => middleware.value.value)).toEqual([
      'auth.basic',
      'auth.session',
      'Illuminate\\Auth\\Middleware\\Authenticate',
      'Illuminate\\Auth\\Middleware\\AuthenticateWithBasicAuth',
      'Illuminate\\Session\\Middleware\\AuthenticateSession',
    ]);
  });

  it('does not mistake unrelated names beginning with auth for auth middleware', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([
      createMiddlewareName('authorization'),
      createMiddlewareName('authenticated'),
      createMiddlewareName('authorizer'),
    ]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_absent');
    expect(judgment.middleware).toEqual([]);
  });


  it('rejects an auth guard prefix without a guard name', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([createMiddlewareName('auth:')]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_absent');
    expect(judgment.middleware).toEqual([]);
  });

  it('rejects an auth guard containing only whitespace', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([createMiddlewareName('auth:   ') ]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_absent');
    expect(judgment.middleware).toEqual([]);
  });

  it('preserves only matching middleware evidence in a mixed set', () => {
    const judgment = routeAuthorizationSemanticJudgmentAuthority.judge([
      createMiddlewareName('authorization'),
      createMiddlewareName('auth:sanctum'),
    ]);
    expect(judgment.kind).toBe('laravel_route_authorization_middleware_present');
    expect(judgment.middleware.map(middleware => middleware.value.value)).toEqual(['auth:sanctum']);
  });
});
