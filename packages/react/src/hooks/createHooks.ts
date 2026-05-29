// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GenericService, Id, QueryParams } from '@routesync/sdk'

export interface ServiceHookOptions {
  query?: Record<string, any>
  mutation?: Record<string, any>
}

export function createHooks<
  TEntity = any,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TCreateInput>
>(
  service: GenericService<TEntity, TCreateInput, TUpdateInput>,
  resourceKey: string
) {
  return {
    useList: (params?: QueryParams, options?: Record<string, any>) =>
      useQuery({
        queryKey: [resourceKey, 'list', params],
        queryFn: () => service.findAll(params),
        ...options
      }),

    useDetail: (id: Id, options?: Record<string, any>) =>
      useQuery({
        queryKey: [resourceKey, 'detail', id],
        queryFn: () => service.findById(id),
        enabled: !!id,
        ...options
      }),

    useCreate: (options?: Record<string, any>) => {
      const qc = useQueryClient()
      return useMutation({
        ...options,
        mutationFn: (data: TCreateInput) => service.create(data),
        onSuccess: (...args: any[]) => {
          qc.invalidateQueries({ queryKey: [resourceKey] })
          options?.onSuccess?.(...args)
        }
      })
    },

    useUpdate: (options?: Record<string, any>) => {
      const qc = useQueryClient()
      return useMutation({
        ...options,
        mutationFn: ({ id, data }: { id: Id; data: TUpdateInput }) =>
          service.update(id, data),
        onSuccess: (...args: any[]) => {
          qc.invalidateQueries({ queryKey: [resourceKey] })
          options?.onSuccess?.(...args)
        }
      })
    },

    usePatch: (options?: Record<string, any>) => {
      const qc = useQueryClient()
      return useMutation({
        ...options,
        mutationFn: ({ id, data }: { id: Id; data: TUpdateInput }) =>
          service.patch(id, data),
        onSuccess: (...args: any[]) => {
          qc.invalidateQueries({ queryKey: [resourceKey] })
          options?.onSuccess?.(...args)
        }
      })
    },

    useDelete: (options?: Record<string, any>) => {
      const qc = useQueryClient()
      return useMutation({
        ...options,
        mutationFn: (id: Id) => service.delete(id),
        onSuccess: (...args: any[]) => {
          qc.invalidateQueries({ queryKey: [resourceKey] })
          options?.onSuccess?.(...args)
        }
      })
    }
  }
}
