import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, ApiError, RouteDefinition } from '@routesync/sdk'
import { PathResolver, HttpMethod } from '@routesync/core'
import { createCrudHooks, useAggregateCollectionIntent, AggregateCollectionIntentActions, AggregateCollectionConfig } from './createCrudHooks'
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

type ResolveActionMutation<TConfig, TRes, TAct> =
  TRes extends keyof TConfig
    ? TConfig[TRes] extends HookConfig
      ? TAct extends keyof CrudHooks<TConfig[TRes]['types'], TConfig[TRes]['endpoint'], TRes & string>
        ? CrudHooks<TConfig[TRes]['types'], TConfig[TRes]['endpoint'], TRes & string>[TAct] extends (...args: never[]) => unknown
          ? ReturnType<CrudHooks<TConfig[TRes]['types'], TConfig[TRes]['endpoint'], TRes & string>[TAct]>
          : unknown
        : unknown
      : unknown
    : unknown

type ResolveOpPath<TOps, TKey1 extends string, TKey2 extends string = ""> =
  TOps extends object
    ? TKey2 extends ""
      ? TKey1 extends keyof TOps ? TOps[TKey1] : unknown
      : TKey1 extends keyof TOps
        ? TOps[TKey1] extends object
          ? TKey2 extends keyof TOps[TKey1]
            ? TOps[TKey1][TKey2]
            : unknown
          : unknown
        : unknown
    : unknown

type ResolveMutationType<TConfig, TOp> =
  TOp extends { operationId: infer TOpId }
    ? TOpId extends `${infer TGroup}.${infer TAction}`
      ? ResolveActionMutation<TConfig, TGroup, TAction>
      : unknown
    : TOp extends { resource: infer TRes; action: infer TAct }
      ? ResolveActionMutation<TConfig, TRes, TAct>
      : TOp extends `${infer TGroup}.${infer TAction}`
        ? ResolveActionMutation<TConfig, TGroup, TAction>
        : unknown

type ResolveIntentFromObj<TConfig, TIntent> =
  TIntent extends { capabilities: infer TCaps }
    ? TIntent extends { config: infer TCfg }
      ? ResolveOpPath<TCaps, "items"> extends object
        ? AggregateCollectionIntentActions<
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "items", "create">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "items", "update">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "items", "remove">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "promotion", "apply">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "promotion", "remove">>,
            TCfg extends { identityField: infer TIdField } ? (TIdField extends string ? TIdField : "id") : "id",
            TCfg extends { quantityField: infer TQtyField } ? (TQtyField extends string ? TQtyField : "qty") : "qty"
          >
        : AggregateCollectionIntentActions<
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "createItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "updateItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "removeItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "applyPromo">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "removePromo">>,
            TCfg extends { identityField: infer TIdField } ? (TIdField extends string ? TIdField : "id") : "id",
            TCfg extends { quantityField: infer TQtyField } ? (TQtyField extends string ? TQtyField : "qty") : "qty"
          >
      : ResolveOpPath<TCaps, "items"> extends object
        ? AggregateCollectionIntentActions<
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "items", "create">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "items", "update">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "items", "remove">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "promotion", "apply">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "promotion", "remove">>
          >
        : AggregateCollectionIntentActions<
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "createItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "updateItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "removeItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "applyPromo">>,
            ResolveMutationType<TConfig, ResolveOpPath<TCaps, "removePromo">>
          >
    : TIntent extends { operations: infer TOps }
      ? TIntent extends { config: infer TCfg }
        ? AggregateCollectionIntentActions<
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "createItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "updateItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "removeItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "applyPromo">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "removePromo">>,
            TCfg extends { identityField: infer TIdField } ? (TIdField extends string ? TIdField : "id") : "id",
            TCfg extends { quantityField: infer TQtyField } ? (TQtyField extends string ? TQtyField : "qty") : "qty"
          >
        : AggregateCollectionIntentActions<
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "createItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "updateItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "removeItem">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "applyPromo">>,
            ResolveMutationType<TConfig, ResolveOpPath<TOps, "removePromo">>
          >
      : unknown

type GetIntentActions<TConfig, TConfigK, TGroupName extends string, TManifest = unknown> = TConfigK extends {
  intent: infer TIntent
}
  ? ResolveIntentFromObj<TConfig, TIntent>
  : TManifest extends {
      domains: {
        [K in TGroupName]: infer TDomainEntry
      }
    }
    ? ResolveIntentFromObj<TConfig, TDomainEntry>
    : unknown

type HooksForGroup<TConfig, TConfigK extends HookConfig, TGroupName extends string, TManifest = unknown> = ((optionsOrId?: number | { id?: number; list?: boolean }) => UnifiedGroupHookResult<TConfigK['types'], TConfigK['endpoint'], TGroupName> & GetIntentActions<TConfig, TConfigK, TGroupName, TManifest>) & CrudHooks<TConfigK['types'], TConfigK['endpoint'], TGroupName> & EndpointHooks<TConfigK['endpoint']> & { endpoint: TConfigK['endpoint'] }

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
  intent?: unknown
}

export const hasKey = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return (typeof obj === 'object' || typeof obj === 'function') && obj !== null && key in obj
}

const getHookMethodResult = (hookObj: unknown, method: string): unknown => {
  if (hasKey(hookObj, method)) {
    const fn = hookObj[method]
    if (typeof fn === 'function') {
      return fn()
    }
  }
  return null
}

