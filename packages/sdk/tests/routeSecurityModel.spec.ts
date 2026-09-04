import { describe, it, expect } from 'vitest';
import { RouteSecurityClassifier, SecuritySchemeKind, ScannedRouteDescriptor, RouteActionKind, VoidResponseDescriptor } from '@routesync/core';

describe('RouteSecurity Explicit Model Suite', () => {
  it('1. Classifies auth:sanctum as Sanctum security scheme', () => {
    const sec = RouteSecurityClassifier.classify(['auth:sanctum', 'throttle:60,1']);
    expect(sec.isProtected).toBe(true);
    expect(sec.scheme).toBe(SecuritySchemeKind.Sanctum);
    expect(sec.guards).toContain('sanctum');
  });

  it('2. Classifies auth:api as Bearer token security scheme', () => {
    const sec = RouteSecurityClassifier.classify(['auth:api']);
    expect(sec.isProtected).toBe(true);
    expect(sec.scheme).toBe(SecuritySchemeKind.Bearer);
    expect(sec.guards).toContain('api');
  });

  it('3. Classifies standard web auth as Cookie session security scheme', () => {
    const sec = RouteSecurityClassifier.classify(['web', 'auth']);
    expect(sec.isProtected).toBe(true);
    expect(sec.scheme).toBe(SecuritySchemeKind.Cookie);
    expect(sec.guards).toContain('web');
  });

  it('4. Classifies public routes with no auth middleware as Public', () => {
    const sec = RouteSecurityClassifier.classify(['api', 'throttle:60,1']);
    expect(sec.isProtected).toBe(false);
    expect(sec.scheme).toBe(SecuritySchemeKind.Public);
    expect(sec.guards).toHaveLength(0);
  });

  it('5. Automatically resolves RouteSecurityDescriptor on ScannedRouteDescriptor', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/checkout',
      resourceName: 'checkout',
      actionName: 'store',
      actionKind: RouteActionKind.Create,
      isMutating: true,
      middleware: ['auth:sanctum'],
      response: new VoidResponseDescriptor()
    });

    expect(route.security).toBeDefined();
    expect(route.security.isProtected).toBe(true);
    expect(route.security.scheme).toBe(SecuritySchemeKind.Sanctum);
    expect(route.auth).toBe(true);
  });
});
