/**
 * intentActions.ts
 *
 * Type-level projection from closed upstream DomainIntentCapability values to
 * generated React hook action types. Semantic intent classification remains
 * upstream-owned.
 *
 * @module react/hooks/define/intent/intentActions
 */

import { AggregateCollectionIntentActions } from '../../createCrudHooks'
import { CrudHooks, EndpointHooks, HookConfig } from '../hookTypes'
import { UnifiedGroupHookResult } from './groupHookResult'
import type { DomainIntentCapabilityReference } from '@routesync/core'
import { ResolveCapabilityOperation } from './mutationResolvers'

type AggregateActions<TConfig, TCapability extends DomainIntentCapabilityReference> =
  TCapability extends { intentKind: 'aggregate_collection'; aggregateCollection: infer TAggregate }
    ? TAggregate extends {
        operations: infer TOperations;
        fields: infer TFields;
      }
      ? TOperations extends {
          createItem: infer TCreate;
          updateItem: infer TUpdate;
          removeItem: infer TRemove;
          applyPromo: infer TApply;
          removePromo: infer TRemovePromo;
        }
        ? TFields extends { identityField: infer TIdentity; quantityField: infer TQuantity }
          ? AggregateCollectionIntentActions<
                TCreate extends import('@routesync/core').DomainIntentOperationReference ? ResolveCapabilityOperation<TConfig, TCreate> : unknown,
                TUpdate extends import('@routesync/core').DomainIntentOperationReference ? ResolveCapabilityOperation<TConfig, TUpdate> : unknown,
                TRemove extends import('@routesync/core').DomainIntentOperationReference ? ResolveCapabilityOperation<TConfig, TRemove> : unknown,
                TApply extends import('@routesync/core').DomainIntentOperationReference ? ResolveCapabilityOperation<TConfig, TApply> : unknown,
                TRemovePromo extends import('@routesync/core').DomainIntentOperationReference ? ResolveCapabilityOperation<TConfig, TRemovePromo> : unknown,
                TIdentity extends string ? TIdentity : 'id',
                TQuantity extends string ? TQuantity : 'qty'
              >
          : unknown
        : unknown
      : unknown
    : unknown

export type ResolveIntentFromObj<TConfig, TIntent> =
  TIntent extends DomainIntentCapabilityReference
    ? AggregateActions<TConfig, TIntent>
    : unknown

export type GetIntentActions<TConfig, TConfigK, TGroupName extends string, TManifest = unknown> =
  TConfigK extends { domainIntentCapability: infer TCapability }
    ? TCapability extends DomainIntentCapabilityReference
      ? ResolveIntentFromObj<TConfig, TCapability>
      : unknown
    : TManifest extends {
        domainIntentCapabilities: {
          [K in TGroupName]: infer TCapability
        }
      }
      ? TCapability extends DomainIntentCapabilityReference
        ? ResolveIntentFromObj<TConfig, TCapability>
        : unknown
      : unknown

export type HooksForGroup<TConfig, TConfigK extends HookConfig, TGroupName extends string, TManifest = unknown> =
  ((optionsOrId?: number | { id?: number; list?: boolean }) => UnifiedGroupHookResult<TConfigK['types'], TConfigK['endpoint'], TGroupName> & GetIntentActions<TConfig, TConfigK, TGroupName, TManifest>)
  & CrudHooks<TConfigK['types'], TConfigK['endpoint'], TGroupName>
  & EndpointHooks<TConfigK['endpoint']>
  & { endpoint: TConfigK['endpoint'] }
