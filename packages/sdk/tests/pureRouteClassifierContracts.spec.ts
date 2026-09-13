import { describe, it, expect } from 'vitest'
import {
  ScannedRouteDescriptor,
  getRouteContract,
  CrudRole,
  ResourceGroupKind,
  type RouteManifest
} from '@routesync/core'
import {
  ScannedClassifiedRouteDescriptor,
  classifyRoutes,
  classifyDomainGraph,
  type ClassifiedRoute
} from '@routesync/cli/src/generators/route-classifier'

describe('Pure Route Classifier Contracts & Zero-Branching SSOT (Rule 8, 10, 11, & 12)', () => {
  describe('1. ScannedClassifiedRouteDescriptor Complete Contract & Factory', () => {
    it('requires complete non-nullable contract in constructor and freezes instance', () => {
      const raw = ScannedRouteDescriptor.create({
        method: 'GET',
        path: '/api/v1/products',
        resourceName: 'Product'
      })
      const contract = getRouteContract(raw)

      const route = new ScannedClassifiedRouteDescriptor({
        raw,
        contract,
        groupName: 'products',
        actionName: 'list',
        runtimePath: '/api/v1/products',
        method: 'GET',
        hasParams: false,
        hasTrailingParam: false,
        crudRole: CrudRole.Index
      })

      expect(route.raw).toBe(raw)
      expect(route.contract).toBe(contract)
      expect(route.groupName).toBe('products')
      expect(route.actionName).toBe('list')
      expect(route.runtimePath).toBe('/api/v1/products')
      expect(route.method).toBe('GET')
      expect(route.hasParams).toBe(false)
      expect(route.hasTrailingParam).toBe(false)
      expect(route.crudRole).toBe(CrudRole.Index)
      expect(Object.isFrozen(route)).toBe(true)
    })

    it('creates descriptor via static semantic factory .fromRoute with automatic contract derivation', () => {
      const raw = ScannedRouteDescriptor.create({
        method: 'POST',
        path: '/api/v1/products',
        resourceName: 'Product'
      })

      const route = ScannedClassifiedRouteDescriptor.fromRoute(raw, {
        groupName: 'products',
        actionName: 'create',
        runtimePath: '/api/v1/products',
        method: 'POST',
        hasParams: false,
        hasTrailingParam: false,
        crudRole: CrudRole.Create
      })

      expect(route.contract).toBeDefined()
      expect(route.contract.method).toBe('POST')
      expect(route.contract.runtimePath).toBe('/api/v1/products')
      expect(Object.isFrozen(route)).toBe(true)
    })
  })

  describe('2. Deterministic Route Classification (classifyRoutes)', () => {
    it('classifies REST routes into canonical crud roles and derives contracts at Origin Boundary', () => {
      const routes = [
        ScannedRouteDescriptor.create({ method: 'GET', path: '/api/articles', resourceName: 'Article' }),
        ScannedRouteDescriptor.create({ method: 'GET', path: '/api/articles/{id}', resourceName: 'Article' }),
        ScannedRouteDescriptor.create({ method: 'POST', path: '/api/articles', resourceName: 'Article' }),
        ScannedRouteDescriptor.create({ method: 'PUT', path: '/api/articles/{id}', resourceName: 'Article' }),
        ScannedRouteDescriptor.create({ method: 'DELETE', path: '/api/articles/{id}', resourceName: 'Article' })
      ]

      const classified = classifyRoutes(routes)
      expect(classified).toHaveLength(5)
      expect(classified.every(r => Object.isFrozen(r))).toBe(true)
      expect(classified.every(r => r.contract !== undefined)).toBe(true)

      const roles = classified.map(r => r.crudRole)
      expect(roles).toEqual([
        CrudRole.Index,
        CrudRole.Show,
        CrudRole.Create,
        CrudRole.Update,
        CrudRole.Delete
      ])
    })
  })

  describe('3. classifyDomainGraph Complete Partitioning', () => {
    it('partitions FullCrud group with unified type signatures and zero fallback', () => {
      const manifest: RouteManifest = {
        routes: [
          ScannedRouteDescriptor.create({ method: 'GET', path: '/api/users', resourceName: 'User' }),
          ScannedRouteDescriptor.create({ method: 'GET', path: '/api/users/{id}', resourceName: 'User' }),
          ScannedRouteDescriptor.create({ method: 'POST', path: '/api/users', resourceName: 'User' }),
          ScannedRouteDescriptor.create({ method: 'PUT', path: '/api/users/{id}', resourceName: 'User' }),
          ScannedRouteDescriptor.create({ method: 'DELETE', path: '/api/users/{id}', resourceName: 'User' })
        ],
        models: [],
        resources: [],
        requests: [],
        metadata: { version: '1.0', scanned_at: '2026-09-12', source_files: [] }
      }

      const graph = classifyDomainGraph(manifest)
      expect(graph.resourceGroups).toHaveLength(1)

      const group = graph.resourceGroups[0]
      expect(group.kind).toBe(ResourceGroupKind.FullCrud)
      expect(group.groupName).toBe('user')
      expect(group.primaryKeyType).toBe('number')
      expect(group.types.error).toBe('LaravelValidationError')
      expect(Object.isFrozen(group)).toBe(true)
    })

    it('partitions ReadOnlyCrud group when no mutations are present', () => {
      const manifest: RouteManifest = {
        routes: [
          ScannedRouteDescriptor.create({ method: 'GET', path: '/api/logs', resourceName: 'Log' }),
          ScannedRouteDescriptor.create({ method: 'GET', path: '/api/logs/{id}', resourceName: 'Log' })
        ],
        models: [],
        resources: [],
        requests: [],
        metadata: { version: '1.0', scanned_at: '2026-09-12', source_files: [] }
      }

      const graph = classifyDomainGraph(manifest)
      expect(graph.resourceGroups).toHaveLength(1)

      const group = graph.resourceGroups[0]
      expect(group.kind).toBe(ResourceGroupKind.ReadOnlyCrud)
      expect(group.types.create).toBe('never')
      expect(group.types.update).toBe('never')
    })

    it('partitions Singleton group when route has no trailing dynamic param', () => {
      const manifest: RouteManifest = {
        routes: [
          ScannedRouteDescriptor.create({ method: 'GET', path: '/api/profile', resourceName: 'Profile' }),
          ScannedRouteDescriptor.create({ method: 'POST', path: '/api/profile', resourceName: 'Profile' })
        ],
        models: [],
        resources: [],
        requests: [],
        metadata: { version: '1.0', scanned_at: '2026-09-12', source_files: [] }
      }

      const graph = classifyDomainGraph(manifest)
      expect(graph.resourceGroups).toHaveLength(1)

      const group = graph.resourceGroups[0]
      expect(group.kind).toBe(ResourceGroupKind.Singleton)
      expect(group.groupName).toBe('profile')
    })

    it('partitions Custom group when route has dynamic subresource trailing param', () => {
      const manifest: RouteManifest = {
        routes: [
          ScannedRouteDescriptor.create({ method: 'POST', path: '/api/orders/{orderId}/pay' })
        ],
        models: [],
        resources: [],
        requests: [],
        metadata: { version: '1.0', scanned_at: '2026-09-12', source_files: [] }
      }

      const graph = classifyDomainGraph(manifest)
      expect(graph.resourceGroups).toHaveLength(1)

      const group = graph.resourceGroups[0]
      expect(group.groupName).toBe('orders')
    })
  })
})
