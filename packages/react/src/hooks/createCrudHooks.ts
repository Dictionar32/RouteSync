import { useQuery, useMutation, useQueryClient, QueryClient, UseMutationResult } from '@tanstack/react-query'
import { PathResolver } from '@routesync/core'
import { getClient } from '@routesync/sdk'
import { useRef, useCallback } from 'react'

export interface AggregateCollectionConfig {
  collectionField: string
  identityField: string
  quantityField: string
  groupName: string
  promotionCodeField: string
}

export interface AggregateCollectionIntentActions<
  TCreate,
  TUpdate,
  TRemove,
  TApply,
  TRemovePromo,
  TIdentityField extends string = 'id',
  TQuantityField extends string = 'qty'
> {
  items: {
    add: (
      idVal: TCreate extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends { [K in TIdentityField]: infer TId }
          ? TId
          : string | number
        : string | number,
      qty?: number
    ) => Promise<unknown>
    changeQty: (
      idVal: TCreate extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends { [K in TIdentityField]: infer TId }
          ? TId
          : string | number
        : string | number,
      delta: number
    ) => Promise<unknown>
    setQty: (
      idVal: TCreate extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends { [K in TIdentityField]: infer TId }
          ? TId
          : string | number
        : string | number,
      qty: number
    ) => Promise<unknown>
    remove: (
      idVal: TRemove extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends number
          ? number
          : TVar extends string
            ? string
            : string | number
        : string | number
    ) => Promise<unknown>
    createMut: TCreate
    updateMut: TUpdate
    removeMut: TRemove
  }
  promotions: {
    apply: (code: string) => Promise<unknown>
    remove: () => Promise<unknown>
    applyMut: TApply
    removeMut: TRemovePromo
  }
  on: (event: string, callback: (...args: unknown[]) => void) => () => void
}

const hasKey = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj
}

const getNumberValue = (obj: unknown, key: string): number => {
  if (hasKey(obj, key)) {
    const val = obj[key]
    if (typeof val === 'number') return val
  }
  return 0
}

const callMutate = (mut: unknown, arg: unknown): Promise<unknown> => {
  if (typeof mut === 'object' && mut !== null && 'mutateAsync' in mut) {
    const fn = mut.mutateAsync
    if (typeof fn === 'function') {
      const res = fn(arg)
      if (res instanceof Promise) {
        return res
      }
      return Promise.resolve(res)
    }
  }
  return Promise.resolve(null)
}

export const useAggregateCollectionIntent = <
  TResult extends object,
  TCreate,
  TUpdate,
  TRemove,
  TApply,
  TRemovePromo
