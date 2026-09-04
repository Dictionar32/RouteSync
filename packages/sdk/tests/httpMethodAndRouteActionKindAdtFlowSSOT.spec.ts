import { describe, test, expect } from 'vitest'
import {
  HttpMethod,
  HTTP_METHOD_REGISTRY,
  matchHttpMethod,
  HttpMethodVisitor,
  RouteActionKind,
  ROUTE_ACTION_KIND_REGISTRY,
  matchRouteActionKind,
  RouteActionKindVisitor
} from '../../core/src'

describe('HttpMethod & RouteActionKind ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchHttpMethod executes pure catamorphism for safe HTTP methods (GET, OPTIONS, HEAD)', () => {
    const visitor: HttpMethodVisitor<string> = {
      GET: (spec) => `SAFE:${spec.method}:${spec.isSafe}:${spec.actionKind}`,
      OPTIONS: (spec) => `SAFE:${spec.method}:${spec.isSafe}:${spec.actionKind}`,
      HEAD: (spec) => `SAFE:${spec.method}:${spec.isSafe}:${spec.actionKind}`,
      POST: () => 'MUTATING',
      PUT: () => 'MUTATING',
      PATCH: () => 'MUTATING',
      DELETE: () => 'MUTATING'
    }

    expect(matchHttpMethod(HttpMethod.GET, visitor)).toBe('SAFE:GET:true:read')
    expect(matchHttpMethod(HttpMethod.OPTIONS, visitor)).toBe('SAFE:OPTIONS:true:read')
    expect(matchHttpMethod(HttpMethod.HEAD, visitor)).toBe('SAFE:HEAD:true:read')
  })

  test('2. matchHttpMethod executes pure catamorphism for mutating HTTP methods (POST, PUT, PATCH, DELETE)', () => {
    const visitor: HttpMethodVisitor<string> = {
      GET: () => 'SAFE',
      OPTIONS: () => 'SAFE',
      HEAD: () => 'SAFE',
      POST: (spec) => `MUT:${spec.method}:${spec.isIdempotent}:${spec.hasBody}`,
      PUT: (spec) => `MUT:${spec.method}:${spec.isIdempotent}:${spec.hasBody}`,
      PATCH: (spec) => `MUT:${spec.method}:${spec.isIdempotent}:${spec.hasBody}`,
      DELETE: (spec) => `MUT:${spec.method}:${spec.isIdempotent}:${spec.hasBody}`
    }

    expect(matchHttpMethod(HttpMethod.POST, visitor)).toBe('MUT:POST:false:true')
    expect(matchHttpMethod(HttpMethod.PUT, visitor)).toBe('MUT:PUT:true:true')
    expect(matchHttpMethod(HttpMethod.PATCH, visitor)).toBe('MUT:PATCH:false:true')
    expect(matchHttpMethod(HttpMethod.DELETE, visitor)).toBe('MUT:DELETE:true:false')
  })

  test('3. matchHttpMethod accepts route objects and case-insensitive strings', () => {
    const route = { method: HttpMethod.POST, path: '/api/orders' }

    const resultFromObj = matchHttpMethod(route, {
      GET: () => 'READ',
      POST: () => 'MUTATE_POST',
      PUT: () => 'MUTATE_PUT',
      PATCH: () => 'MUTATE_PATCH',
      DELETE: () => 'MUTATE_DELETE',
      OPTIONS: () => 'OPTIONS',
      HEAD: () => 'HEAD'
    })
    expect(resultFromObj).toBe('MUTATE_POST')

    const resultFromLowerStr = matchHttpMethod('post', {
      GET: () => 'READ',
      POST: () => 'MUTATE_POST',
      PUT: () => 'MUTATE_PUT',
      PATCH: () => 'MUTATE_PATCH',
      DELETE: () => 'MUTATE_DELETE',
      OPTIONS: () => 'OPTIONS',
      HEAD: () => 'HEAD'
    })
    expect(resultFromLowerStr).toBe('MUTATE_POST')
  })

  test('4. HTTP_METHOD_REGISTRY provides frozen O(1) specifications for all 7 HTTP methods', () => {
    expect(Object.isFrozen(HTTP_METHOD_REGISTRY)).toBe(true)

    const allMethods: readonly HttpMethod[] = Object.values(HttpMethod)
    expect(allMethods.length).toBe(7)

    for (const method of allMethods) {
      const spec = HTTP_METHOD_REGISTRY[method]
      expect(spec).toBeDefined()
      expect(spec.method).toBe(method)
      expect(typeof spec.isMutating).toBe('boolean')
      expect(typeof spec.isSafe).toBe('boolean')
      expect(typeof spec.isIdempotent).toBe('boolean')
      expect(typeof spec.hasBody).toBe('boolean')
      expect(typeof spec.actionKind).toBe('string')
      expect(typeof spec.defaultCrudRole).toBe('string')
      expect(typeof spec.description).toBe('string')
    }

    // Safety and idempotency contract checks
    expect(HTTP_METHOD_REGISTRY[HttpMethod.GET].isSafe).toBe(true)
    expect(HTTP_METHOD_REGISTRY[HttpMethod.GET].isIdempotent).toBe(true)
    expect(HTTP_METHOD_REGISTRY[HttpMethod.POST].isSafe).toBe(false)
    expect(HTTP_METHOD_REGISTRY[HttpMethod.POST].isIdempotent).toBe(false)
    expect(HTTP_METHOD_REGISTRY[HttpMethod.PUT].isIdempotent).toBe(true)
    expect(HTTP_METHOD_REGISTRY[HttpMethod.DELETE].isIdempotent).toBe(true)
  })

  test('5. matchRouteActionKind executes pure catamorphism for all 4 action kinds', () => {
    const visitor: RouteActionKindVisitor<string> = {
      create: (spec) => `ACTION:${spec.actionKind}:${spec.defaultMethod}`,
      update: (spec) => `ACTION:${spec.actionKind}:${spec.defaultMethod}`,
      read: (spec) => `ACTION:${spec.actionKind}:${spec.defaultMethod}`,
      delete: (spec) => `ACTION:${spec.actionKind}:${spec.defaultMethod}`
    }

    expect(matchRouteActionKind(RouteActionKind.Create, visitor)).toBe('ACTION:create:POST')
    expect(matchRouteActionKind(RouteActionKind.Update, visitor)).toBe('ACTION:update:PUT')
    expect(matchRouteActionKind(RouteActionKind.Read, visitor)).toBe('ACTION:read:GET')
    expect(matchRouteActionKind(RouteActionKind.Delete, visitor)).toBe('ACTION:delete:DELETE')
  })

  test('6. ROUTE_ACTION_KIND_REGISTRY provides frozen O(1) specifications for all 4 action kinds', () => {
    expect(Object.isFrozen(ROUTE_ACTION_KIND_REGISTRY)).toBe(true)

    const allKinds: readonly RouteActionKind[] = Object.values(RouteActionKind)
    expect(allKinds.length).toBe(4)

    for (const kind of allKinds) {
      const spec = ROUTE_ACTION_KIND_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.actionKind).toBe(kind)
      expect(typeof spec.isMutating).toBe('boolean')
      expect(spec.defaultMethod).toBeDefined()
      expect(typeof spec.defaultCrudRole).toBe('string')
      expect(typeof spec.description).toBe('string')
    }

    expect(ROUTE_ACTION_KIND_REGISTRY[RouteActionKind.Read].isMutating).toBe(false)
    expect(ROUTE_ACTION_KIND_REGISTRY[RouteActionKind.Create].isMutating).toBe(true)
    expect(ROUTE_ACTION_KIND_REGISTRY[RouteActionKind.Update].isMutating).toBe(true)
    expect(ROUTE_ACTION_KIND_REGISTRY[RouteActionKind.Delete].isMutating).toBe(true)
  })

  test('7. Zero-if pipeline for hook selection from HTTP methods', () => {
    const routes = [
      { path: '/api/orders', method: HttpMethod.GET },
      { path: '/api/orders', method: HttpMethod.POST },
      { path: '/api/orders/{id}', method: HttpMethod.PUT },
      { path: '/api/orders/{id}', method: HttpMethod.DELETE }
    ]

    const hookTypes = routes.map(r => {
      const spec = HTTP_METHOD_REGISTRY[r.method]
      return spec.isMutating ? 'useMutation' : 'useQuery'
    })

    expect(hookTypes).toEqual([
      'useQuery',
      'useMutation',
      'useMutation',
      'useMutation'
    ])
  })
})
