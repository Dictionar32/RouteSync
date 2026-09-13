/**
 * hookTypes.ts
 *
 * Core type inference and configuration interfaces for TanStack React Query endpoint hooks.
 *
 * @module react/hooks/define/hookTypes
 */

import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { EndpointCallable, ApiError, RouteDefinition } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'

export type InferResponse<T> = T extends { $def: RouteDefinition<infer R, unknown, unknown, HttpMethod> } ? R : unknown
export type InferBody<T> = T extends { $def: RouteDefinition<unknown, unknown, infer B, HttpMethod> } ? B : unknown
export type InferMethod<T> = T extends { $def: RouteDefinition<unknown, unknown, unknown, infer M> } ? M : never

export type FlattenOptions<T> = T extends { $def: RouteDefinition<unknown, infer P, infer B, HttpMethod> }
  ? unknown extends P
    ? unknown extends B
      ? void
      : B
    : unknown extends B
      ? P
      : P & B
  : unknown

export type ResolveError<TTypes> = [TTypes] extends [{ error: infer E }]
  ? [E] extends [never]
    ? ApiError
    : E
  : ApiError

export type HookForEndpoint<T, TError = ApiError> =
  InferMethod<T> extends 'GET'
    ? (options?: FlattenOptions<T>) => UseQueryResult<InferResponse<T>, TError>
    : () => UseMutationResult<
        InferResponse<T>,
        TError,
        FlattenOptions<T>
      >

export type EndpointHooks<TEndpoint, TError = ApiError> = {
  [K in keyof TEndpoint as `use${Capitalize<string & K>}`]: HookForEndpoint<TEndpoint[K], TError>
}

export type CrudHooks<TTypes, TEndpoint, TGroupName extends string, TError = ResolveError<TTypes>> = {
  useIndex: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never] ? never : (options?: unknown) => UseQueryResult<L, TError> & { [Key in TGroupName]: L | undefined }
    : TEndpoint extends { list: EndpointCallable<infer L, unknown, unknown, HttpMethod> }
      ? (options?: unknown) => UseQueryResult<L, TError> & { [Key in TGroupName]: L | undefined }
      : never

  useShow: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never] ? never : (id: number, options?: unknown) => UseQueryResult<D, TError> & { [Key in TGroupName]: D | undefined }
    : never

  useCreate: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never] ? never : () => UseMutationResult<
        TEndpoint extends { create: infer TC } ? InferResponse<TC> : unknown,
        TError,
        C
      >
    : never

  useUpdate: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? never : () => UseMutationResult<
        TEndpoint extends { update: infer TU } ? InferResponse<TU> : unknown,
        TError,
        { id: number; data: U }
      >
    : never

  useUpdateSelf: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? never : () => UseMutationResult<
        TEndpoint extends { updateSelf: infer TU } ? InferResponse<TU> : TEndpoint extends { update: infer TU } ? InferResponse<TU> : TEndpoint extends { put: infer TU } ? InferResponse<TU> : TEndpoint extends { patch: infer TU } ? InferResponse<TU> : unknown,
        TError,
        U
      >
    : never

  usePatch: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useUpdateSelf']
  usePut: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useUpdateSelf']

  useRemove: TEndpoint extends { delete: unknown } | { remove: unknown }
    ? () => UseMutationResult<void, TError, number>
    : never

  useDelete: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useRemove']

  useDeleteSelf: TEndpoint extends { delete: unknown }
    ? () => UseMutationResult<void, TError, void>
    : never

  // short aliases
  index: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useIndex']
  show: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useShow']
  create: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useCreate']
  update: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useUpdate']
  updateSelf: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useUpdateSelf']
  patch: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useUpdateSelf']
  put: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useUpdateSelf']
  remove: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useRemove']
  delete: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useRemove']
  deleteSelf: CrudHooks<TTypes, TEndpoint, TGroupName, TError>['useDeleteSelf']
}

export type InvalidateList = Array<((...args: never[]) => readonly unknown[]) | readonly unknown[]>

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