const resolveMutation = (ops: unknown, opKey: string, hooksMap: Record<string, unknown>): unknown => {
  if (hasKey(ops, opKey)) {
    const val = ops[opKey]
    if (typeof val === 'string' && val) {
      const parts = val.split('.')
      if (parts.length === 2) {
        return getHookMethodResult(hooksMap[parts[0]], parts[1])
      }
    } else if (val && typeof val === 'object') {
      if (hasKey(val, 'operationId') && typeof val.operationId === 'string') {
        const parts = val.operationId.split('.')
        if (parts.length === 2) {
          return getHookMethodResult(hooksMap[parts[0]], parts[1])
        }
      } else if (hasKey(val, 'resource') && typeof val.resource === 'string' && hasKey(val, 'action') && typeof val.action === 'string') {
        return getHookMethodResult(hooksMap[val.resource], val.action)
      }
    }
  }
  return null
}

// ─── defineHooks ─────────────────────────────────────────────────────────────

export function defineHooks<TConfig extends Record<string, HookConfig>, TManifest = unknown>(
  config: TConfig,
  runtimeManifest?: TManifest
): { [K in keyof TConfig]: HooksForGroup<TConfig, TConfig[K], K & string, TManifest> } {
  const hooks = {} as { [K in keyof TConfig]: HooksForGroup<TConfig, TConfig[K], K & string, TManifest> }

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
    if (hasKey(unifiedHook, 'endpoint')) {
      unifiedHook.endpoint = group
    }

    let finalHook: unknown = unifiedHook
    const hooksMap = hooks as Record<string, unknown>

    let intent = groupConfig.intent
    if (!intent && runtimeManifest && typeof runtimeManifest === 'object') {
      if (hasKey(runtimeManifest, 'domains') && runtimeManifest.domains && typeof runtimeManifest.domains === 'object') {
        const domains = runtimeManifest.domains
        if (hasKey(domains, groupName)) {
          intent = domains[groupName]
        }
      }
    }

    if (intent && typeof intent === 'object') {
      const intentType = hasKey(intent, 'type') && typeof intent.type === 'string' ? intent.type : ''
      if (intentType === 'AggregateCollection' || intentType === 'cart') {
        const ops = hasKey(intent, 'capabilities') && typeof intent.capabilities === 'object' && intent.capabilities !== null
          ? intent.capabilities
          : hasKey(intent, 'operations') && typeof intent.operations === 'object' && intent.operations !== null
            ? intent.operations
            : {}
        const cfg = hasKey(intent, 'config') && typeof intent.config === 'object' && intent.config !== null ? intent.config : {}

        const itemsGroup = hasKey(ops, 'items') && typeof ops.items === 'object' && ops.items !== null ? ops.items : {}
        const promoGroup = hasKey(ops, 'promotion') && typeof ops.promotion === 'object' && ops.promotion !== null ? ops.promotion : {}

      const wrappedHook = (optionsOrId?: number | { id?: number; list?: boolean }) => {
        const result = unifiedHook(optionsOrId)
        
        const createItemMut = resolveMutation(itemsGroup, 'create', hooksMap) || resolveMutation(ops, 'createItem', hooksMap)
        const updateItemMut = resolveMutation(itemsGroup, 'update', hooksMap) || resolveMutation(ops, 'updateItem', hooksMap)
        const removeItemMut = resolveMutation(itemsGroup, 'remove', hooksMap) || resolveMutation(ops, 'removeItem', hooksMap)
        const applyPromoMut  = resolveMutation(promoGroup, 'apply', hooksMap) || resolveMutation(ops, 'applyPromo', hooksMap)
        const removePromoMut = resolveMutation(promoGroup, 'remove', hooksMap) || resolveMutation(ops, 'removePromo', hooksMap)

        const collectionField = hasKey(cfg, 'collectionField') && typeof cfg.collectionField === 'string'
          ? cfg.collectionField
          : hasKey(cfg, 'itemsField') && typeof cfg.itemsField === 'string'
            ? cfg.itemsField
            : ''
        const identityField = hasKey(cfg, 'identityField') && typeof cfg.identityField === 'string'
          ? cfg.identityField
          : hasKey(cfg, 'itemKey') && typeof cfg.itemKey === 'string'
            ? cfg.itemKey
            : ''
        const quantityField = hasKey(cfg, 'quantityField') && typeof cfg.quantityField === 'string'
          ? cfg.quantityField
          : hasKey(cfg, 'qtyField') && typeof cfg.qtyField === 'string'
            ? cfg.qtyField
            : ''
        const promotionCodeField = hasKey(cfg, 'promotionCodeField') && typeof cfg.promotionCodeField === 'string'
          ? cfg.promotionCodeField
          : hasKey(cfg, 'promoKey') && typeof cfg.promoKey === 'string'
            ? cfg.promoKey
            : ''

        if (!collectionField || !identityField || !quantityField || !promotionCodeField) {
          throw new Error(`Missing resolved intent config for domain group ${groupName}`)
        }

        return useAggregateCollectionIntent(result, {
          createItem: createItemMut,
          updateItem: updateItemMut,
          removeItem: removeItemMut,
          applyPromo: applyPromoMut,
          removePromo: removePromoMut,
        }, {
          collectionField,
          identityField,
          quantityField,
          groupName,
          promotionCodeField
        })
      }

      Object.assign(wrappedHook, crudHooks)
      if (hasKey(wrappedHook, 'endpoint')) {
        wrappedHook.endpoint = group
      }
      finalHook = wrappedHook
    }
  }

    hooksMap[groupName] = finalHook
  }

  return hooks
}
