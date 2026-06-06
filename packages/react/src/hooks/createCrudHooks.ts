// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const requireValidId = (id: unknown): number => {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`)
  }
  return parsed
}

const isEndpoint = (fn: any): boolean => typeof fn === 'function' && !!fn.$def

const callIndex = (svc: any): Promise<any> =>
  isEndpoint(svc) ? svc() : svc()

const callShow = (svc: any, id: number): Promise<any> =>
  isEndpoint(svc) ? svc({ params: { id } }) : svc(id)

const callCreate = (svc: any, data: any): Promise<any> =>
  isEndpoint(svc) ? svc({ body: data }) : svc(data)

const callUpdate = (svc: any, id: number, data: any): Promise<any> =>
  isEndpoint(svc) ? svc({ params: { id }, body: data }) : svc(id, data)

// update tanpa id param — untuk PUT/PATCH ke /resource (bukan /resource/:id)
const callUpdateNoParam = (svc: any, data: any): Promise<any> =>
  isEndpoint(svc) ? svc({ body: data }) : svc(data)

const callDelete = (svc: any, id: number): Promise<any> =>
  isEndpoint(svc) ? svc({ params: { id } }) : svc(id)

// delete tanpa id param — untuk DELETE ke /resource
const callDeleteNoParam = (svc: any): Promise<any> =>
  isEndpoint(svc) ? svc() : svc()

type InvalidateList = Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>

type ExtraEndpoint = {
  /** endpoint callable atau service fn */
  service: any
  /** 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' — auto-detect dari $def kalau tidak diisi */
  method?: string
  /** query key fn dari actionKeys — dipakai sebagai queryKey untuk GET dan invalidasi mutation */
  queryKey?: (...args: any[]) => readonly unknown[]
  /** cache invalidation keys setelah mutation sukses */
  invalidate?: InvalidateList
}

export const createCrudHooks = <
  ReadIndexList,
  ReadShow,
  CreateForm,
  UpdateForm
