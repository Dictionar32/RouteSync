import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, ApiError, RouteDefinition } from '@routesync/sdk'
import { PathResolver, HttpMethod } from '@routesync/core'
import { createCrudHooks } from './createCrudHooks'
import { toIndexFn, toShowFn } from './endpointAdapters'

// ─── Internal helper: extract first path param name from an endpoint ──────────
// Needed because PathResolver.resolve for function-based paths uses named lookup
// (params['produkItemId']), not positional. Without this, callUpdate/callDelete
// would always pass { id } which resolves to undefined for non-id param names.
function extractParamKey(endpoint: unknown): string {
  const path = (endpoint as { $def?: { path?: string } })?.$def?.path
  if (!path) return 'id'
  const params = PathResolver.extractParams(path)
  return params[0] ?? 'id'
}

// ─── Utility types ────────────────────────────────────────────────────────────

type InferResponse<T> = T extends { $def: RouteDefinition<infer R, unknown, unknown, HttpMethod> } ? R : unknown
type InferBody<T> = T extends { $def: RouteDefinition<unknown, unknown, infer B, HttpMethod> } ? B : unknown
type InferMethod<T> = T extends { $def: RouteDefinition<unknown, unknown, unknown, infer M> } ? M : never

type FlattenOptions<T> = T extends { $def: RouteDefinition<unknown, infer P, infer B, HttpMethod> }
  ? unknown extends P
    ? unknown extends B
      ? void
      : B
    : unknown extends B
      ? P
      : P & B
  : unknown

type HookForEndpoint<T> =
  InferMethod<T> extends 'GET'
    ? (options?: FlattenOptions<T>) => UseQueryResult<InferResponse<T>, Error>
    : () => UseMutationResult<
        InferResponse<T>,
        Error,
        FlattenOptions<T>
      >

// Map all endpoint keys to use{Name} hooks
type EndpointHooks<TEndpoint> = {
  [K in keyof TEndpoint as `use${Capitalize<string & K>}`]: HookForEndpoint<TEndpoint[K]>
}

// CRUD convenience hooks — only present when the slot is populated
type CrudHooks<TTypes, TEndpoint, TGroupName extends string> = {
  useIndex: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never] ? never : (options?: unknown) => UseQueryResult<L, Error> & { [Key in TGroupName]: L | undefined }
    : TEndpoint extends { list: EndpointCallable<infer L, unknown, unknown, HttpMethod> }
      ? (options?: unknown) => UseQueryResult<L, Error> & { [Key in TGroupName]: L | undefined }
      : never

  useShow: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never] ? never : (id: number, options?: unknown) => UseQueryResult<D, Error> & { [Key in TGroupName]: D | undefined }
    : never

  useCreate: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never] ? never : () => UseMutationResult<
        TEndpoint extends { create: infer TC } ? InferResponse<TC> : unknown,
        Error,
        C
      >
    : never

  useUpdate: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? never : () => UseMutationResult<
        TEndpoint extends { update: infer TU } ? InferResponse<TU> : unknown,
        Error,
        { id: number; data: U }
      >
    : never

  useUpdateSelf: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? never : () => UseMutationResult<
        TEndpoint extends { updateSelf: infer TU } ? InferResponse<TU> : TEndpoint extends { update: infer TU } ? InferResponse<TU> : TEndpoint extends { put: infer TU } ? InferResponse<TU> : TEndpoint extends { patch: infer TU } ? InferResponse<TU> : unknown,
        Error,
        U
      >
    : never

  usePatch: CrudHooks<TTypes, TEndpoint, TGroupName>['useUpdateSelf']
  usePut: CrudHooks<TTypes, TEndpoint, TGroupName>['useUpdateSelf']

  useRemove: TEndpoint extends { delete: unknown } | { remove: unknown }
    ? () => UseMutationResult<void, Error, number>
    : never

  useDelete: CrudHooks<TTypes, TEndpoint, TGroupName>['useRemove']

  useDeleteSelf: TEndpoint extends { delete: unknown }
    ? () => UseMutationResult<void, Error, void>
    : never

  // short aliases
  index: CrudHooks<TTypes, TEndpoint, TGroupName>['useIndex']
  show: CrudHooks<TTypes, TEndpoint, TGroupName>['useShow']
  create: CrudHooks<TTypes, TEndpoint, TGroupName>['useCreate']
  update: CrudHooks<TTypes, TEndpoint, TGroupName>['useUpdate']
  updateSelf: CrudHooks<TTypes, TEndpoint, TGroupName>['useUpdateSelf']
  patch: CrudHooks<TTypes, TEndpoint, TGroupName>['useUpdateSelf']
  put: CrudHooks<TTypes, TEndpoint, TGroupName>['useUpdateSelf']
  remove: CrudHooks<TTypes, TEndpoint, TGroupName>['useRemove']
  delete: CrudHooks<TTypes, TEndpoint, TGroupName>['useRemove']
  deleteSelf: CrudHooks<TTypes, TEndpoint, TGroupName>['useDeleteSelf']
}

