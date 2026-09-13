/**
 * intentActions.ts
 *
 * Intent actions resolution and aggregation types.
 *
 * @module react/hooks/define/intent/intentActions
 */

import { AggregateCollectionIntentActions } from '../../createCrudHooks'
import {
  CrudHooks,
  EndpointHooks,
  HookConfig
} from '../hookTypes'
import { UnifiedGroupHookResult } from './groupHookResult'
import {
  ResolveOpPath,
  ResolveMutationType
} from './mutationResolvers'

export type ResolveIntentFromObj<TConfig, TIntent> =
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

export type GetIntentActions<TConfig, TConfigK, TGroupName extends string, TManifest = unknown> = TConfigK extends {
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

export type HooksForGroup<TConfig, TConfigK extends HookConfig, TGroupName extends string, TManifest = unknown> = ((optionsOrId?: number | { id?: number; list?: boolean }) => UnifiedGroupHookResult<TConfigK['types'], TConfigK['endpoint'], TGroupName> & GetIntentActions<TConfig, TConfigK, TGroupName, TManifest>) & CrudHooks<TConfigK['types'], TConfigK['endpoint'], TGroupName> & EndpointHooks<TConfigK['endpoint']> & { endpoint: TConfigK['endpoint'] }
