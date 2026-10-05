/**
 * incrementalHigherLevelModelsSSOT.spec.ts
 *
 * Comprehensive Level 7 SSOT Regression Suite for Incremental Scanner Models.
 * Tests:
 * 1. Nominal Branded Atoms creation & normalization (RouteSemanticFlowMethod, RouteSemanticFlowPath, etc.)
 * 3. ScannedResourceDescriptor Complete Contract & semantic factories (.create(), .empty(), .fromRaw())
 * 5. Catamorphic matchRouteResponsePayload ADT eliminator (0 if, 0 switch)
 */

import { describe, it, expect } from 'vitest';
import {
  NominalAtomFactory,
  matchRouteResponsePayload,
  type RouteResponsePayloadContract,
  ScannedResourceDescriptor
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


});
