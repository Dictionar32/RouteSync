/**
 * unifiedHookBuilder.ts
 *
 * Constructs the unified single-call group hook (list/detail/mutations).
 *
 * @module react/hooks/define/unifiedHookBuilder
 */

import { type EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import { type ResolvedGroupSlots } from './groupSlotResolver'

export const hasKey = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return (typeof obj === 'object' || typeof obj === 'function') && obj !== null && key in obj
}

export interface UnifiedGroupHookResult {
  readonly list: unknown
  readonly detail: unknown
  readonly create: unknown
  readonly update: unknown
  readonly updateSelf: unknown
  readonly delete: unknown
  readonly deleteSelf: unknown
  readonly isLoading: boolean
  readonly error: unknown
  readonly [groupName: string]: unknown
}

export interface BuildUnifiedGroupHook {
  (
    groupName: string,
    group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>,
    slots: ResolvedGroupSlots,
    crudHooks: Record<string, any>
  ): (optionsOrId?: number | { id?: number; list?: boolean }) => UnifiedGroupHookResult
}

export const buildUnifiedGroupHook: BuildUnifiedGroupHook = (
  groupName: string,
  group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>,
  slots: ResolvedGroupSlots,
  crudHooks: Record<string, any>
) => {
  const {
    indexService,
    showService,
    updateService,
    resolvedUpdateSelf,
    deleteService,
    deleteSelfService
  } = slots

  const unifiedHook = (optionsOrId?: number | { id?: number; list?: boolean }) => {
    const id = typeof optionsOrId === 'number' ? optionsOrId : optionsOrId?.id
    const listOption = typeof optionsOrId === 'object' ? optionsOrId?.list : undefined

    const shouldFetchList = !!indexService && id === undefined && listOption !== false
    const shouldFetchDetail = !!showService && id !== undefined

    const listQueryResult = indexService !== undefined ? crudHooks['index']({ enabled: shouldFetchList }) : undefined
    const detailQueryResult = showService !== undefined ? crudHooks['show'](id ?? 0, { enabled: shouldFetchDetail }) : undefined

    const createMutation = group['create'] !== undefined ? crudHooks['create']() : undefined
    const updateMutation = updateService !== undefined ? crudHooks['update']() : undefined
    const updateSelfMutation = resolvedUpdateSelf !== undefined ? crudHooks['updateSelf']() : undefined
    const deleteMutation = deleteService !== undefined ? crudHooks['delete']() : undefined
    const deleteSelfMutation = deleteSelfService !== undefined ? crudHooks['deleteSelf']() : undefined

    const data = shouldFetchDetail ? detailQueryResult?.data : listQueryResult?.data
    const isLoading = shouldFetchDetail ? detailQueryResult?.isLoading : listQueryResult?.isLoading
    const error = shouldFetchDetail ? detailQueryResult?.error : listQueryResult?.error

    return {
      list: listQueryResult,
      detail: detailQueryResult,
      create: createMutation,
      update: updateMutation,
      updateSelf: updateSelfMutation,
      delete: deleteMutation,
      deleteSelf: deleteSelfMutation,

      [groupName]: data,
      isLoading: !!isLoading,
      error: error || null,
    }
  }

  Object.assign(unifiedHook, crudHooks)
  if (hasKey(unifiedHook, 'endpoint')) {
    unifiedHook.endpoint = group
  }

  return unifiedHook
}
