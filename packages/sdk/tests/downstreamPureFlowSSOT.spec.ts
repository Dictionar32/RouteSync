import { describe, it, expect } from 'vitest'
import {
  RouteManifest,
  ScannedRouteDescriptor,
  ScannedRouteParameterDescriptor,
  RouteParameterType,
  ScannedRouteValidationRuleEntry,
  ScannedRouteSchemaPayload,
  ValidationRuleNodeFactory
} from '@routesync/core'
import { ConstantsGenerator } from '@routesync/cli/src/generators/ConstantsGenerator'

describe('Downstream Pure Flow SSOT', () => {
  it('1. ConstantsGenerator emits strongly-typed path parameter signatures from route.pathParameters', () => {
    const manifest: RouteManifest = {
      routes: [
        ScannedRouteDescriptor.create({
          method: 'GET',
          path: '/api/users/{id}',
          resourceName: 'User',
          actionName: 'show',
          actionKind: 'read',
          runtimePath: '/api/users/:id',
          pathParameters: [
            ScannedRouteParameterDescriptor.create({ name: 'id', type: RouteParameterType.Number })
          ]
        }),
        ScannedRouteDescriptor.create({
          method: 'GET',
          path: '/api/posts/{slug}',
          resourceName: 'Post',
          actionName: 'show',
          actionKind: 'read',
          runtimePath: '/api/posts/:slug',
          pathParameters: [
            ScannedRouteParameterDescriptor.create({ name: 'slug', type: RouteParameterType.String })
          ]
        })
      ],
      models: [],
      resources: [],
      enums: {},
      pages: {}
    }

    const lines = ConstantsGenerator.getConstantLines(manifest)
    const content = lines.join('\n')

    // Expect id: number for User
    expect(content).toContain('(id: number) => `/api/users/${id}`')
    // Expect slug: string for Post
    expect(content).toContain('(slug: string) => `/api/posts/${slug}`')
  })

  it('2. ConstantsGenerator extracts Enums directly from ValidationRuleKind.In AST and route.groupName', () => {
    const manifest: RouteManifest = {
      routes: [
        ScannedRouteDescriptor.create({
          method: 'POST',
          path: '/api/orders',
          resourceName: 'Order',
          groupName: 'orders',
          actionName: 'store',
          actionKind: 'create',
          schema: ScannedRouteSchemaPayload.fromRules([
            ScannedRouteValidationRuleEntry.create(
              'status',
              ['required', 'in:pending,processing,completed'],
              'status',
              [
                ValidationRuleNodeFactory.required(),
                ValidationRuleNodeFactory.in(['pending', 'processing', 'completed'])
              ]
            )
          ])
        })
      ],
      models: [],
      resources: [],
      enums: {},
      pages: {}
    }

    const lines = ConstantsGenerator.getConstantLines(manifest)
    const content = lines.join('\n')

    expect(content).toContain('export const Enums = {')
    expect(content).toContain('PENDING: \'pending\'')
    expect(content).toContain('PROCESSING: \'processing\'')
    expect(content).toContain('COMPLETED: \'completed\'')
  })
})
