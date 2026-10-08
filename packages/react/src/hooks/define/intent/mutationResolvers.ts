/**
 * mutationResolvers.ts
 *
 * Type-level projection from a closed upstream domain-intent operation
 * reference to an existing generated hook. No operation-id parsing or
 * resource/action reconstruction is performed here.
 *
 * @module react/hooks/define/intent/mutationResolvers
 */

import { HookConfig, CrudHooks } from '../hookTypes'
import type { DomainIntentOperationReference } from '@routesync/core'

export type ResolveCapabilityOperation<
  TConfig,
  TOperation extends DomainIntentOperationReference
> = TOperation['resource'] extends keyof TConfig
  ? TOperation['resource'] extends string
    ? TConfig[TOperation['resource']] extends HookConfig
      ? TOperation['action'] extends keyof CrudHooks<
          TConfig[TOperation['resource']]['types'],
          TConfig[TOperation['resource']]['endpoint'],
          TOperation['resource']
        >
        ? CrudHooks<
            TConfig[TOperation['resource']]['types'],
            TConfig[TOperation['resource']]['endpoint'],
            TOperation['resource']
          >[TOperation['action']] extends (...args: never[]) => unknown
          ? ReturnType<
              CrudHooks<
                TConfig[TOperation['resource']]['types'],
                TConfig[TOperation['resource']]['endpoint'],
                TOperation['resource']
              >[TOperation['action']]
            >
          : unknown
        : unknown
      : unknown
    : unknown
  : unknown

/** Compatibility aliases now delegate exclusively to closed capability data. */
export type ResolveActionMutation<TConfig, TRes, TAct> =
  TRes extends keyof TConfig
    ? TRes extends string
      ? TAct extends keyof CrudHooks<
          TConfig[TRes] extends HookConfig ? TConfig[TRes]['types'] : never,
          TConfig[TRes] extends HookConfig ? TConfig[TRes]['endpoint'] : never,
          TRes
        >
        ? CrudHooks<
            TConfig[TRes] extends HookConfig ? TConfig[TRes]['types'] : never,
            TConfig[TRes] extends HookConfig ? TConfig[TRes]['endpoint'] : never,
            TRes
          >[TAct] extends (...args: never[]) => unknown
          ? ReturnType<CrudHooks<
              TConfig[TRes] extends HookConfig ? TConfig[TRes]['types'] : never,
              TConfig[TRes] extends HookConfig ? TConfig[TRes]['endpoint'] : never,
              TRes
            >[TAct]>
          : unknown
        : unknown
      : unknown
    : unknown

export type ResolveOpPath<TOps, TKey1 extends string, TKey2 extends string = ''> =
  TOps extends object
    ? TKey2 extends ''
      ? TKey1 extends keyof TOps ? TOps[TKey1] : unknown
      : TKey1 extends keyof TOps
        ? TOps[TKey1] extends object
          ? TKey2 extends keyof TOps[TKey1] ? TOps[TKey1][TKey2] : unknown
          : unknown
        : unknown
    : unknown

export type ResolveMutationType<TConfig, TOperation> =
  TOperation extends DomainIntentOperationReference
    ? ResolveCapabilityOperation<TConfig, TOperation>
    : unknown
