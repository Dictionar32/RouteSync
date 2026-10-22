import { describe, expect, it } from 'vitest';
import { laravelRouteDeclarationMethodSemanticAuthority } from '../laravelRouteDeclarationMethodSemanticAuthority';
import { HttpMethod } from '../routeExecutionVocabulary';

describe('phase2350 canonical route method judgment', () => {
  it('distinguishes any-method declarations before route projection', () => {
    expect(laravelRouteDeclarationMethodSemanticAuthority.judge({ method: 'any', targetMethods: [] })).toEqual({
      kind: 'laravel_route_declaration_method_all_methods',
      method: 'any',
      httpMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE, HttpMethod.OPTIONS, HttpMethod.HEAD, HttpMethod.QUERY],
    });
  });

  it('distinguishes match declarations before route projection', () => {
    expect(laravelRouteDeclarationMethodSemanticAuthority.judge({ method: 'match', targetMethods: ['get', 'post'] })).toEqual({
      kind: 'laravel_route_declaration_method_match',
      method: 'match',
      targetMethods: ['get', 'post'],
      httpMethods: [HttpMethod.GET, HttpMethod.POST],
    });
  });

  it('gives Laravel QUERY its own closed judgment arm', () => {
    expect(laravelRouteDeclarationMethodSemanticAuthority.judge({ method: 'query', targetMethods: ['query'] })).toEqual({
      kind: 'laravel_route_declaration_method_query',
      method: 'query',
      httpMethods: [HttpMethod.QUERY],
    });
  });

  it('keeps standard HTTP methods in the standard arm', () => {
    expect(laravelRouteDeclarationMethodSemanticAuthority.judge({ method: 'get', targetMethods: ['get'] })).toEqual({
      kind: 'laravel_route_declaration_method_standard',
      method: 'get',
      httpMethods: [HttpMethod.GET],
    });
  });

  it('keeps resource expansion distinct from standard routes', () => {
    expect(laravelRouteDeclarationMethodSemanticAuthority.judge({ method: 'apiResource', targetMethods: [] })).toEqual({
      kind: 'laravel_route_declaration_method_resource',
      method: 'apiResource',
    });
  });
});
