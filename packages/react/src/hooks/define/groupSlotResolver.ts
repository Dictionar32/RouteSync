/**
 * groupSlotResolver.ts
 *
 * Resolves CRUD slots, extras, and query keys for endpoint groups.
 *
 * @module react/hooks/define/groupSlotResolver
 */

import { EndpointCallable } from '@routesync/sdk'
import { PathResolver, HttpMethod } from '@routesync/core'
import { HookConfig, InvalidateList } from './hookTypes'

export function extractParamKey(endpoint: unknown): string {
  const path = (endpoint as { $def?: { path?: string } })?.$def?.path
  if (!path) return 'id'
  const params = PathResolver.extractParams(path)
  return params[0] ?? 'id'
}

export interface ResolvedGroupSlots {
  readonly indexService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly showService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly updateService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly updateSelfService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly resolvedUpdateSelf: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly deleteService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly deleteSelfService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly showParamKey: string
  readonly updateParamKey: string
  readonly deleteParamKey: string
}

export function resolveGroupSlots(
  group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>
): ResolvedGroupSlots {
  const indexService  = group.list
  const showService   = group.get ?? group.show
  const updateService = group.update
  const updateSelfService = !updateService ? (group.put ?? group.patch) : undefined
  const resolvedUpdateSelf = group.put ?? group.patch
  const deleteService     = group.remove ?? ((group.delete?.$def?.path as string)?.includes(':') ? group.delete : undefined)
  const deleteSelfService = !deleteService
    ? (group.delete?.$def && !(group.delete?.$def?.path as string)?.includes(':') ? group.delete : undefined)
    : undefined

  const showParamKey   = showService   ? extractParamKey(showService)   : 'id'
  const updateParamKey = updateService ? extractParamKey(updateService) : 'id'
  const deleteParamKey = deleteService ? extractParamKey(deleteService) : 'id'

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
  method?: string
  queryKey?: (...args: never[]) => readonly unknown[]
  invalidate?: InvalidateList
}

const CRUD_KEYS = new Set(['list', 'get', 'show', 'create', 'update', 'put', 'patch', 'delete', 'remove'])

export function resolveGroupExtras(
  group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>,
  groupConfig: HookConfig,
  groupQueryKeys?: Record<string, (...args: unknown[]) => readonly unknown[]>
): Record<string, ExtraEndpointDescriptor> {
  const extras: Record<string, ExtraEndpointDescriptor> = {}

  for (const action in group) {
    if (CRUD_KEYS.has(action)) continue
    const endpoint = group[action]
    if (typeof endpoint !== 'function' || !endpoint.$def) continue

    const method = endpoint.$def.method as string
    const actionCache = groupConfig.cache?.[action] as { invalidate?: InvalidateList } | undefined
    const actionKeyFn = groupConfig.actionKeys?.[action] ?? groupQueryKeys?.[action]

    extras[action] = {
      service: endpoint,
      method,
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
