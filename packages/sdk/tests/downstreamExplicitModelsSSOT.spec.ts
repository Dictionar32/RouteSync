import { describe, it, expect } from 'vitest'
import {
  RouteHookKind,
  RoutePayloadMode,
  SdkResponseKind,
  InvalidationTargetKind,
  ScannedInvalidationTarget,
  ScannedRouteCacheInvalidationDescriptor,
  ScannedRouteExecutionSignature,
  ScannedSdkResponseResolution,
  ScannedRouteDescriptor,
  StaticLaravelScanner,
  ParsedRoute,
  ParsedModel,
  ResourceRouteGroup,
  ScannedResourceRouteGroupDescriptor,
  ScannedModelDescriptor,
  ResourceResponseDescriptor,
  ResponseShape
} from '../../core/src'

describe('Downstream Explicit Models & Origin Boundary SSOT', () => {
  it('1. Enums are frozen and possess canonical values', () => {
    expect(Object.isFrozen(RouteHookKind)).toBe(true)
    expect(RouteHookKind.Query).toBe('query')
    expect(RouteHookKind.Mutation).toBe('mutation')

    expect(Object.isFrozen(RoutePayloadMode)).toBe(true)
    expect(RoutePayloadMode.None).toBe('none')
    expect(RoutePayloadMode.Required).toBe('required')
    expect(RoutePayloadMode.Optional).toBe('optional')

    expect(Object.isFrozen(SdkResponseKind)).toBe(true)
    expect(SdkResponseKind.Void).toBe('void')
    expect(SdkResponseKind.Raw).toBe('raw')
    expect(SdkResponseKind.Validated).toBe('validated')
    expect(SdkResponseKind.Mapped).toBe('mapped')
    expect(SdkResponseKind.ValidatedAndMapped).toBe('validated_and_mapped')

    expect(Object.isFrozen(InvalidationTargetKind)).toBe(true)
    expect(InvalidationTargetKind.SelfList).toBe('self_list')
    expect(InvalidationTargetKind.ParentList).toBe('parent_list')
    expect(InvalidationTargetKind.ParentDetail).toBe('parent_detail')
    expect(InvalidationTargetKind.AuthResource).toBe('auth_resource')
  })

  it('2. ScannedInvalidationTarget computes deterministic QueryKey expressions via factory methods', () => {
    const self = ScannedInvalidationTarget.selfList('orders')
    expect(self.groupName).toBe('orders')
    expect(self.kind).toBe(InvalidationTargetKind.SelfList)
    expect(self.queryKeyExpression).toBe('QueryKey.orders.all')
    expect(Object.isFrozen(self)).toBe(true)

    const parentList = ScannedInvalidationTarget.parentList('users')
    expect(parentList.queryKeyExpression).toBe('QueryKey.users.lists')

    const parentDetail = ScannedInvalidationTarget.parentDetail('users')
    expect(parentDetail.queryKeyExpression).toBe('QueryKey.users.detail')

    const auth = ScannedInvalidationTarget.authResource('profile')
    expect(auth.queryKeyExpression).toBe('QueryKey.profile.all')
  })

  it('3. ScannedRouteCacheInvalidationDescriptor handles empty and target collections without null or undefined', () => {
    const empty = ScannedRouteCacheInvalidationDescriptor.empty()
    expect(empty.targets).toEqual([])
    expect(empty.queryKeyExpressions).toEqual([])
    expect(Object.isFrozen(empty)).toBe(true)
    expect(Object.isFrozen(empty.targets)).toBe(true)
    expect(Object.isFrozen(empty.queryKeyExpressions)).toBe(true)

    const targets = [
      ScannedInvalidationTarget.selfList('orders'),
      ScannedInvalidationTarget.parentList('users')
    ]
    const descriptor = ScannedRouteCacheInvalidationDescriptor.fromTargets(targets)
    expect(descriptor.targets.length).toBe(2)
    expect(descriptor.queryKeyExpressions).toEqual([
      'QueryKey.orders.all',
      'QueryKey.users.lists'
    ])
    expect(Object.isFrozen(descriptor)).toBe(true)
  })

  it('4. ScannedRouteExecutionSignature exposes typed factory methods for each payload mode', () => {
    const noPayload = ScannedRouteExecutionSignature.noPayload()
    expect(noPayload.payloadMode).toBe(RoutePayloadMode.None)
    expect(noPayload.parameterDeclaration).toBe('')
    expect(noPayload.callArgumentsExpression).toBe('')
    expect(Object.isFrozen(noPayload)).toBe(true)

    const required = ScannedRouteExecutionSignature.requiredPayload('OrderForm')
    expect(required.payloadMode).toBe(RoutePayloadMode.Required)
    expect(required.parameterDeclaration).toBe('payload: OrderForm')
    expect(required.callArgumentsExpression).toBe('payload')

    const optional = ScannedRouteExecutionSignature.optionalPayload('OrderForm')
    expect(optional.payloadMode).toBe(RoutePayloadMode.Optional)
    expect(optional.parameterDeclaration).toBe('payload: OrderForm = {}')
    expect(optional.callArgumentsExpression).toBe('payload')
  })

  it('5. ScannedSdkResponseResolution represents all 5 response kinds without nullable types', () => {
    const voidRes = ScannedSdkResponseResolution.voidResponse()
    expect(voidRes.kind).toBe(SdkResponseKind.Void)
    expect(voidRes.type).toBe('void')
    expect(voidRes.hasSchema).toBe(false)
    expect(voidRes.hasMapper).toBe(false)

    const raw = ScannedSdkResponseResolution.raw('OrderResponse')
    expect(raw.kind).toBe(SdkResponseKind.Raw)
    expect(raw.type).toBe('OrderResponse')
    expect(raw.hasSchema).toBe(false)
    expect(raw.hasMapper).toBe(false)

    const validated = ScannedSdkResponseResolution.validated('OrderResponse', 'OrderSchema')
    expect(validated.kind).toBe(SdkResponseKind.Validated)
    expect(validated.hasSchema).toBe(true)
    expect(validated.schemaExpression).toBe('OrderSchema')
    expect(validated.hasMapper).toBe(false)

    const mapped = ScannedSdkResponseResolution.mapped('OrderTransformed', 'toOrderRead')
    expect(mapped.kind).toBe(SdkResponseKind.Mapped)
    expect(mapped.hasSchema).toBe(false)
    expect(mapped.hasMapper).toBe(true)
    expect(mapped.mapperExpression).toBe('toOrderRead')

    const validatedAndMapped = ScannedSdkResponseResolution.validatedAndMapped(
      'OrderTransformed',
      'OrderSchema',
      'toOrderRead'
    )
    expect(validatedAndMapped.kind).toBe(SdkResponseKind.ValidatedAndMapped)
    expect(validatedAndMapped.hasSchema).toBe(true)
    expect(validatedAndMapped.hasMapper).toBe(true)
  })

  it('6. ScannedRouteDescriptor assigns hookKind and executionSignature automatically in factory', () => {
    const queryRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders',
      resourceName: 'Order',
      actionName: 'index',
      actionKind: 'read',
      isMutating: false
    })

    expect(queryRoute.hookKind).toBe(RouteHookKind.Query)
    expect(queryRoute.executionSignature.payloadMode).toBe(RoutePayloadMode.None)
    expect(queryRoute.invalidation.targets).toEqual([])

    const mutateRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/orders',
      resourceName: 'Order',
      actionName: 'store',
      actionKind: 'create',
      isMutating: true
    })

    expect(mutateRoute.hookKind).toBe(RouteHookKind.Mutation)
    expect(mutateRoute.executionSignature.payloadMode).toBe(RoutePayloadMode.Required)
  })

  it('7. StaticLaravelScanner.resolveRouteInvalidations builds graph at Origin Boundary', () => {
    const orderDetailModel = ScannedModelDescriptor.create({
      name: 'OrderDetail',
      table: 'order_details',
      columns: [],
      relations: [
        {
          name: 'order',
          type: 'belongsTo',
          modelName: 'Order',
          targetModel: 'App\\Models\\Order',
          cardinality: 'one',
          isCollection: false
        }
      ]
    })

    const orderStoreRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/order-details',
      resourceName: 'OrderDetail',
      actionName: 'store',
      actionKind: 'create',
      isMutating: true,
      response: ResourceResponseDescriptor.single('OrderDetail')
    })

    const logoutRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/logout',
      resourceName: 'logout',
      actionName: 'logout',
      actionKind: 'delete',
      isMutating: true
    })

    const protectedProfileRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/profile',
      resourceName: 'Profile',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      auth: true
    })

    const routes: readonly ParsedRoute[] = [orderStoreRoute, logoutRoute, protectedProfileRoute]
    const models: readonly ParsedModel[] = [orderDetailModel]
    const routeGroups: readonly ResourceRouteGroup[] = [
      ScannedResourceRouteGroupDescriptor.create({ resourceName: 'Order', routes: [] }),
      ScannedResourceRouteGroupDescriptor.create({ resourceName: 'OrderDetail', routes: [] })
    ]

    const resolvedRoutes = StaticLaravelScanner.resolveRouteInvalidations(routes, models, routeGroups)
    const [resolvedOrderStore, resolvedLogout, resolvedProtectedProfile] = resolvedRoutes

    // orderStoreRoute should have: selfList('orderDetail') + parentList('Order') + parentDetail('Order')
    expect(resolvedOrderStore.invalidation.queryKeyExpressions).toContain('QueryKey.orderDetail.all')
    expect(resolvedOrderStore.invalidation.queryKeyExpressions).toContain('QueryKey.Order.lists')
    expect(resolvedOrderStore.invalidation.queryKeyExpressions).toContain('QueryKey.Order.detail')

    // logoutRoute should have: selfList('logout') + authResource('profile')
    expect(resolvedLogout.invalidation.queryKeyExpressions).toContain('QueryKey.logout.all')
    expect(resolvedLogout.invalidation.queryKeyExpressions).toContain('QueryKey.profile.all')

    // protectedProfileRoute is Query, should have empty invalidation
    expect(resolvedProtectedProfile.invalidation.targets).toEqual([])
  })
})
