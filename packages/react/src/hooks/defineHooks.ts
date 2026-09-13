/**
 * defineHooks.ts
 *
 * Active Consumer Orchestrator: Combines endpoints, queries, mutations, CRUD convenience hooks,
 * and domain intent wrappers into a unified React hook registry.
 *
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption,
 * and pure flow declaration.
 *
 * @module react/hooks/defineHooks
 */

import { EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import { createCrudHooks } from './createCrudHooks'
import { toIndexFn, toShowFn } from './endpointAdapters'

import {
  HookConfig,
  InvalidateList,
  InferResponse,
  InferBody,
  InferMethod,
  FlattenOptions,
  ResolveError,
  HookForEndpoint,
  EndpointHooks,
  CrudHooks
} from './define/hookTypes'

import {
  UnifiedGroupHookResult,
  ResolveActionMutation,
  ResolveOpPath,
  ResolveMutationType,
  ResolveIntentFromObj,
  GetIntentActions,
  HooksForGroup
} from './define/intentTypes'

import {
  resolveGroupSlots,
  resolveGroupExtras,
  resolveGroupQueryKeyFns
} from './define/groupSlotResolver'

import {
  buildUnifiedGroupHook,
  hasKey
} from './define/unifiedHookBuilder'

import {
  resolveAndWrapIntent,
  getHookMethodResult,
  resolveMutation
} from './define/intentWrapper'

// ============================================================================
// Active Consumer: defineHooks Pure Flow Orchestrator
// ============================================================================

export function defineHooks<TConfig extends Record<string, HookConfig>, TManifest = unknown>(
  config: TConfig,
  runtimeManifest?: TManifest
): { [K in keyof TConfig]: HooksForGroup<TConfig, TConfig[K], K & string, TManifest> } {
  const hooks = {} as { [K in keyof TConfig]: HooksForGroup<TConfig, TConfig[K], K & string, TManifest> }
  const hooksMap = hooks as Record<string, unknown>

  for (const groupName in config) {
    const groupConfig = config[groupName]
    const group = groupConfig.endpoint as Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>
    const groupQueryKeys = groupConfig.queryKey as Record<string, (...args: unknown[]) => readonly unknown[]> | undefined

    const slots = resolveGroupSlots(group)
    const extras = resolveGroupExtras(group, groupConfig, groupQueryKeys)
    const { listKey, detailKey } = resolveGroupQueryKeyFns(groupName, groupConfig, groupQueryKeys)

    const crudHooks = createCrudHooks({
      groupName,
      domain: groupConfig.domain,
      queryKey: { list: listKey, detail: detailKey },
      service: {
        index:      slots.indexService      ? toIndexFn(slots.indexService) : undefined,
        show:       slots.showService       ? toShowFn(slots.showService as EndpointCallable<unknown, Record<string, unknown>, unknown, HttpMethod>, slots.showParamKey) : undefined,
        create:     group.create            ?? undefined,
        update:     slots.updateService
          ? (id: number, data: unknown) => slots.updateService!({ params: { [slots.updateParamKey]: id }, body: data })
          : undefined,
        updateSelf: slots.resolvedUpdateSelf ?? undefined,
        delete:     slots.deleteService
          ? async (id: number) => { await slots.deleteService!({ params: { [slots.deleteParamKey]: id } }) }
          : undefined,
        deleteSelf: slots.deleteSelfService
          ? async () => { await slots.deleteSelfService!() }
          : undefined,
      },
      cache: {
        create:     groupConfig.cache?.create     as { invalidate?: InvalidateList } | undefined,
        update:     groupConfig.cache?.update     as { invalidate?: InvalidateList } | undefined,
        updateSelf: (groupConfig.cache?.updateSelf ?? groupConfig.cache?.update) as { invalidate?: InvalidateList } | undefined,
        delete:     groupConfig.cache?.delete     as { invalidate?: InvalidateList } | undefined,
        deleteSelf: (groupConfig.cache?.deleteSelf ?? groupConfig.cache?.delete) as { invalidate?: InvalidateList } | undefined,
      },
      extras,
    })

    const unifiedHook = buildUnifiedGroupHook(groupName, group, slots, crudHooks)

    const finalHook = resolveAndWrapIntent({
      groupName,
      groupConfig,
      runtimeManifest,
      unifiedHook,
      crudHooks,
      group,
      hooksMap
    })

    hooksMap[groupName] = finalHook
  }

  return hooks
}

// ============================================================================
// Explicit Named Exports (Rule 14: Zero Wildcard Re-export)
// ============================================================================

export {
  HookConfig,
  InvalidateList,
  InferResponse,
  InferBody,
  InferMethod,
  FlattenOptions,
  ResolveError,
  HookForEndpoint,
  EndpointHooks,
  CrudHooks,
  UnifiedGroupHookResult,
  ResolveActionMutation,
  ResolveOpPath,
  ResolveMutationType,
  ResolveIntentFromObj,
  GetIntentActions,
  HooksForGroup,
  hasKey,
  getHookMethodResult,
  resolveMutation
}
