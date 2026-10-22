import { describe, expect, it } from 'vitest';
import { createMiddlewareName } from '../names';
import { routeSecurityAuthority } from '../routeSecurityAuthority';
import type { RouteMiddleware } from '../route';
import type { RouteMiddlewares, Sequence } from '../collections';

const prependMiddleware = (name: string, tail: Sequence<RouteMiddleware>): Sequence<RouteMiddleware> => ({
  kind: 'cons',
  head: { kind: 'direct', name: createMiddlewareName(name) },
  tail,
});

const middlewareFlow = (names: readonly string[]): RouteMiddlewares => {
  const items = names.reduceRight<Sequence<RouteMiddleware>>(
    (tail, name) => prependMiddleware(name, tail),
    { kind: 'empty' },
  );
  return { kind: 'route_middlewares', items };
};

const resolve = (names: readonly string[], authorization: import('../routeAuthorizationSemanticJudgmentInterface').LaravelRouteAuthorizationSemanticJudgment = { kind: 'laravel_route_authorization_middleware_absent', middleware: Object.freeze([]) }) => routeSecurityAuthority.resolve({
  kind: 'route_security_authority_input',
  middleware: middlewareFlow(names),
  authorization,
});

describe('Phase 2329 route security authority uses valid auth guard evidence', () => {
  it('does not classify an empty auth guard as protected', () => {
    const judgment = resolve(['auth:']);

    expect(judgment.security.isProtected.value).toBe(false);
    expect(judgment.auth.value).toBe(false);
  });

  it('does not classify a whitespace-only auth guard as protected', () => {
    const judgment = resolve(['auth:   ']);

    expect(judgment.security.isProtected.value).toBe(false);
    expect(judgment.auth.value).toBe(false);
  });

  it('continues to recognize a named auth guard', () => {
    const middleware = createMiddlewareName('auth:api');
    const judgment = resolve(['auth:api'], { kind: 'laravel_route_authorization_middleware_present', middleware: Object.freeze([middleware]) });

    expect(judgment.security.isProtected.value).toBe(true);
    expect(judgment.auth.value).toBe(true);
  });});