>(
  result: TResult,
  mutations: {
    createItem: TCreate
    updateItem: TUpdate
    removeItem: TRemove
    applyPromo: TApply
    removePromo: TRemovePromo
  },
  config: AggregateCollectionConfig
): TResult & AggregateCollectionIntentActions<TCreate, TUpdate, TRemove, TApply, TRemovePromo> => {
  const { createItem, updateItem, removeItem, applyPromo, removePromo } = mutations
  const { collectionField, identityField, quantityField, groupName, promotionCodeField } = config

  const listenersRef = useRef(new Map<string, Array<(...args: unknown[]) => void>>())

  const on = useCallback((event: string, cb: (...args: unknown[]) => void) => {
    const listeners = listenersRef.current
    if (!listeners.has(event)) listeners.set(event, [])
    listeners.get(event)!.push(cb)
    return () => {
      const list = listeners.get(event)
      if (list) {
        const idx = list.indexOf(cb)
        if (idx !== -1) list.splice(idx, 1)
      }
    }
  }, [])

  const emit = useCallback((event: string, ...args: unknown[]) => {
    const list = listenersRef.current.get(event)
    if (list) {
      list.forEach(cb => {
        try { cb(...args) } catch (e) {}
      })
    }
  }, [])

  const getQty = (idVal: string | number): number => {
    let cartData: unknown = result
    if (hasKey(result, groupName)) {
      cartData = result[groupName]
    } else if (hasKey(result, 'data')) {
      cartData = result.data
    }

    if (hasKey(cartData, collectionField)) {
      const items = cartData[collectionField]
      if (Array.isArray(items)) {
        const item = items.find((i: unknown) => {
          return hasKey(i, identityField) && String(i[identityField]) === String(idVal)
        })
        return getNumberValue(item, quantityField)
      }
    }
    return 0
  }

  const setQty = async (idVal: string | number, qty: number) => {
    const currentQty = getQty(idVal)
    if (qty <= 0) {
      return callMutate(removeItem, idVal)
    }
    try {
      let res: unknown
      if (currentQty === 0) {
        res = await callMutate(createItem, { [identityField]: String(idVal), [quantityField]: qty })
      } else {
        res = await callMutate(updateItem, { id: idVal, data: { [quantityField]: qty } })
      }
      emit('add:success', res)
      emit('added', res)
      return res
    } catch (err) {
      emit('add:error', err)
      throw err
    }
  }

  const changeQty = async (idVal: string | number, delta: number) => {
    const currentQty = getQty(idVal)
    const targetQty = currentQty + delta
    return setQty(idVal, targetQty)
  }

  const add = async (idVal: string | number, qty = 1) => {
    const currentQty = getQty(idVal)
    try {
      let res: unknown
      if (currentQty === 0) {
        res = await callMutate(createItem, { [identityField]: String(idVal), [quantityField]: qty })
      } else {
        res = await callMutate(updateItem, { id: idVal, data: { [quantityField]: currentQty + qty } })
      }
      emit('add:success', res)
      emit('added', res)
      return res
    } catch (err) {
      emit('add:error', err)
      throw err
    }
  }

  const remove = async (idVal: string | number) => {
    try {
      const res = await callMutate(removeItem, idVal)
      emit('remove:success', res)
      emit('removed', res)
      return res
    } catch (err) {
      emit('remove:error', err)
      throw err
    }
  }

  const applyPromoCode = async (code: string) => {
    try {
      const res = await callMutate(applyPromo, { [promotionCodeField]: code })
      emit('applyPromo:success', res)
      emit('promoApplied', res)
      return res
    } catch (err) {
      emit('applyPromo:error', err)
      throw err
    }
  }

  const removePromoCode = async () => {
    try {
      const res = await callMutate(removePromo, undefined)
      emit('removePromo:success', res)
      emit('promoRemoved', res)
      return res
    } catch (err) {
      emit('removePromo:error', err)
      throw err
    }
  }

  return Object.assign(result, {
    items: {
      add,
      changeQty,
      setQty,
      remove,
      createMut: createItem,
      updateMut: updateItem,
      removeMut: removeItem,
    },
    promotions: {
      apply: applyPromoCode,
      remove: removePromoCode,
      applyMut: applyPromo,
      removeMut: removePromo,
    },
    on
  })
}

