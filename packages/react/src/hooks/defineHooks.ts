import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, ApiError, RouteDefinition } from '@routesync/sdk'
import { PathResolver } from '@routesync/core'
import { createCrudHooks } from './createCrudHooks'
import { toIndexFn, toShowFn } from './endpointAdapters'

// ─── Internal helper: extract first path param name from an endpoint ──────────
// Needed because PathResolver.resolve for function-based paths uses named lookup
// (params['produkItemId']), not positional. Without this, callUpdate/callDelete
// would always pass { id } which resolves to undefined for non-id param names.
function extractParamKey(endpoint: any): string {
  const path = endpoint?.$def?.path
  if (!path) return 'id'
  const params = PathResolver.extractParams(path)
  return params[0] ?? 'id'
}

// ─── Utility types ────────────────────────────────────────────────────────────

type InferResponse<T> = T extends EndpointCallable<infer R, any, any, any> ? R : unknown
type InferBody<T> = T extends EndpointCallable<any, any, infer B, any> ? B : unknown
type InferMethod<T> = T extends { $def: RouteDefinition<any, any, any, infer M> } ? M : never

type HookForEndpoint<T> =
  InferMethod<T> extends 'GET'
    ? (options?: any) => UseQueryResult<InferResponse<T>, Error>
    : () => UseMutationResult<InferResponse<T>, Error, InferBody<T>>

// Map all endpoint keys to use{Name} hooks
type EndpointHooks<TEndpoint> = {
  [K in keyof TEndpoint as `use${Capitalize<string & K>}`]: HookForEndpoint<TEndpoint[K]>
}

// CRUD convenience hooks — only present when the slot is populated
type CrudHooks<TTypes, TEndpoint> = {
  useIndex: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never] ? never : () => UseQueryResult<L, Error>
    : TEndpoint extends { list: EndpointCallable<infer L, any, any, any> }
      ? () => UseQueryResult<L, Error>
      : never

  useShow: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never] ? never : (id: number) => UseQueryResult<D, Error>
    : never

  useCreate: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never] ? never : () => UseMutationResult<unknown, Error, C>
    : never

  useUpdate: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? never : () => UseMutationResult<unknown, Error, { id: number; data: U }>
    : never

  useUpdateSelf: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? never : () => UseMutationResult<unknown, Error, U>
    : never

  useRemove: TEndpoint extends { delete: any } | { remove: any }
    ? () => UseMutationResult<void, Error, number>
    : never

  useDeleteSelf: TEndpoint extends { delete: any }
    ? () => UseMutationResult<void, Error, void>
    : never

  // short aliases
  index: CrudHooks<TTypes, TEndpoint>['useIndex']
  show: CrudHooks<TTypes, TEndpoint>['useShow']
  create: CrudHooks<TTypes, TEndpoint>['useCreate']
  update: CrudHooks<TTypes, TEndpoint>['useUpdate']
  updateSelf: CrudHooks<TTypes, TEndpoint>['useUpdateSelf']
  remove: CrudHooks<TTypes, TEndpoint>['useRemove']
  delete: CrudHooks<TTypes, TEndpoint>['useRemove']
  deleteSelf: CrudHooks<TTypes, TEndpoint>['useDeleteSelf']
}

type HooksForGroup<TTypes, TEndpoint> = CrudHooks<TTypes, TEndpoint> & EndpointHooks<TEndpoint> & { endpoint: TEndpoint }

// ─── HookConfig ───────────────────────────────────────────────────────────────

type InvalidateList = Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>

export interface HookConfig {
  types?: {
    list?: any
    detail?: any
    create?: any
    update?: any
  }
  queryKey: any
  actionKeys?: Record<string, (...args: any[]) => readonly unknown[]>
  endpoint: any
  cache?: {
    list?: () => readonly unknown[]
    detail?: (id: number) => readonly unknown[]
    create?: { invalidate?: InvalidateList }
    update?: { invalidate?: InvalidateList }
    updateSelf?: { invalidate?: InvalidateList }
    delete?: { invalidate?: InvalidateList }
    deleteSelf?: { invalidate?: InvalidateList }
    [action: string]: unknown
  }
}

// ─── defineHooks ─────────────────────────────────────────────────────────────

