/**
 * groupSlotResolver.ts
 *
 * Resolves CRUD slots, extras, and query keys for endpoint groups.
 *
 * @module react/hooks/define/groupSlotResolver
 */

import { type EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import { type HookConfig, type InvalidateList } from './hookTypes'
import { hasKey } from './unifiedHookBuilder'

export function extractParamKey(endpoint: unknown): string {
  if (typeof endpoint !== 'function' || !hasKey(endpoint, '$def')) {
    throw new Error('Route parameter capability is missing from the endpoint')
  }
  const definition = endpoint.$def
  if (!hasKey(definition, 'routeParameter')) {
    throw new Error('Route parameter capability is missing from the endpoint')
  }
  const parameter = definition.routeParameter
  if (!hasKey(parameter, 'kind') || parameter.kind !== 'route_parameter_capability_reference') {
    throw new Error('Route parameter capability is missing from the endpoint')
  }
  if (!hasKey(parameter, 'name') || typeof parameter.name !== 'string') {
    throw new Error('Route parameter capability is missing from the endpoint')
  }
  return parameter.name
}

export interface ResolvedGroupSlots {
  readonly indexService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly showService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly updateService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly updateSelfService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly resolvedUpdateSelf: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly deleteService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly deleteSelfService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly showParamKey: string | undefined
  readonly updateParamKey: string | undefined
  readonly deleteParamKey: string | undefined
}

const firstByRole = (
  group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>,
  role: 'index' | 'show' | 'update' | 'delete',
  targetScope?: 'collection' | 'member',
): EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined => {
  for (const endpoint of Object.values(group)) {
    if (!endpoint || typeof endpoint !== 'function' || !endpoint.$def) continue
    if (endpoint.$def.crudRole !== role) continue
    if (targetScope && endpoint.$def.targetScope !== targetScope) continue
    return endpoint
  }
  return undefined
}

export function resolveGroupSlots(
  group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>
): ResolvedGroupSlots {
  const indexService = firstByRole(group, 'index')
  const showService = firstByRole(group, 'show')
  const updateService = firstByRole(group, 'update', 'member')
  const resolvedUpdateSelf = firstByRole(group, 'update', 'collection')
  const updateSelfService = resolvedUpdateSelf
  const deleteService = firstByRole(group, 'delete', 'member')
  const deleteSelfService = firstByRole(group, 'delete', 'collection')

  const showParamKey = showService ? extractParamKey(showService) : undefined
  const updateParamKey = updateService ? extractParamKey(updateService) : undefined
  const deleteParamKey = deleteService ? extractParamKey(deleteService) : undefined

  return {
    indexService,
    showService,
    updateService,
    updateSelfService,
    resolvedUpdateSelf,
    deleteService,
    deleteSelfService,
    showParamKey,
    updateParamKey,
    deleteParamKey
  }
}

export type ExtraEndpointDescriptor = {
  service: unknown
  hookKind?: 'query' | 'mutation' | 'infinite_query'
  crudRole?: 'index' | 'show' | 'create' | 'update' | 'delete' | 'custom'
  queryKey?: (...args: never[]) => readonly unknown[]
  invalidate?: InvalidateList
}

export function resolveGroupExtras(
  group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>,
  groupConfig: HookConfig,
  groupQueryKeys?: Record<string, (...args: unknown[]) => readonly unknown[]>
): Record<string, ExtraEndpointDescriptor> {
  const extras: Record<string, ExtraEndpointDescriptor> = {}

  for (const action in group) {
    const endpoint = group[action]
    if (typeof endpoint !== 'function' || !endpoint.$def) continue
    if (endpoint.$def.crudRole !== 'custom') continue

    const actionCache = groupConfig.cache?.[action] as { invalidate?: InvalidateList } | undefined
    const actionKeyFn = groupConfig.actionKeys?.[action] ?? groupQueryKeys?.[action]

    extras[action] = {
      service: endpoint,
      hookKind: endpoint.$def.hookKind,
      crudRole: endpoint.$def.crudRole,
      queryKey: typeof actionKeyFn === 'function' ? (actionKeyFn as (...args: never[]) => readonly unknown[]) : undefined,
      invalidate: actionCache?.invalidate,
    }
  }

  return extras
}

export function resolveGroupQueryKeyFns(
  groupName: string,
  groupConfig: HookConfig,
  groupQueryKeys?: Record<string, (...args: unknown[]) => readonly unknown[]>
): {
  listKey: () => readonly unknown[]
  detailKey: (id: number) => readonly unknown[]
} {
  const listKey = (): readonly unknown[] => {
    const cache = groupConfig.cache as { list?: () => readonly unknown[] } | undefined
    if (cache?.list) return cache.list()
    if (groupQueryKeys?.lists) return groupQueryKeys.lists()
    if (groupQueryKeys?.list) return groupQueryKeys.list()
    return [groupName, 'list']
  }

  const detailKey = (id: number): readonly unknown[] => {
    const cache = groupConfig.cache as { detail?: (id: number) => readonly unknown[] } | undefined
    if (cache?.detail) return cache.detail(id)
    if (groupQueryKeys?.detail) return groupQueryKeys.detail(id)
    return [groupName, 'detail', id]
  }

  return { listKey, detailKey }
}
