import { describe, test, expect } from 'vitest'
import {
  matchRouteHookKind,
  matchHookKind,
  HOOK_KIND_REGISTRY,
  RouteHookKind,
  ScannedRouteHookDescriptor,
  ROUTE_DESCRIPTOR_REGISTRY,
  RouteDescriptorKind
} from '../../core/src'

describe('RouteHookKind ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchRouteHookKind executes pure catamorphism for query hook kind', () => {
    const result = matchRouteHookKind(RouteHookKind.Query, {
      query: (spec) => `${spec.hookPrefix}${spec.tanstackHookName.slice(3)}:mutate=${spec.isMutating}:key=${spec.requiresQueryKey}:page=${spec.supportsPagination}`,
      mutation: () => 'MUTATION',
      infinite_query: () => 'INFINITE'
    })

    expect(result).toBe('useQuery:mutate=false:key=true:page=false')
  })

  test('2. matchRouteHookKind executes pure catamorphism for mutation hook kind', () => {
    const result = matchRouteHookKind(RouteHookKind.Mutation, {
      query: () => 'QUERY',
      mutation: (spec) => `${spec.tanstackHookName}:mutate=${spec.isMutating}:key=${spec.requiresQueryKey}:opts=${spec.defaultOptionsTypeName}`,
      infinite_query: () => 'INFINITE'
    })

    expect(result).toBe('useMutation:mutate=true:key=false:opts=UseMutationOptions')
  })

  test('3. matchRouteHookKind executes pure catamorphism for infinite_query hook kind', () => {
    const result = matchRouteHookKind(RouteHookKind.InfiniteQuery, {
      query: () => 'QUERY',
      mutation: () => 'MUTATION',
      infinite_query: (spec) => `${spec.tanstackHookName}:mutate=${spec.isMutating}:key=${spec.requiresQueryKey}:page=${spec.supportsPagination}:opts=${spec.defaultOptionsTypeName}`
    })

    expect(result).toBe('useInfiniteQuery:mutate=false:key=true:page=true:opts=UseInfiniteQueryOptions')
  })

  test('4. matchHookKind alias behaves identically to matchRouteHookKind', () => {
    const res = matchHookKind(RouteHookKind.Query, {
      query: (spec) => spec.tanstackHookName,
      mutation: () => 'N',
      infinite_query: () => 'N'
    })

    expect(res).toBe('useQuery')
  })

  test('5. HOOK_KIND_REGISTRY provides frozen O(1) specifications for all 3 variants', () => {
    expect(Object.isFrozen(HOOK_KIND_REGISTRY)).toBe(true)

    const allKinds = Object.values(RouteHookKind)
    expect(allKinds).toHaveLength(3)

    for (const kind of allKinds) {
      const spec = HOOK_KIND_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(spec.hookPrefix).toBe('use')
      expect(typeof spec.tanstackHookName).toBe('string')
      expect(typeof spec.isMutating).toBe('boolean')
      expect(typeof spec.requiresQueryKey).toBe('boolean')
      expect(typeof spec.supportsPagination).toBe('boolean')
      expect(typeof spec.defaultOptionsTypeName).toBe('string')
    }

    expect(HOOK_KIND_REGISTRY[RouteHookKind.Query].isMutating).toBe(false)
    expect(HOOK_KIND_REGISTRY[RouteHookKind.Mutation].isMutating).toBe(true)
    expect(HOOK_KIND_REGISTRY[RouteHookKind.InfiniteQuery].supportsPagination).toBe(true)
  })

  test('6. Semantic factory methods on ScannedRouteHookDescriptor instantiate guaranteed frozen ADT instances', () => {
    const queryHook = ScannedRouteHookDescriptor.query()
    expect(queryHook.kind).toBe(RouteHookKind.Query)
    expect(queryHook.tanstackHookName).toBe('useQuery')
    expect(queryHook.isMutating).toBe(false)
    expect(queryHook.requiresQueryKey).toBe(true)
    expect(queryHook.supportsPagination).toBe(false)
    expect(Object.isFrozen(queryHook)).toBe(true)

    const mutationHook = ScannedRouteHookDescriptor.mutation()
    expect(mutationHook.kind).toBe(RouteHookKind.Mutation)
    expect(mutationHook.tanstackHookName).toBe('useMutation')
    expect(mutationHook.isMutating).toBe(true)
    expect(mutationHook.requiresQueryKey).toBe(false)
    expect(mutationHook.supportsPagination).toBe(false)
    expect(Object.isFrozen(mutationHook)).toBe(true)

    const infiniteHook = ScannedRouteHookDescriptor.infiniteQuery()
    expect(infiniteHook.kind).toBe(RouteHookKind.InfiniteQuery)
    expect(infiniteHook.tanstackHookName).toBe('useInfiniteQuery')
    expect(infiniteHook.isMutating).toBe(false)
    expect(infiniteHook.requiresQueryKey).toBe(true)
    expect(infiniteHook.supportsPagination).toBe(true)
    expect(Object.isFrozen(infiniteHook)).toBe(true)

    const fromKind = ScannedRouteHookDescriptor.fromKind(RouteHookKind.Mutation)
    expect(fromKind.kind).toBe(RouteHookKind.Mutation)
    expect(fromKind.tanstackHookName).toBe('useMutation')
  })

  test('7. Pure functional hook code generator pipeline without branching (Zero-if pattern)', () => {
    const routes = [
      { name: 'getProducts', hookKind: RouteHookKind.Query },
      { name: 'createProduct', hookKind: RouteHookKind.Mutation },
      { name: 'updateProduct', hookKind: RouteHookKind.Mutation },
      { name: 'getProductsInfinite', hookKind: RouteHookKind.InfiniteQuery },
      { name: 'deleteProduct', hookKind: RouteHookKind.Mutation }
    ]

    const hookDeclarations = routes.map(r => {
      return matchRouteHookKind(r.hookKind, {
        query: (spec) => `export const use${r.name} = () => ${spec.tanstackHookName}(...);`,
        mutation: (spec) => `export const use${r.name} = () => ${spec.tanstackHookName}(...);`,
        infinite_query: (spec) => `export const use${r.name} = () => ${spec.tanstackHookName}(...);`
      })
    })

    expect(hookDeclarations).toEqual([
      'export const usegetProducts = () => useQuery(...);',
      'export const usecreateProduct = () => useMutation(...);',
      'export const useupdateProduct = () => useMutation(...);',
      'export const usegetProductsInfinite = () => useInfiniteQuery(...);',
      'export const usedeleteProduct = () => useMutation(...);'
    ])
  })

  test('8. ROUTE_DESCRIPTOR_REGISTRY links directly to canonical RouteHookKind', () => {
    expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.GetCollection].hookKind).toBe(RouteHookKind.Query)
    expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.GetItem].hookKind).toBe(RouteHookKind.Query)
    expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.Mutation].hookKind).toBe(RouteHookKind.Mutation)
    expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.Deletion].hookKind).toBe(RouteHookKind.Mutation)
  })
})