type UnifiedGroupHookResult<TTypes, TEndpoint, TGroupName extends string> = {
  list: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never] ? undefined : UseQueryResult<L, Error>
    : TEndpoint extends { list: EndpointCallable<infer L, unknown, unknown, HttpMethod> }
      ? UseQueryResult<L, Error>
      : undefined

  detail: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never] ? undefined : UseQueryResult<D, Error>
    : undefined

  create: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never] ? undefined : UseMutationResult<
        TEndpoint extends { create: infer TC } ? InferResponse<TC> : unknown,
        Error,
        C
      >
    : undefined

  update: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? undefined : UseMutationResult<
        TEndpoint extends { update: infer TU } ? InferResponse<TU> : unknown,
        Error,
        { id: number; data: U }
      >
    : undefined

  updateSelf: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? undefined : UseMutationResult<
        TEndpoint extends { updateSelf: infer TU } ? InferResponse<TU> : TEndpoint extends { update: infer TU } ? InferResponse<TU> : TEndpoint extends { put: infer TU } ? InferResponse<TU> : TEndpoint extends { patch: infer TU } ? InferResponse<TU> : unknown,
        Error,
        U
      >
    : undefined

  delete: TEndpoint extends { delete: unknown } | { remove: unknown }
    ? UseMutationResult<void, Error, number>
    : undefined

  deleteSelf: TEndpoint extends { delete: unknown }
    ? UseMutationResult<void, Error, void>
    : undefined
} & {
  [Key in TGroupName]: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never]
      ? [TTypes] extends [{ list: infer L }]
        ? [L] extends [never] ? undefined : L | undefined
        : undefined
      : D | undefined
    : [TTypes] extends [{ list: infer L }]
      ? [L] extends [never] ? undefined : L | undefined
      : undefined
} & {
  isLoading: boolean
  error: Error | null
}

type HooksForGroup<TTypes, TEndpoint, TGroupName extends string> = ((optionsOrId?: number | { id?: number; list?: boolean }) => UnifiedGroupHookResult<TTypes, TEndpoint, TGroupName>) & CrudHooks<TTypes, TEndpoint, TGroupName> & EndpointHooks<TEndpoint> & { endpoint: TEndpoint }

// ─── HookConfig ───────────────────────────────────────────────────────────────

type InvalidateList = Array<((...args: never[]) => readonly unknown[]) | readonly unknown[]>

export interface HookConfig {
  types?: {
    list?: unknown
    detail?: unknown
    create?: unknown
    update?: unknown
  }
  queryKey: unknown
  actionKeys?: Record<string, (...args: never[]) => readonly unknown[]>
  endpoint: unknown
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
  domain?: string
}

// ─── defineHooks ─────────────────────────────────────────────────────────────

