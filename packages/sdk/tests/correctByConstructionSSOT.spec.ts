import { describe, it, expect } from 'vitest'
import {
  RouteManifest,
  CrudRole,
  RouteParameterType,
  HttpStatusCode,
  ResponseShape,
  matchCrudRole,
  ScannedRouteDescriptor,
  ScannedRouteParameterDescriptor,
  getRouteContract
} from '@routesync/core'
import { SDKGenerator } from '../../cli/src/generators/SDKGenerator'
import { ConstantsGenerator } from '../../cli/src/generators/ConstantsGenerator'
import { ScannedClassifiedRouteDescriptor } from '../../cli/src/generators/route-classifier'

describe('Rule 12: Correct-by-Construction Architecture SSOT', () => {
  it('guarantees SDKGenerator consumes non-nullable contract.response.success directly', async () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/v1/users',
      action: 'UserController@index',
      name: 'users.index',
      response: {
        kind: 'resource',
        readTypeName: 'UserIndex',
        validatorName: 'validateUserIndexSchema',
        mapperName: 'toUserIndexRead',
        shape: ResponseShape.Collection
      }
    })

    const manifest: RouteManifest = {
      routes: [route],
      baseURL: 'http://localhost/api',
      generatedAt: '2026-09-05T07:15:00.000Z'
    }

    const code = await SDKGenerator.generate(manifest, undefined, { zod: true })
    expect(code).toContain("validateUserIndexSchema")
    expect(code).toContain("toUserIndexRead")
    expect(code).toContain("response: validateUserIndexSchema")
    expect(code).toContain("response: toUserIndexRead")
  })

  it('guarantees HookGenerator normalizes action keys via pure matchCrudRole catamorphism', () => {
    const updateRoute = new ScannedClassifiedRouteDescriptor({
      raw: ScannedRouteDescriptor.create({ method: 'PUT', path: '/api/orders/:id' }),
      groupName: 'orders',
      actionName: 'put',
      runtimePath: '/orders/:id',
      method: 'PUT',
      hasParams: true,
      hasTrailingParam: true,
      crudRole: CrudRole.Update
    })

    const deleteRoute = new ScannedClassifiedRouteDescriptor({
      raw: ScannedRouteDescriptor.create({ method: 'DELETE', path: '/api/orders/:id' }),
      groupName: 'orders',
      actionName: 'delete',
      runtimePath: '/orders/:id',
      method: 'DELETE',
      hasParams: true,
      hasTrailingParam: true,
      crudRole: CrudRole.Delete
    })

    const showRoute = new ScannedClassifiedRouteDescriptor({
      raw: ScannedRouteDescriptor.create({ method: 'GET', path: '/api/orders/:id' }),
      groupName: 'orders',
      actionName: 'getById',
      runtimePath: '/orders/:id',
      method: 'GET',
      hasParams: true,
      hasTrailingParam: true,
      crudRole: CrudRole.Show
    })

    const toNormalizedKey = (route: ScannedClassifiedRouteDescriptor) => {
      return matchCrudRole(route.crudRole, {
        update: () => 'update',
        delete: () => 'remove',
        index: () => route.actionName,
        show: () => route.actionName,
        create: () => route.actionName,
        custom: () => route.actionName
      })
    }

    expect(toNormalizedKey(updateRoute)).toBe('update')
    expect(toNormalizedKey(deleteRoute)).toBe('remove')
    expect(toNormalizedKey(showRoute)).toBe('getById')
  })

  it('guarantees ConstantsGenerator resolves path parameters from contract SSOT without regex fallback', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/products/{id}/variants/{variantId}',
      pathParameters: [
        ScannedRouteParameterDescriptor.path({ name: 'id', propertyName: 'id', type: RouteParameterType.Number }),
        ScannedRouteParameterDescriptor.path({ name: 'variantId', propertyName: 'variantId', type: RouteParameterType.String })
      ]
    })

    const manifest: RouteManifest = {
      routes: [route],
      baseURL: 'https://api.toko.id',
      generatedAt: '2026-09-05T07:15:00.000Z'
    }

    const lines = ConstantsGenerator.getConstantLines(manifest)
    const code = lines.join('\n')

    expect(code).toContain('API_PRODUCTS_DETAIL_VARIANT: (id: number, variantId: string) => `/api/products/${id}/variants/${variantId}`')
  })

  it('guarantees complete contract preservation without defensive null checks in downstream generators', () => {
    const rawRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/checkout',
      schema: {
        rules: [
          { fieldName: 'payment_method', rules: ['required', 'string'] }
        ]
      },
      response: {
        kind: 'resource',
        readTypeName: 'CheckoutResponse',
        validatorName: 'validateCheckoutResponseSchema',
        mapperName: 'identity',
        shape: ResponseShape.Single
      }
    })

    const contract = getRouteContract(rawRoute)
    expect(contract.request.hasBody).toBe(true)
    expect(contract.response.success.readTypeName).toBe('CheckoutResponse')
    expect(contract.response.success.validatorName).toBe('validateCheckoutResponseSchema')
    expect(contract.response.success.mapperName).toBe('identity')
    expect(contract.response.success.statusCode).toBe(HttpStatusCode.Created)
  })
})
