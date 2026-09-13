/**
 * mutationResolvers.ts
 *
 * Mutation type and operation path resolvers.
 *
 * @module react/hooks/define/intent/mutationResolvers
 */

import { HookConfig, CrudHooks } from '../hookTypes'

export type ResolveActionMutation<TConfig, TRes, TAct> =
  TRes extends keyof TConfig
    ? TConfig[TRes] extends HookConfig
      ? TAct extends keyof CrudHooks<TConfig[TRes]['types'], TConfig[TRes]['endpoint'], TRes & string>
        ? CrudHooks<TConfig[TRes]['types'], TConfig[TRes]['endpoint'], TRes & string>[TAct] extends (...args: never[]) => unknown
          ? ReturnType<CrudHooks<TConfig[TRes]['types'], TConfig[TRes]['endpoint'], TRes & string>[TAct]>
          : unknown
        : unknown
      : unknown
    : unknown

export type ResolveOpPath<TOps, TKey1 extends string, TKey2 extends string = ""> =
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

export type ResolveMutationType<TConfig, TOp> =
  TOp extends { operationId: infer TOpId }
    ? TOpId extends `${infer TGroup}.${infer TAction}`
      ? ResolveActionMutation<TConfig, TGroup, TAction>
      : unknown
    : TOp extends { resource: infer TRes; action: infer TAct }
      ? ResolveActionMutation<TConfig, TRes, TAct>
      : TOp extends `${infer TGroup}.${infer TAction}`
        ? ResolveActionMutation<TConfig, TGroup, TAction>
        : unknown