const requireValidId = (id: unknown): number => {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`)
  }
  return parsed
}

const isEndpoint = (fn: unknown): boolean => typeof fn === 'function' && !!(fn as { $def?: unknown }).$def

const callIndex = (svc: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as () => Promise<unknown>)()
    : (svc as () => Promise<unknown>)()

const callShow = (svc: unknown, id: number): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ params: { id } })
    : (svc as (id: number) => Promise<unknown>)(id)

const callCreate = (svc: unknown, data: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ body: data })
    : (svc as (data: unknown) => Promise<unknown>)(data)

const callUpdate = (svc: unknown, id: number, data: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ params: { id }, body: data })
    : (svc as (id: number, data: unknown) => Promise<unknown>)(id, data)

const callUpdateNoParam = (svc: unknown, data: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ body: data })
    : (svc as (data: unknown) => Promise<unknown>)(data)

const callDelete = (svc: unknown, id: number): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ params: { id } })
    : (svc as (id: number) => Promise<unknown>)(id)

const callDeleteNoParam = (svc: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as () => Promise<unknown>)()
    : (svc as () => Promise<unknown>)()

const getToastMessage = (action: 'create' | 'update' | 'remove', status: 'success' | 'error', groupName: string): string => {
  const displayName = groupName.charAt(0).toUpperCase() + groupName.slice(1)
  if (status === 'success') {
    if (action === 'create') return `Berhasil menambahkan ${displayName}`
    if (action === 'update') return `Berhasil memperbarui ${displayName}`
    if (action === 'remove') return `Berhasil menghapus ${displayName}`
  } else {
    if (action === 'create') return `Gagal menambahkan ${displayName}`
    if (action === 'update') return `Gagal memperbarui ${displayName}`
    if (action === 'remove') return `Gagal menghapus ${displayName}`
  }
  return ''
}

const getSuccessMessage = (data: unknown, action: 'create' | 'update' | 'remove', groupName: string): string => {
  if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
    return (data as { message: string }).message
  }
  return getToastMessage(action, 'success', groupName)
}

const getErrorMessage = (error: unknown, action: 'create' | 'update' | 'remove', groupName: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const resData = (error as { response?: { data?: unknown } }).response?.data
    if (resData && typeof resData === 'object' && 'message' in resData && typeof (resData as { message: unknown }).message === 'string') {
      return (resData as { message: string }).message
    }
  }
  return getToastMessage(action, 'error', groupName)
}

type InvalidateList = Array<((...args: never[]) => readonly unknown[]) | readonly unknown[]>

type ExtraEndpoint = {
  service: unknown
  method?: string
  queryKey?: (...args: never[]) => readonly unknown[]
  invalidate?: InvalidateList
}

export const createCrudHooks = <
  ReadIndexList,
  ReadShow,
  CreateForm,
  UpdateForm
>(config: {
  groupName?: string
  domain?: string
  queryKey: {
    list: () => readonly unknown[]
    detail: (id: number) => readonly unknown[]
  }
  service: {
    index?: () => Promise<ReadIndexList>
    show?: (id: number) => Promise<ReadShow>
    create?: (data: CreateForm) => Promise<ReadShow>
    update?: (id: number, data: UpdateForm) => Promise<ReadShow>
    updateSelf?: (data: UpdateForm) => Promise<ReadShow>
    delete?: (id: number) => Promise<void>
    deleteSelf?: () => Promise<void>
  }
  cache?: {
    create?: { invalidate?: InvalidateList }
    update?: { invalidate?: InvalidateList }
    updateSelf?: { invalidate?: InvalidateList }
    delete?: { invalidate?: InvalidateList }
    deleteSelf?: { invalidate?: InvalidateList }
  }
  extras?: Record<string, ExtraEndpoint>
}) => {
  const { service, queryKey, groupName } = config

  const resolveInvalidate = (qc: QueryClient, list: InvalidateList | undefined, arg?: unknown) => {
    if (!list) return
    list.forEach(inv => {
      const key = typeof inv === 'function' ? (inv as (...args: unknown[]) => readonly unknown[])(arg) : inv
      qc.invalidateQueries({ queryKey: key })
    })
  }

  // ── useIndex ──────────────────────────────────────────────────────────────
  const useIndex = (options?: unknown) => {
    if (!service.index) throw new Error('Index is not supported for this resource')
    const query = useQuery({
      ...(options as Record<string, unknown>),
      queryKey: queryKey.list(),
      queryFn: () => callIndex(service.index),
    })
    return groupName ? Object.assign(query, { [groupName]: query.data }) : query
  }

  // ── useShow ───────────────────────────────────────────────────────────────
  const useShow = (id: number, options?: unknown) => {
    if (!service.show) throw new Error('Show is not supported for this resource')
    const validId = Number(id)
    const enabled = Number.isInteger(validId) && validId > 0
    const resolvedEnabled = options && typeof options === 'object' && 'enabled' in options ? (options as { enabled?: boolean }).enabled : enabled
    const query = useQuery({
      ...(options as Record<string, unknown>),
      queryKey: queryKey.detail(validId),
      enabled: enabled && resolvedEnabled,
      queryFn: () => callShow(service.show, requireValidId(validId)),
    })
    return groupName ? Object.assign(query, { [groupName]: query.data }) : query
  }

  // ── useCreate ─────────────────────────────────────────────────────────────
  const useCreate = (mutationOptions?: unknown) => {
    const svc = service.create
    if (!svc) throw new Error('Create is not supported for this resource')
    const qc = useQueryClient()
    const options = mutationOptions as Record<string, unknown> | undefined
    return useMutation({
      ...options,
      mutationFn: (data: CreateForm) => callCreate(svc, data),
      onSuccess: (data: unknown, variables: CreateForm, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        resolveInvalidate(qc, config.cache?.create?.invalidate)
        
        try {
          const client = getClient()
          const msg = getSuccessMessage(data, 'create', groupName || '')
          if (msg) client.config.toast?.success?.(msg)
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: CreateForm, context: unknown) => void } | undefined
        opt?.onSuccess?.(data, variables, context)
      },
      onError: (error: unknown, variables: CreateForm, context: unknown) => {
        try {
          const client = getClient()
          const msg = getErrorMessage(error, 'create', groupName || '')
          if (msg) client.config.toast?.error?.(msg)
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: CreateForm, context: unknown) => void } | undefined
        opt?.onError?.(error, variables, context)
      }
    })
  }

  // ── useUpdate ─────────────────────────────────────────────────────────────
  const useUpdate = (mutationOptions?: unknown) => {
    const svc = service.update
    if (!svc) throw new Error('Update is not supported for this resource')
    const qc = useQueryClient()
    const options = mutationOptions as Record<string, unknown> | undefined
    return useMutation({
      ...options,
      mutationFn: ({ id, data }: { id: number; data: UpdateForm }) =>
        callUpdate(svc, requireValidId(id), data),
      onSuccess: (data: unknown, vars: { id: number; data: UpdateForm }, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        qc.invalidateQueries({ queryKey: queryKey.detail(vars.id) })
        resolveInvalidate(qc, config.cache?.update?.invalidate, vars.id)

        try {
          const client = getClient()
          const msg = getSuccessMessage(data, 'update', groupName || '')
          if (msg) client.config.toast?.success?.(msg)
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: { id: number; data: UpdateForm }, context: unknown) => void } | undefined
        opt?.onSuccess?.(data, vars, context)
      },
      onError: (error: unknown, vars: { id: number; data: UpdateForm }, context: unknown) => {
        try {
          const client = getClient()
          const msg = getErrorMessage(error, 'update', groupName || '')
          if (msg) client.config.toast?.error?.(msg)
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: { id: number; data: UpdateForm }, context: unknown) => void } | undefined
        opt?.onError?.(error, vars, context)
      }
    })
  }

  // ── useUpdateSelf ─────────────────────────────────────────────────────────
  const useUpdateSelf = (mutationOptions?: unknown) => {
    const svc = service.updateSelf
    if (!svc) throw new Error('UpdateSelf is not supported for this resource')
    const qc = useQueryClient()
    const options = mutationOptions as Record<string, unknown> | undefined
    return useMutation({
      ...options,
      mutationFn: (data: UpdateForm) => callUpdateNoParam(svc, data),
      onSuccess: (data: unknown, variables: UpdateForm, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        resolveInvalidate(qc, config.cache?.updateSelf?.invalidate)

        try {
          const client = getClient()
          const msg = getSuccessMessage(data, 'update', groupName || '')
          if (msg) client.config.toast?.success?.(msg)
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: UpdateForm, context: unknown) => void } | undefined
        opt?.onSuccess?.(data, variables, context)
      },
      onError: (error: unknown, variables: UpdateForm, context: unknown) => {
        try {
          const client = getClient()
          const msg = getErrorMessage(error, 'update', groupName || '')
          if (msg) client.config.toast?.error?.(msg)
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: UpdateForm, context: unknown) => void } | undefined
        opt?.onError?.(error, variables, context)
      }
    })
  }

  // ── useRemove ─────────────────────────────────────────────────────────────
  const useRemove = (mutationOptions?: unknown) => {
    const svc = service.delete ?? service.deleteSelf
    if (!svc) throw new Error('Delete is not supported for this resource')
    const qc = useQueryClient()
    const options = mutationOptions as Record<string, unknown> | undefined
    return useMutation({
      ...options,
      mutationFn: (id?: number) => {
        if (service.delete) {
          return callDelete(service.delete, requireValidId(id))
        }
        return callDeleteNoParam(service.deleteSelf)
      },
      onSuccess: (data: unknown, id: number | undefined, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        if (id !== undefined && service.delete) {
          qc.invalidateQueries({ queryKey: queryKey.detail(id) })
        }
        resolveInvalidate(qc, config.cache?.delete?.invalidate ?? config.cache?.deleteSelf?.invalidate, id)

        try {
          const client = getClient()
          const msg = getSuccessMessage(data, 'remove', groupName || '')
          if (msg) client.config.toast?.success?.(msg)
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: number | undefined, context: unknown) => void } | undefined
        opt?.onSuccess?.(data, id, context)
      },
      onError: (error: unknown, id: number | undefined, context: unknown) => {
        try {
          const client = getClient()
          const msg = getErrorMessage(error, 'remove', groupName || '')
          if (msg) client.config.toast?.error?.(msg)
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: number | undefined, context: unknown) => void } | undefined
        opt?.onError?.(error, id, context)
      }
    })
  }

  // ── useDeleteSelf ─────────────────────────────────────────────────────────
  const useDeleteSelf = (mutationOptions?: unknown) => {
    const svc = service.deleteSelf
    if (!svc) throw new Error('DeleteSelf is not supported for this resource')
    const qc = useQueryClient()
    const options = mutationOptions as Record<string, unknown> | undefined
    return useMutation({
      ...options,
      mutationFn: () => callDeleteNoParam(svc),
      onSuccess: (data: unknown, variables: void, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        resolveInvalidate(qc, config.cache?.deleteSelf?.invalidate)

        try {
          const client = getClient()
          const msg = getSuccessMessage(data, 'remove', groupName || '')
          if (msg) client.config.toast?.success?.(msg)
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: void, context: unknown) => void } | undefined
        opt?.onSuccess?.(data, variables, context)
      },
      onError: (error: unknown, variables: void, context: unknown) => {
        try {
          const client = getClient()
          const msg = getErrorMessage(error, 'remove', groupName || '')
          if (msg) client.config.toast?.error?.(msg)
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: void, context: unknown) => void } | undefined
        opt?.onError?.(error, variables, context)
      }
    })
  }

  // ── extras ─────────────────────────────────────────────────────────────────
  const extraHooks: Record<string, (...args: unknown[]) => unknown> = {}

  if (config.extras) {
    for (const [name, extra] of Object.entries(config.extras)) {
      const hookName = `use${name.charAt(0).toUpperCase()}${name.slice(1)}`
      const method = extra.method ?? (isEndpoint(extra.service) ? (extra.service as { $def?: { method?: string } }).$def?.method : 'POST')

      if (method === 'GET') {
        extraHooks[hookName] = (options?: unknown, queryOptions?: unknown) => {
          const resolvedKey = extra.queryKey
            ? (extra.queryKey as (opt?: unknown) => readonly unknown[])(options)
            : [...queryKey.list(), name, options].filter(Boolean)
          const svc = extra.service as (opts?: unknown) => Promise<unknown>
          return useQuery({
            ...(queryOptions as Record<string, unknown>),
            queryKey: resolvedKey,
            queryFn: () => svc(options),
          })
        }
      } else {
        extraHooks[hookName] = (mutationOptions?: unknown) => {
          const qc = useQueryClient()
          const options = mutationOptions as Record<string, unknown> | undefined
          return useMutation({
            ...options,
            mutationFn: (variables: unknown) => {
              const svc = extra.service as (opts?: unknown) => Promise<unknown>
              return svc(variables)
            },
            onSuccess: (data: unknown, variables: unknown, context: unknown) => {
              if (extra.queryKey) {
                qc.invalidateQueries({ queryKey: (extra.queryKey as (opt?: unknown) => readonly unknown[])(variables) })
              }
              if (extra.invalidate) {
                extra.invalidate.forEach(inv => {
                  const key = typeof inv === 'function' ? (inv as (...args: unknown[]) => readonly unknown[])(variables) : inv
                  qc.invalidateQueries({ queryKey: key })
                })
              }

              try {
                const client = getClient()
                const action: 'create' | 'update' | 'remove' | '' = 
                  name.startsWith('create') || name.startsWith('add') || name.startsWith('apply') ? 'create' : 
                  name.startsWith('update') || name.startsWith('set') || name.startsWith('change') ? 'update' : 
                  name.startsWith('remove') || name.startsWith('delete') || name.startsWith('clear') ? 'remove' : ''
                if (action) {
                  const msg = getSuccessMessage(data, action, groupName || '')
                  if (msg) client.config.toast?.success?.(msg)
                }
              } catch (e) {}

              const opt = options as { onSuccess?: (data: unknown, variables: unknown, context: unknown) => void } | undefined
              opt?.onSuccess?.(data, variables, context)
            },
            onError: (error: unknown, variables: unknown, context: unknown) => {
              try {
                const client = getClient()
                const action: 'create' | 'update' | 'remove' | '' = 
                  name.startsWith('create') || name.startsWith('add') || name.startsWith('apply') ? 'create' : 
                  name.startsWith('update') || name.startsWith('set') || name.startsWith('change') ? 'update' : 
                  name.startsWith('remove') || name.startsWith('delete') || name.startsWith('clear') ? 'remove' : ''
                if (action) {
                  const msg = getErrorMessage(error, action, groupName || '')
                  if (msg) client.config.toast?.error?.(msg)
                }
              } catch (e) {}

              const opt = options as { onError?: (error: unknown, variables: unknown, context: unknown) => void } | undefined
              opt?.onError?.(error, variables, context)
            }
          })
        }
      }
    }
  }

  return {
    useIndex,
    useShow,
    useCreate,
    useUpdate,
    useUpdateSelf,
    usePatch: useUpdateSelf,
    usePut: useUpdateSelf,
    useRemove,
    useDelete: useRemove,
    useDeleteSelf,
    index: useIndex,
    show: useShow,
    create: useCreate,
    update: useUpdate,
    updateSelf: useUpdateSelf,
    patch: useUpdateSelf,
    put: useUpdateSelf,
    remove: useRemove,
    delete: useRemove,
    deleteSelf: useDeleteSelf,
    ...extraHooks,
  }
}