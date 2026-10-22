/**
 * groupSlotResolver.ts
 *
 * Resolves CRUD slots, extras, and query keys for endpoint groups.
 *
 * @module react/hooks/define/groupSlotResolver
 */

import { type EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import { type CrudGroupExecutionContract, type HookConfig, type InvalidateList } from './hookTypes'

export interface ResolvedGroupSlots {
  readonly indexService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
  readonly createService: EndpointCallable<unknown, unknown, unknown, HttpMethod> | undefined
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

export function resolveGroupSlots(contract: CrudGroupExecutionContract): ResolvedGroupSlots {
  if (contract.kind !== 'crud_group_execution_contract' || contract.closed !== true) {
    throw new Error('RouteSync requires a closed upstream CRUD slot contract')
  }
  return {
    indexService: contract.indexService,
    showService: contract.showService,
    createService: contract.createService,
    updateService: contract.updateService,
    updateSelfService: contract.updateSelfService,
    resolvedUpdateSelf: contract.updateSelfService,
    deleteService: contract.deleteService,
    deleteSelfService: contract.deleteSelfService,
    showParamKey: contract.showParamKey,
    updateParamKey: contract.updateParamKey,
    deleteParamKey: contract.deleteParamKey,
  }
}

export type ExtraEndpointDescriptor = {
  service: EndpointCallable<unknown, unknown, unknown, HttpMethod>
  hookKind?: 'query' | 'mutation' | 'infinite_query'
  crudRole?: 'index' | 'show' | 'create' | 'update' | 'delete' | 'custom'
  queryKey?: (...args: never[]) => readonly unknown[]
  invalidate?: InvalidateList
}

export function resolveGroupExtras(
  groupConfig: HookConfig,
  groupQueryKeys: Record<string, (...args: unknown[]) => readonly unknown[]> | undefined,
  contract: CrudGroupExecutionContract
): Record<string, ExtraEndpointDescriptor> {
  if (contract.kind !== 'crud_group_execution_contract' || contract.closed !== true) {
    throw new Error('RouteSync requires a closed upstream custom-endpoint contract')
  }
  const extras: Record<string, ExtraEndpointDescriptor> = {}
  for (const item of contract.customEndpoints) {
    const actionCache = groupConfig.cache?.[item.action] as { invalidate?: InvalidateList } | undefined
    const actionKeyFn = groupConfig.actionKeys?.[item.action] ?? groupQueryKeys?.[item.action]
    extras[item.action] = {
      service: item.service,
      hookKind: item.hookKind,
      crudRole: item.crudRole,
      queryKey: typeof actionKeyFn === 'function' ? actionKeyFn as (...args: never[]) => readonly unknown[] : undefined,
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
    if (groupQueryKeys?.all) return groupQueryKeys.all()
    throw new Error(`RouteSync group ${groupName} is missing its upstream list query-key capability`)
  }

  const detailKey = (id: number): readonly unknown[] => {
    const cache = groupConfig.cache as { detail?: (id: number) => readonly unknown[] } | undefined
    if (cache?.detail) return cache.detail(id)
    if (groupQueryKeys?.detail) return groupQueryKeys.detail(id)
    if (groupQueryKeys?.all) return groupQueryKeys.all()
    throw new Error(`RouteSync group ${groupName} is missing its upstream detail query-key capability`)
  }

  return { listKey, detailKey }
}
