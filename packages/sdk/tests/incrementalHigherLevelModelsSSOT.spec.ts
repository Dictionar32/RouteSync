/**
 * incrementalHigherLevelModelsSSOT.spec.ts
 *
 * Comprehensive Level 7 SSOT Regression Suite for Incremental Scanner Models.
 * Tests:
 * 1. Nominal Branded Atoms creation & normalization (ScannedRouteMethod, ScannedRoutePath, etc.)
 * 2. ScannedRouteDescriptor Complete Contract (0 ?, 0 null, entry tuples, backward-compat facade)
 * 3. ScannedResourceDescriptor Complete Contract & semantic factories (.create(), .empty(), .fromRaw())
 * 4. ScannedManifestDescriptor Complete Contract & composition
 * 5. Catamorphic matchRouteResponsePayload ADT eliminator (0 if, 0 switch)
 * 6. Deterministic integration with calculateRouteHash and resolveManifestIncrementally
 */

import { describe, it, expect } from 'vitest';
import {
  NominalAtomFactory,
  matchRouteResponsePayload,
  type RouteResponsePayloadContract,
  ScannedRouteDescriptor,
  ScannedResourceDescriptor,
  ScannedManifestDescriptor,
  calculateRouteHash,
  resolveManifestIncrementally
} from '@routesync/cli';