export function defineHooks<TConfig extends Record<string, HookConfig>>(
  config: TConfig
): { [K in keyof TConfig]: HooksForGroup<TConfig[K]['types'], TConfig[K]['endpoint']> } {
  const hooks = {} as any

  for (const groupName in config) {
    const groupConfig = config[groupName]
    const group = groupConfig.endpoint
    const groupQueryKeys = groupConfig.queryKey

    // ── Resolve CRUD standard slots ──────────────────────────────────────────
    const indexService  = group.list
    const showService   = group.get ?? group.show
    // update: param-based (PUT/PATCH + :id) → first-wins
    const updateService = group.update
    // updateSelf: no-param PUT/PATCH (e.g. PATCH /profile) — put sebelum patch
    const updateSelfService = !updateService ? (group.put ?? group.patch) : undefined
    // kalau update tidak ada, put/patch tanpa param masuk ke updateSelf
    const resolvedUpdateSelf = group.put ?? group.patch
    const deleteService     = group.remove ?? (group.delete?.$def?.path?.includes(':') ? group.delete : undefined)
    const deleteSelfService = !deleteService
      ? (group.delete?.$def && !group.delete?.$def?.path?.includes(':') ? group.delete : undefined)
      : undefined

    // ── Resolve extra (non-CRUD) endpoints ───────────────────────────────────
    const CRUD_KEYS = new Set(['list', 'get', 'show', 'create', 'update', 'put', 'patch', 'delete', 'remove'])
    const extras: Record<string, { service: any; method?: string; queryKey?: (...args: any[]) => readonly unknown[]; invalidate?: InvalidateList }> = {}

    for (const action in group) {
      if (CRUD_KEYS.has(action)) continue
      const endpoint = group[action]
      if (typeof endpoint !== 'function' || !endpoint.$def) continue

      const method = endpoint.$def.method as string
      const actionCache = groupConfig.cache?.[action] as { invalidate?: InvalidateList } | undefined
      // ambil queryKey dari actionKeys kalau ada — ini yang jadi sumber kebenaran untuk cache
      const actionKeyFn = groupConfig.actionKeys?.[action] ?? groupQueryKeys?.[action]

      extras[action] = {
        service: endpoint,
        method,
        queryKey: typeof actionKeyFn === 'function' ? actionKeyFn : undefined,
        invalidate: actionCache?.invalidate,
      }
    }

    // ── Build queryKey fns ───────────────────────────────────────────────────
    const listKey = (): readonly unknown[] => {
      if (groupConfig.cache?.list) return groupConfig.cache.list()
      if (groupQueryKeys?.lists) return groupQueryKeys.lists()
      if (groupQueryKeys?.list) return groupQueryKeys.list()
      return [groupName, 'list']
    }

    const detailKey = (id: number): readonly unknown[] => {
      if (groupConfig.cache?.detail) return groupConfig.cache.detail(id)
      if (groupQueryKeys?.detail) return groupQueryKeys.detail(id)
      return [groupName, 'detail', id]
    }

    // Extract actual param key names from path fn signatures so PathResolver
    // doesn't resolve to undefined when param isn't named 'id' (e.g. produkItemId).
    const showParamKey   = showService   ? extractParamKey(showService)   : 'id'
    const updateParamKey = updateService ? extractParamKey(updateService) : 'id'
    const deleteParamKey = deleteService ? extractParamKey(deleteService) : 'id'

    hooks[groupName] = createCrudHooks({
      queryKey: { list: listKey, detail: detailKey },
      service: {
        index:      indexService      ? toIndexFn(indexService)                : undefined,
        show:       showService       ? toShowFn(showService, showParamKey)    : undefined,
        create:     group.create      ?? undefined,
        update:     updateService
          ? (id: number, data: any) => updateService({ params: { [updateParamKey]: id }, body: data })
          : undefined,
        updateSelf: resolvedUpdateSelf ?? undefined,
        delete:     deleteService
          ? (id: number) => deleteService({ params: { [deleteParamKey]: id } })
          : undefined,
        deleteSelf: deleteSelfService ?? undefined,
      },
      cache: {
        create:     groupConfig.cache?.create     as any,
        update:     groupConfig.cache?.update     as any,
        updateSelf: groupConfig.cache?.updateSelf as any ?? groupConfig.cache?.update as any,
        delete:     groupConfig.cache?.delete     as any,
        deleteSelf: groupConfig.cache?.deleteSelf as any ?? groupConfig.cache?.delete as any,
      },
      extras,
    })
    ;(hooks[groupName] as any).endpoint = group
  }

  return hooks
}