>(config: {
  queryKey: {
    list: () => readonly unknown[]
    detail: (id: number) => readonly unknown[]
  }
  service: {
    index?: () => Promise<ReadIndexList>
    show?: (id: number) => Promise<ReadShow>
    create?: (data: CreateForm) => Promise<ReadShow>
    /** PUT/PATCH + :id param */
    update?: (id: number, data: UpdateForm) => Promise<ReadShow>
    /** PUT/PATCH tanpa :id — e.g. PATCH /profile */
    updateSelf?: (data: UpdateForm) => Promise<ReadShow>
    delete?: (id: number) => Promise<void>
    /** DELETE tanpa :id — e.g. DELETE /cart */
    deleteSelf?: () => Promise<void>
  }
  cache?: {
    create?: { invalidate?: InvalidateList }
    update?: { invalidate?: InvalidateList }
    updateSelf?: { invalidate?: InvalidateList }
    delete?: { invalidate?: InvalidateList }
    deleteSelf?: { invalidate?: InvalidateList }
  }
  /**
   * Arbitrary non-CRUD endpoints yang diinjek sebagai hook.
   * Key = nama hook yang diekspos (tanpa prefix "use"), e.g. "post" → usePost
   */
  extras?: Record<string, ExtraEndpoint>
}) => {
  const { service, queryKey } = config

  const resolveInvalidate = (list: InvalidateList | undefined, arg?: any) => {
    if (!list) return
    const qc = useQueryClient()
    list.forEach(inv => {
      const key = typeof inv === 'function' ? inv(arg) : inv
      qc.invalidateQueries({ queryKey: key })
    })
  }

  // ── useIndex ──────────────────────────────────────────────────────────────
  const useIndex = () => {
    if (!service.index) throw new Error('Index is not supported for this resource')
    return useQuery({
      queryKey: queryKey.list(),
      queryFn: () => callIndex(service.index),
    })
  }

  // ── useShow ───────────────────────────────────────────────────────────────
  const useShow = (id: number) => {
    if (!service.show) throw new Error('Show is not supported for this resource')
    const validId = Number(id)
    const enabled = Number.isInteger(validId) && validId > 0
    return useQuery({
      queryKey: queryKey.detail(validId),
      enabled,
      queryFn: () => callShow(service.show, requireValidId(validId)),
    })
  }

  // ── useCreate ─────────────────────────────────────────────────────────────
  const useCreate = () => {
    const svc = service.create
    if (!svc) throw new Error('Create is not supported for this resource')
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (data: CreateForm) => callCreate(svc, data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        resolveInvalidate(config.cache?.create?.invalidate)
      },
    })
  }

  // ── useUpdate — PUT/PATCH + :id ───────────────────────────────────────────
  const useUpdate = () => {
    const svc = service.update
    if (!svc) throw new Error('Update is not supported for this resource')
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateForm }) =>
        callUpdate(svc, requireValidId(id), data),
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        qc.invalidateQueries({ queryKey: queryKey.detail(vars.id) })
        resolveInvalidate(config.cache?.update?.invalidate, vars.id)
      },
    })
  }

  // ── useUpdateSelf — PUT/PATCH tanpa :id (e.g. PATCH /profile) ─────────────
  const useUpdateSelf = () => {
    const svc = service.updateSelf
    if (!svc) throw new Error('UpdateSelf is not supported for this resource')
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (data: UpdateForm) => callUpdateNoParam(svc, data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        resolveInvalidate(config.cache?.updateSelf?.invalidate)
      },
    })
  }

  // ── useRemove — DELETE + :id ──────────────────────────────────────────────
  const useRemove = () => {
    const svc = service.delete
    if (!svc) throw new Error('Delete is not supported for this resource')
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => callDelete(svc, requireValidId(id)),
      onSuccess: (_data, id) => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        qc.invalidateQueries({ queryKey: queryKey.detail(id) })
        resolveInvalidate(config.cache?.delete?.invalidate, id)
      },
    })
  }

  // ── useDeleteSelf — DELETE tanpa :id (e.g. DELETE /cart) ──────────────────
  const useDeleteSelf = () => {
    const svc = service.deleteSelf
    if (!svc) throw new Error('DeleteSelf is not supported for this resource')
    const qc = useQueryClient()
    return useMutation({
      mutationFn: () => callDeleteNoParam(svc),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKey.list() })
        resolveInvalidate(config.cache?.deleteSelf?.invalidate)
      },
    })
  }

  // ── extras — arbitrary endpoints ───────────────────────────────────────────
  const extraHooks: Record<string, (...args: any[]) => any> = {}

  if (config.extras) {
    const qc = useQueryClient()

    for (const [name, extra] of Object.entries(config.extras)) {
      const hookName = `use${name.charAt(0).toUpperCase()}${name.slice(1)}`
      const method = extra.method ?? (isEndpoint(extra.service) ? extra.service.$def?.method : 'POST')

      if (method === 'GET') {
        extraHooks[hookName] = (options?: unknown, queryOptions?: unknown) => {
          // pakai actionKey kalau ada, fallback ke [groupName, action, options]
          const resolvedKey = extra.queryKey
            ? extra.queryKey(options)
            : [...queryKey.list(), name, options].filter(Boolean)
          return useQuery({
            ...(queryOptions as any),
            queryKey: resolvedKey,
            queryFn: () => isEndpoint(extra.service) ? extra.service(options as never) : extra.service(options),
          })
        }
      } else {
        extraHooks[hookName] = (mutationOptions?: any) =>
          useMutation({
            ...mutationOptions,
            mutationFn: (variables: any) =>
              isEndpoint(extra.service)
                ? extra.service({ body: variables })
                : extra.service(variables),
            onSuccess: (data: unknown, variables: unknown, context: unknown) => {
              // invalidate via actionKey kalau ada
              if (extra.queryKey) {
                qc.invalidateQueries({ queryKey: extra.queryKey(variables) })
              }
              // invalidate tambahan dari cache config
              if (extra.invalidate) {
                extra.invalidate.forEach(inv => {
                  const key = typeof inv === 'function' ? inv(variables) : inv
                  qc.invalidateQueries({ queryKey: key })
                })
              }
              mutationOptions?.onSuccess?.(data, variables, context)
            },
          })
      }
    }
  }

  return {
    // canonical names
    useIndex,
    useShow,
    useCreate,
    useUpdate,
    useUpdateSelf,
    useRemove,
    useDeleteSelf,
    // short aliases
    index: useIndex,
    show: useShow,
    create: useCreate,
    update: useUpdate,
    updateSelf: useUpdateSelf,
    remove: useRemove,
    delete: useRemove,
    deleteSelf: useDeleteSelf,
    // extra injected hooks
    ...extraHooks,
  }
}