export function defineHooks<TConfig extends Record<string, HookConfig>>(
  config: TConfig
): { [K in keyof TConfig]: HooksForGroup<TConfig[K]['types'], TConfig[K]['endpoint'], K & string> } {
  const hooks = {} as { [K in keyof TConfig]: HooksForGroup<TConfig[K]['types'], TConfig[K]['endpoint'], K & string> }

  for (const groupName in config) {
    const groupConfig = config[groupName]
    const group = groupConfig.endpoint as Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>
    const groupQueryKeys = groupConfig.queryKey as Record<string, (...args: unknown[]) => readonly unknown[]> | undefined

    // ── Resolve CRUD standard slots ──────────────────────────────────────────
    const indexService  = group.list
    const showService   = group.get ?? group.show
    // update: param-based (PUT/PATCH + :id) → first-wins
    const updateService = group.update
    // updateSelf: no-param PUT/PATCH (e.g. PATCH /profile) — put sebelum patch
    const updateSelfService = !updateService ? (group.put ?? group.patch) : undefined
    // kalau update tidak ada, put/patch tanpa param masuk ke updateSelf
    const resolvedUpdateSelf = group.put ?? group.patch
    const deleteService     = group.remove ?? ((group.delete?.$def?.path as string)?.includes(':') ? group.delete : undefined)
    const deleteSelfService = !deleteService
      ? (group.delete?.$def && !(group.delete?.$def?.path as string)?.includes(':') ? group.delete : undefined)
      : undefined

    // ── Resolve extra (non-CRUD) endpoints ───────────────────────────────────
    const CRUD_KEYS = new Set(['list', 'get', 'show', 'create', 'update', 'put', 'patch', 'delete', 'remove'])
    const extras: Record<string, { service: unknown; method?: string; queryKey?: (...args: never[]) => readonly unknown[]; invalidate?: InvalidateList }> = {}

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

    // Extract actual param key names from path fn signatures so PathResolver
    // doesn't resolve to undefined when param isn't named 'id' (e.g. produkItemId).
    const showParamKey   = showService   ? extractParamKey(showService)   : 'id'
    const updateParamKey = updateService ? extractParamKey(updateService) : 'id'
    const deleteParamKey = deleteService ? extractParamKey(deleteService) : 'id'

    const crudHooks = createCrudHooks({
      groupName,
      domain: groupConfig.domain,
      queryKey: { list: listKey, detail: detailKey },
      service: {
        index:      indexService      ? toIndexFn(indexService)                : undefined,
        show:       showService       ? toShowFn(showService as EndpointCallable<unknown, Record<string, unknown>, unknown, HttpMethod>, showParamKey)    : undefined,
        create:     group.create      ?? undefined,
        update:     updateService
          ? (id: number, data: unknown) => updateService({ params: { [updateParamKey]: id }, body: data })
          : undefined,
        updateSelf: resolvedUpdateSelf ?? undefined,
        delete:     deleteService
          ? async (id: number) => { await deleteService({ params: { [deleteParamKey]: id } }) }
          : undefined,
        deleteSelf: deleteSelfService
          ? async () => { await deleteSelfService() }
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

    const unifiedHook = (optionsOrId?: number | { id?: number; list?: boolean }) => {
      const id = typeof optionsOrId === 'number' ? optionsOrId : optionsOrId?.id
      const listOption = typeof optionsOrId === 'object' ? optionsOrId?.list : undefined

      const shouldFetchList = !!indexService && id === undefined && listOption !== false
      const shouldFetchDetail = !!showService && id !== undefined

      const listQueryResult = indexService !== undefined ? crudHooks.index({ enabled: shouldFetchList }) : undefined
      const detailQueryResult = showService !== undefined ? crudHooks.show(id ?? 0, { enabled: shouldFetchDetail }) : undefined

      const createMutation = group.create !== undefined ? crudHooks.create() : undefined
      const updateMutation = updateService !== undefined ? crudHooks.update() : undefined
      const updateSelfMutation = resolvedUpdateSelf !== undefined ? crudHooks.updateSelf() : undefined
      const deleteMutation = deleteService !== undefined ? crudHooks.delete() : undefined
      const deleteSelfMutation = deleteSelfService !== undefined ? crudHooks.deleteSelf() : undefined

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
    ;(unifiedHook as unknown as { endpoint: unknown }).endpoint = group

    const hooksMap = hooks as Record<string, unknown>
    hooksMap[groupName] = unifiedHook
  }

  return hooks
}
