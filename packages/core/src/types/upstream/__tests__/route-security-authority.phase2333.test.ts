import { describe, expect, it } from 'vitest';
import { createMiddlewareName } from '../names';
import { routeSecurityAuthority } from '../routeSecurityAuthority';
import type { RouteMiddleware } from '../route';
import type { RouteMiddlewares, Sequence } from '../collections';

const middlewareFlow = (names: readonly string[]): RouteMiddlewares => ({
  kind: 'route_middlewares',
  items: names.reduceRight<Sequence<RouteMiddleware>>(
    (tail, name) => ({
      kind: 'cons',
      head: { kind: 'direct', name: createMiddlewareName(name) },
      tail,
    }),
    { kind: 'empty' },
  ),
});

describe('Phase 2334 canonical authorization judgment owns security classification', () => {
  it('preserves recognized Laravel authentication evidence without a boolean handoff', () => {
    const middleware = createMiddlewareName('Illuminate\\Auth\\Middleware\\Authenticate');
    const judgment = routeSecurityAuthority.resolve({
      kind: 'route_security_authority_input',
      middleware: middlewareFlow([middleware.value.value]),
      authorization: {
        kind: 'laravel_route_authorization_middleware_present',
        middleware: Object.freeze([middleware]),
      },
    });

    expect(judgment.security.isProtected.value).toBe(true);
    expect(judgment.auth.value).toBe(true);
    expect(judgment.contractVersion).toBe('route_security.v2');
  });
});


describe('Phase 2334 rejects independent authentication reclassification', () => {
  it('does not infer protection from raw middleware when the canonical judgment says absent', () => {
    const middleware = middlewareFlow(['auth:api']);
    const judgment = routeSecurityAuthority.resolve({
      kind: 'route_security_authority_input',
      middleware,
      authorization: {
        kind: 'laravel_route_authorization_middleware_absent',
        middleware: Object.freeze([]),
      },
    });

    expect(judgment.security.isProtected.value).toBe(false);
    expect(judgment.auth.value).toBe(false);
  });
});
