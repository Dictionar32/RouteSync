// @ts-ignore TanStack Vue Query is a peer dependency provided by consumers.
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { GenericService } from '@routesync/sdk'

export function createComposables(service: GenericService, resourceKey: string) {
  return {
    useList: (params?: Record<string, any>) =>
      useQuery({
        queryKey: [resourceKey, params],
        queryFn: () => service.findAll(params)
      }),

    useDetail: (id: string | number) =>
      useQuery({
        queryKey: [resourceKey, id],
        queryFn: () => service.findById(id),
        enabled: !!id
      }),

    useCreate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (data: any) => service.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [resourceKey] })
      })
    },

    useUpdate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) =>
          service.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [resourceKey] })
      })
    },

    useDelete: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (id: string | number) => service.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [resourceKey] })
      })
    }
  }
}

export { createComposables as createVueComposables }
