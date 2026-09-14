import { describe, it, expect } from 'vitest';
import {
  RouteBoundaryContractFactory,
  RouteBoundaryAdapter,
  ScannedRouteDescriptor,
  type RouteBoundaryContract,
  type RouteBoundaryOptions
} from '@routesync/core';

describe('Route Boundary Hardening & Level 7 Contract SSOT (Issue #45)', () => {
  it('RouteBoundaryContractFactory produces 100% frozen, non-nullable RouteBoundaryContract from minimal options', () => {
    const options: RouteBoundaryOptions = {
      method: 'GET',
      path: '/api/v1/users'
    };

    const contract: RouteBoundaryContract = RouteBoundaryContractFactory.create(options);

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.method).toBe('GET');
    expect(contract.path).toBe('/api/v1/users');
    expect(contract.domain).toBe('users');
    expect(contract.resourceName).toBe('users');
    expect(contract.groupName).toBe('users');
    expect(contract.constantKey).toBe('API_V1_USERS');
    expect(contract.actionKind).toBe('read');
    expect(contract.isMutating).toBe(false);
    expect(contract.hookKind).toBe('query');
    expect(contract.crudRole).toBe('index');
    expect(contract.auth).toBe(false);
    expect(Array.isArray(contract.middleware)).toBe(true);
    expect(Array.isArray(contract.parameters)).toBe(true);
    expect(Array.isArray(contract.pathParameters)).toBe(true);
    expect(Array.isArray(contract.queryParameters)).toBe(true);
    expect(contract.schema).toBeDefined();
    expect(contract.handler).toBeDefined();
  });

  it('RouteBoundaryContractFactory properly resolves mutating routes and sets defaults', () => {
    const options: RouteBoundaryOptions = {
      method: 'POST',
      path: '/api/v1/orders',
      auth: true,
      middleware: ['auth:sanctum']
    };

    const contract = RouteBoundaryContractFactory.create(options);

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.method).toBe('POST');
    expect(contract.actionKind).toBe('create');
    expect(contract.isMutating).toBe(true);
    expect(contract.hookKind).toBe('mutation');
    expect(contract.crudRole).toBe('create');
    expect(contract.auth).toBe(true);
    expect(contract.middleware).toEqual(['auth:sanctum']);
    expect(contract.requestContentType).toBe('application/json');
  });

  it('RouteBoundaryAdapter builds ScannedRouteDescriptor via fromBoundary and fromSparse seamlessly', () => {
    const contract = RouteBoundaryContractFactory.create({
      method: 'GET',
      path: '/api/v1/products/{id}',
      action: 'ProductController@show'
    });

    const routeFromBoundary: ScannedRouteDescriptor = RouteBoundaryAdapter.fromBoundary(contract);
    expect(routeFromBoundary).toBeDefined();
    expect(routeFromBoundary.method).toBe('GET');
    expect(routeFromBoundary.path).toBe('/api/v1/products/{id}');
    expect(routeFromBoundary.controllerName).toBe('ProductController');
    expect(routeFromBoundary.actionName).toBe('show');

    const routeFromSparse: ScannedRouteDescriptor = RouteBoundaryAdapter.fromSparse({
      method: 'GET',
      path: '/api/v1/products/{id}',
      action: 'ProductController@show'
    });
    expect(routeFromSparse).toBeDefined();
    expect(routeFromSparse.controllerName).toBe('ProductController');
    expect(routeFromSparse.actionName).toBe('show');
  });
});
