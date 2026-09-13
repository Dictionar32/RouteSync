/**
 * groupHookResult.ts
 *
 * Unified group hook result type definition.
 *
 * @module react/hooks/define/intent/groupHookResult
 */

import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import {
  InferResponse,
  ResolveError
} from '../hookTypes'

export type UnifiedGroupHookResult<TTypes, TEndpoint, TGroupName extends string, TError = ResolveError<TTypes>> = {
  list: [TTypes] extends [{ list: infer L }]
    ? [L] extends [never] ? undefined : UseQueryResult<L, TError>
    : TEndpoint extends { list: EndpointCallable<infer L, unknown, unknown, HttpMethod> }
      ? UseQueryResult<L, TError>
      : undefined

  detail: [TTypes] extends [{ detail: infer D }]
    ? [D] extends [never] ? undefined : UseQueryResult<D, TError>
    : undefined

  create: [TTypes] extends [{ create: infer C }]
    ? [C] extends [never] ? undefined : UseMutationResult<
        TEndpoint extends { create: infer TC } ? InferResponse<TC> : unknown,
        TError,
        C
      >
    : undefined

  update: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? undefined : UseMutationResult<
        TEndpoint extends { update: infer TU } ? InferResponse<TU> : unknown,
        TError,
        { id: number; data: U }
      >
    : undefined

  updateSelf: [TTypes] extends [{ update: infer U }]
    ? [U] extends [never] ? undefined : UseMutationResult<
        TEndpoint extends { updateSelf: infer TU } ? InferResponse<TU> : TEndpoint extends { update: infer TU } ? InferResponse<TU> : TEndpoint extends { put: infer TU } ? InferResponse<TU> : TEndpoint extends { patch: infer TU } ? InferResponse<TU> : unknown,
        TError,
        U
      >
    : undefined

  delete: TEndpoint extends { delete: unknown } | { remove: unknown }
    ? UseMutationResult<void, TError, number>
    : undefined

  deleteSelf: TEndpoint extends { delete: unknown }
    ? UseMutationResult<void, TError, void>
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
  error: TError | null
}
