import { describe, test, expect } from 'vitest'
import {
  matchInvalidationTarget,
  INVALIDATION_TARGET_REGISTRY,
  InvalidationTargetKind,
  SelfListInvalidationTarget,
  ParentListInvalidationTarget,
  ParentDetailInvalidationTarget,
  AuthResourceInvalidationTarget,
  ScannedInvalidationTarget,
  ScannedRouteCacheInvalidationDescriptor
} from '../../core/src'

describe('InvalidationTarget ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchInvalidationTarget executes pure catamorphism for self_list target', () => {
    const target: SelfListInvalidationTarget = ScannedInvalidationTarget.selfList('orders')

    const result = matchInvalidationTarget(target, {
      self_list: (t) => `SELF_LIST:${t.groupName}:${t.queryKeyExpression}`,
      parent_list: (t) => `PARENT_LIST:${t.groupName}`,
      parent_detail: (t) => `PARENT_DETAIL:${t.groupName}`,
      auth_resource: (t) => `AUTH:${t.groupName}`
    })

    expect(result).toBe('SELF_LIST:orders:QueryKey.orders.all')
  })

  test('2. matchInvalidationTarget executes pure catamorphism for parent_list target', () => {
    const target: ParentListInvalidationTarget = ScannedInvalidationTarget.parentList('orders')

    const result = matchInvalidationTarget(target, {
      self_list: (t) => `SELF_LIST:${t.groupName}`,
      parent_list: (t) => `PARENT_LIST:${t.groupName}:${t.queryKeyExpression}`,
      parent_detail: (t) => `PARENT_DETAIL:${t.groupName}`,
      auth_resource: (t) => `AUTH:${t.groupName}`
    })

    expect(result).toBe('PARENT_LIST:orders:QueryKey.orders.lists')
  })

  test('3. matchInvalidationTarget executes pure catamorphism for parent_detail target', () => {
    const target: ParentDetailInvalidationTarget = ScannedInvalidationTarget.parentDetail('orders')

    const result = matchInvalidationTarget(target, {
      self_list: (t) => `SELF_LIST:${t.groupName}`,
      parent_list: (t) => `PARENT_LIST:${t.groupName}`,
      parent_detail: (t) => `PARENT_DETAIL:${t.groupName}:${t.queryKeyExpression}`,
      auth_resource: (t) => `AUTH:${t.groupName}`
    })

    expect(result).toBe('PARENT_DETAIL:orders:QueryKey.orders.detail')
  })

  test('4. matchInvalidationTarget executes pure catamorphism for auth_resource target', () => {
    const target: AuthResourceInvalidationTarget = ScannedInvalidationTarget.authResource('users')

    const result = matchInvalidationTarget(target, {
      self_list: (t) => `SELF_LIST:${t.groupName}`,
      parent_list: (t) => `PARENT_LIST:${t.groupName}`,
      parent_detail: (t) => `PARENT_DETAIL:${t.groupName}`,
      auth_resource: (t) => `AUTH:${t.groupName}:${t.queryKeyExpression}`
    })

    expect(result).toBe('AUTH:users:QueryKey.users.all')
  })

  test('5. INVALIDATION_TARGET_REGISTRY enforces metadata specifications for all InvalidationTargetKinds', () => {
    expect(Object.isFrozen(INVALIDATION_TARGET_REGISTRY)).toBe(true)

    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.SelfList].queryKeySuffix).toBe('all')
    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.SelfList].computeQueryKey('products')).toBe('QueryKey.products.all')

    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.ParentList].queryKeySuffix).toBe('lists')
    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.ParentList].computeQueryKey('products')).toBe('QueryKey.products.lists')

    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.ParentDetail].queryKeySuffix).toBe('detail')
    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.ParentDetail].computeQueryKey('products')).toBe('QueryKey.products.detail')

    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.AuthResource].queryKeySuffix).toBe('all')
    expect(INVALIDATION_TARGET_REGISTRY[InvalidationTargetKind.AuthResource].computeQueryKey('auth')).toBe('QueryKey.auth.all')
  })

  test('6. ScannedInvalidationTarget semantic factories return frozen and typed targets', () => {
    const self = ScannedInvalidationTarget.selfList('items')
    const parent = ScannedInvalidationTarget.parentList('orders')
    const detail = ScannedInvalidationTarget.parentDetail('orders')
    const auth = ScannedInvalidationTarget.authResource('profile')
    const resList = ScannedInvalidationTarget.resourceList('categories')
    const resItem = ScannedInvalidationTarget.resourceItem('categories')

    expect(Object.isFrozen(self)).toBe(true)
    expect(self.kind).toBe(InvalidationTargetKind.SelfList)
    expect(self.queryKeyExpression).toBe('QueryKey.items.all')

    expect(Object.isFrozen(parent)).toBe(true)
    expect(parent.kind).toBe(InvalidationTargetKind.ParentList)
    expect(parent.queryKeyExpression).toBe('QueryKey.orders.lists')

    expect(Object.isFrozen(detail)).toBe(true)
    expect(detail.kind).toBe(InvalidationTargetKind.ParentDetail)
    expect(detail.queryKeyExpression).toBe('QueryKey.orders.detail')

    expect(Object.isFrozen(auth)).toBe(true)
    expect(auth.kind).toBe(InvalidationTargetKind.AuthResource)
    expect(auth.queryKeyExpression).toBe('QueryKey.profile.all')

    expect(resList.kind).toBe(InvalidationTargetKind.ParentList)
    expect(resItem.kind).toBe(InvalidationTargetKind.ParentDetail)
  })

  test('7. ScannedRouteCacheInvalidationDescriptor aggregates targets into queryKeyExpressions', () => {
    const invalidation = ScannedRouteCacheInvalidationDescriptor.fromTargets([
      ScannedInvalidationTarget.selfList('orders'),
      ScannedInvalidationTarget.parentList('users')
    ])

    expect(invalidation.targets.length).toBe(2)
    expect(invalidation.queryKeyExpressions).toEqual([
      'QueryKey.orders.all',
      'QueryKey.users.lists'
    ])
    expect(Object.isFrozen(invalidation.targets)).toBe(true)
    expect(Object.isFrozen(invalidation.queryKeyExpressions)).toBe(true)
  })
})
