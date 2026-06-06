import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, ApiError, RouteDefinition } from '@routesync/sdk'
import { createCrudHooks } from './createCrudHooks'
import { useApiQuery, ApiQueryOptions } from './useQuery'
import { useApiMutation, ApiMutationOptions } from './useMutation'
import { toIndexFn, toShowFn } from './endpointAdapters'

type CrudHooksForGroup<TTypes, TEndpoint> = {
  index: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never]
      ? never
      : () => UseQueryResult<L, Error>
    : TEndpoint extends { list: EndpointCallable<infer L, any, any, any> }
      ? () => UseQueryResult<L, Error>
      : never
  useIndex: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never]
      ? never
      : () => UseQueryResult<L, Error>
    : TEndpoint extends { list: EndpointCallable<infer L, any, any, any> }
      ? () => UseQueryResult<L, Error>
      : never

  show: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never]
      ? never
      : (id: number) => UseQueryResult<D, Error>
    : TEndpoint extends { get: EndpointCallable<infer D, any, any, any> } | { show: EndpointCallable<infer D, any, any, any> }
      ? (id: number) => UseQueryResult<D, Error>
      : never
  useShow: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never]
      ? never
      : (id: number) => UseQueryResult<D, Error>
    : TEndpoint extends { get: EndpointCallable<infer D, any, any, any> } | { show: EndpointCallable<infer D, any, any, any> }
      ? (id: number) => UseQueryResult<D, Error>
      : never

  create: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never]
      ? never
      : () => UseMutationResult<[TTypes] extends [{ detail: infer D }] ? ([D] extends [never] ? unknown : D) : (TEndpoint extends { get: EndpointCallable<infer RD, any, any, any> } | { show: EndpointCallable<infer RD, any, any, any> } ? RD : unknown), Error, C>
    : TEndpoint extends { create: EndpointCallable<any, any, infer C, any> }
      ? () => UseMutationResult<TEndpoint extends { get: EndpointCallable<infer D, any, any, any> } | { show: EndpointCallable<infer D, any, any, any> } ? D : unknown, Error, C>
      : never
  useCreate: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never]
      ? never
      : () => UseMutationResult<[TTypes] extends [{ detail: infer D }] ? ([D] extends [never] ? unknown : D) : (TEndpoint extends { get: EndpointCallable<infer RD, any, any, any> } | { show: EndpointCallable<infer RD, any, any, any> } ? RD : unknown), Error, C>
    : TEndpoint extends { create: EndpointCallable<any, any, infer C, any> }
      ? () => UseMutationResult<TEndpoint extends { get: EndpointCallable<infer D, any, any, any> } | { show: EndpointCallable<infer D, any, any, any> } ? D : unknown, Error, C>
      : never

  update: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never]
      ? never
      : () => UseMutationResult<[TTypes] extends [{ detail: infer D }] ? ([D] extends [never] ? unknown : D) : (TEndpoint extends { get: EndpointCallable<infer RD, any, any, any> } | { show: EndpointCallable<infer RD, any, any, any> } ? RD : unknown), Error, { id: number; data: U }>
    : TEndpoint extends { update: EndpointCallable<any, any, infer U, any> }
      ? () => UseMutationResult<TEndpoint extends { get: EndpointCallable<infer D, any, any, any> } | { show: EndpointCallable<infer D, any, any, any> } ? D : unknown, Error, { id: number; data: U }>
      : never
  useUpdate: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never]
      ? never
      : () => UseMutationResult<[TTypes] extends [{ detail: infer D }] ? ([D] extends [never] ? unknown : D) : (TEndpoint extends { get: EndpointCallable<infer RD, any, any, any> } | { show: EndpointCallable<infer RD, any, any, any> } ? RD : unknown), Error, { id: number; data: U }>
    : TEndpoint extends { update: EndpointCallable<any, any, infer U, any> }
      ? () => UseMutationResult<TEndpoint extends { get: EndpointCallable<infer D, any, any, any> } | { show: EndpointCallable<infer D, any, any, any> } ? D : unknown, Error, { id: number; data: U }>
      : never

  remove: TEndpoint extends { delete: any } | { remove: any } ? () => UseMutationResult<void, Error, number> : never
  useRemove: TEndpoint extends { delete: any } | { remove: any } ? () => UseMutationResult<void, Error, number> : never
  delete: TEndpoint extends { delete: any } | { remove: any } ? () => UseMutationResult<void, Error, number> : never
  useDelete: TEndpoint extends { delete: any } | { remove: any } ? () => UseMutationResult<void, Error, number> : never
} & {
  [K in keyof TEndpoint as `use${Capitalize<string & K>}`]: TEndpoint[K] extends {
    $def: RouteDefinition<infer R, infer P, infer B, infer M>
  }
    ? M extends 'GET'
      ? TEndpoint[K] extends (...args: never[]) => unknown
        ? (...args: [...args: Parameters<TEndpoint[K]>, queryOptions?: ApiQueryOptions<R>]) => ReturnType<typeof useApiQuery<R, P, B>>
        : never
      : (options?: ApiMutationOptions<R, ApiError, EndpointCallableOptions<P, B>>) => ReturnType<typeof useApiMutation<R, P, B>>
    : never
}