describe('Level 7 Higher-Level Domain Models for Incremental Scanner (SSOT)', () => {
  describe('Nominal Branded Atoms & Factory', () => {
    it('normalizes HTTP methods, paths, and line numbers into branded atoms', () => {
      const method = NominalAtomFactory.method('post ');
      const path = NominalAtomFactory.path('users/profile');
      const name = NominalAtomFactory.name(' users.profile ');
      const hash = NominalAtomFactory.stableHash(' abc123def456 ');
      const file = NominalAtomFactory.sourceFile(' routes/api.php ');
      const line = NominalAtomFactory.sourceLine(42.8);

      expect(method).toBe('POST');
      expect(path).toBe('/users/profile');
      expect(name).toBe('users.profile');
      expect(hash).toBe('abc123def456');
      expect(file).toBe('routes/api.php');
      expect(line).toBe(42);
    });

    it('handles fallback defaults gracefully for nominal atoms', () => {
      expect(NominalAtomFactory.method('')).toBe('GET');
      expect(NominalAtomFactory.path('')).toBe('/');
      expect(NominalAtomFactory.sourceLine(0)).toBe(1);
      expect(NominalAtomFactory.sourceLine(-5)).toBe(1);
      expect(NominalAtomFactory.sourceLine(undefined)).toBe(1);
    });
  });

  describe('ScannedRouteDescriptor & Complete Contracts', () => {
    it('constructs a complete route contract with entry tuples and facade accessors', () => {
      const route = ScannedRouteDescriptor.create({
        method: 'GET',
        path: '/api/users',
        auth: true,
        name: 'users.index',
        schema: { page: 'number', limit: 'number' },
        response: { kind: 'array', element: { kind: 'resource', resource: 'UserResource' } },
        assignments: { '$users': 'User::all()' },
        sourceFile: 'routes/api.php',
        sourceLine: 25
      });

      // Complete Contract verification
      expect(route.method).toBe('GET');
      expect(route.path).toBe('/api/users');
      expect(route.auth).toBe(true);
      expect(route.name).toBe('users.index');
      expect(route.schemaEntries).toEqual([['page', 'number'], ['limit', 'number']]);
      expect(route.assignmentEntries).toEqual([['$users', 'User::all()']]);
      expect(route.source.file).toBe('routes/api.php');
      expect(route.source.line).toBe(25);

      // Backward-compatible facade properties
      expect(route.sourceFile).toBe('routes/api.php');
      expect(route.sourceLine).toBe(25);
      expect(route.schema).toEqual({ page: 'number', limit: 'number' });
      expect(route.assignments).toEqual({ '$users': 'User::all()' });
    });

    it('creates empty routes and parses raw route objects', () => {
      const emptyRoute = ScannedRouteDescriptor.empty();
      expect(emptyRoute.method).toBe('GET');
      expect(emptyRoute.path).toBe('/');
      expect(emptyRoute.schemaEntries).toEqual([]);
      expect(emptyRoute.assignmentEntries).toEqual([]);

      const rawRoute = ScannedRouteDescriptor.fromRaw({
        method: 'delete',
        path: 'orders/1'
      });
      expect(rawRoute.method).toBe('DELETE');
      expect(rawRoute.path).toBe('/orders/1');
    });
  });

  describe('ScannedResourceDescriptor & Complete Contracts', () => {
    it('constructs a complete resource contract with field entries and model binding', () => {
      const res = ScannedResourceDescriptor.create({
        name: 'UserResource',
        model: 'User',
        fields: { id: 'number', email: 'string' },
        assignments: { '$profile': '$this->profile' },
        sourceFile: 'app/Http/Resources/UserResource.php',
        sourceLine: 10
      });

      expect(res.name).toBe('UserResource');
      expect(res.model).toBe('User');
      expect(res.fieldEntries).toEqual([['id', 'number'], ['email', 'string']]);
      expect(res.assignmentEntries).toEqual([['$profile', '$this->profile']]);
      expect(res.source.file).toBe('app/Http/Resources/UserResource.php');
      expect(res.source.line).toBe(10);

      // Facade compatibility
      expect(res.fields).toEqual({ id: 'number', email: 'string' });
      expect(res.assignments).toEqual({ '$profile': '$this->profile' });
      expect(res.sourceFile).toBe('app/Http/Resources/UserResource.php');
      expect(res.sourceLine).toBe(10);
    });

    it('handles empty and raw resources', () => {
      const emptyRes = ScannedResourceDescriptor.empty();
      expect(emptyRes.name).toBe('EmptyResource');
      expect(emptyRes.fieldEntries).toEqual([]);

      const rawRes = ScannedResourceDescriptor.fromRaw({ name: 'OrderResource', model: 'Order' });
      expect(rawRes.name).toBe('OrderResource');
      expect(rawRes.model).toBe('Order');
    });
  });

  describe('ScannedManifestDescriptor', () => {
    it('assembles routes, models, and resources into a unified manifest descriptor', () => {
      const manifest = ScannedManifestDescriptor.create({
        routes: [{ method: 'GET', path: '/health' }],
        models: [{ name: 'User', accessors: { fullName: { type: 'string' } } }],
        resources: [{ name: 'UserResource', model: 'User' }]
      });

      expect(manifest.routes).toHaveLength(1);
      expect(manifest.routes[0]).toBeInstanceOf(ScannedRouteDescriptor);
      expect(manifest.routes[0].path).toBe('/health');

      expect(manifest.models).toHaveLength(1);
      expect(manifest.models[0].name).toBe('User');

      expect(manifest.resources).toHaveLength(1);
      expect(manifest.resources[0]).toBeInstanceOf(ScannedResourceDescriptor);
      expect(manifest.resources[0].name).toBe('UserResource');
    });
  });

  describe('Catamorphic Response Payload Eliminator (matchRouteResponsePayload)', () => {
    it('exhaustively matches all response payload variants with 0 if / 0 switch', () => {
      const payloads: RouteResponsePayloadContract[] = [
        { kind: 'primitive', type: 'string' },
        { kind: 'object', fieldEntries: [['status', 'ok']] },
        { kind: 'array', element: { kind: 'primitive', type: 'number' } },
        { kind: 'resource', resourceName: 'ProductResource', modelName: 'Product', isCollection: false },
        { kind: 'unknown', raw: 'custom' }
      ];

      const visitor = {
        primitive: (p: { kind: 'primitive'; type: string }) => `prim:${p.type}`,
        object: (o: { kind: 'object'; fieldEntries: readonly (readonly [string, unknown])[] }) => `obj:${o.fieldEntries.length}`,
        array: (a: { kind: 'array'; element: RouteResponsePayloadContract }) => `arr:${a.element.kind}`,
        resource: (r: { kind: 'resource'; resourceName: string }) => `res:${r.resourceName}`,
        unknown: (u: { kind: 'unknown'; raw: unknown }) => `unk:${String(u.raw)}`
      };

      const results = payloads.map(p => matchRouteResponsePayload(p, visitor));
      expect(results).toEqual([
        'prim:string',
        'obj:1',
        'arr:primitive',
        'res:ProductResource',
        'unk:custom'
      ]);
    });
  });

  describe('Integration with Route Hasher & Incremental Pipeline', () => {
    it('calculates deterministic hashes from ScannedRouteDescriptor instances', () => {
      const route1 = ScannedRouteDescriptor.create({ method: 'GET', path: '/api/v1/posts', auth: false });
      const route2 = ScannedRouteDescriptor.create({ method: 'GET', path: '/api/v1/posts', auth: false });
      const route3 = ScannedRouteDescriptor.create({ method: 'POST', path: '/api/v1/posts', auth: true });

      const hash1 = calculateRouteHash(route1);
      const hash2 = calculateRouteHash(route2);
      const hash3 = calculateRouteHash(route3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('seamlessly works with resolveManifestIncrementally', () => {
      const route = ScannedRouteDescriptor.create({
        method: 'GET',
        path: '/items',
        auth: false,
        response: { kind: 'primitive', type: 'string' }
      });

      const manifest = {
        routes: [route],
        models: [],
        resources: []
      };

      const dummyKernel = {
        resolve: () => ({ status: 'unknown' })
      };

      const result = resolveManifestIncrementally(
        manifest,
        '/non/existent/path/routesync.manifest.json',
        dummyKernel,
        []
      );

      expect(result.manifest.routes).toBeDefined();
      expect(result.manifest.routes![0].stableHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