export interface HookConfig {
  types?: {
    list?: any;
    detail?: any;
    create?: any;
    update?: any;
  };
  queryKey: any;
  endpoint: any;
  cache?: {
    list?: () => readonly unknown[];
    detail?: (id: number) => readonly unknown[];
    create?: {
      invalidate?: Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>;
    };
    update?: {
      invalidate?: Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>;
    };
    delete?: {
      invalidate?: Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>;
    };
  };
}

export function defineHooks<
  TConfig extends Record<string, HookConfig>
>(
  config: TConfig
): {
  [K in keyof TConfig]: CrudHooksForGroup<TConfig[K]['types'], TConfig[K]['endpoint']>
} {
  const hooks = {} as any

  for (const groupName in config) {
    const groupConfig = config[groupName]
    const group = groupConfig.endpoint
    const groupQueryKeys = groupConfig.queryKey

    const indexService = group.list
    const showService = group.get
    const createService = group.create
    const updateService = group.update
    const deleteService = group.delete || group.remove

    const crudHooks = createCrudHooks({
      queryKey: {
        list: () => {
          if (groupConfig.cache?.list) return groupConfig.cache.list()
          if (groupQueryKeys?.lists) return groupQueryKeys.lists()
          if (groupQueryKeys?.list) return groupQueryKeys.list()
          return [groupName, 'list']
        },
        detail: (id: number) => {
          if (groupConfig.cache?.detail) return groupConfig.cache.detail(id)
          if (groupQueryKeys?.detail) return groupQueryKeys.detail(id)
          return [groupName, 'detail', id]
        }
      },
      service: {
        index: indexService ? toIndexFn(indexService) : undefined,
        show: showService ? toShowFn(showService) : undefined,
        create: createService,
        update: updateService,
        delete: deleteService,
      },
      cache: groupConfig.cache
    })

    // Merge custom hooks
    const customHooks = {} as any
    for (const action in group) {
      const endpoint = group[action]
      if (typeof endpoint !== 'function' || !endpoint.$def) continue

      const method = endpoint.$def.method
      const hookName = `use${action.charAt(0).toUpperCase()}${action.slice(1)}`

      if (method === 'GET') {
        customHooks[hookName] = (options?: unknown, queryOptions?: unknown) =>
          useApiQuery(endpoint as EndpointCallable, options as never, queryOptions as never)
      } else {
        customHooks[hookName] = (mutationOptions?: unknown) =>
          useApiMutation(endpoint as EndpointCallable, mutationOptions as never)
      }
    }

    hooks[groupName] = { ...crudHooks, ...customHooks }
  }

  return hooks
}