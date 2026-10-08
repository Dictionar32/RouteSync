/**
 * intentWrapper.ts
 *
 * Consumes a closed upstream domain-intent capability and wraps unified hooks.
 * Semantic intent classification and operation resolution happen upstream.
 *
 * @module react/hooks/define/intentWrapper
 */

import type { DomainIntentCapabilityReference, DomainIntentOperationReference } from '@routesync/core'
import { EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import { useAggregateCollectionIntent } from '../createCrudHooks'
import { hasKey } from './unifiedHookBuilder'

export const getHookMethodResult = (hookObj: unknown, method: string): unknown => {
  if (hasKey(hookObj, method)) {
    const fn = hookObj[method]
    if (typeof fn === 'function') return fn()
  }
  return null
}

/** Runtime execution only: upstream has already resolved resource/action. */
export const resolveMutation = (
  operation: DomainIntentOperationReference,
  hooksMap: Record<string, unknown>,
): unknown => getHookMethodResult(hooksMap[operation.resource], operation.action)

const isDomainIntentCapability = (value: unknown): value is DomainIntentCapabilityReference => {
  if (!hasKey(value, 'kind') || value.kind !== 'domain_intent_capability') return false
  if (!hasKey(value, 'intentKind') || typeof value.intentKind !== 'string') return false
  return value.closed === true && value.authority === 'upstream'
}

const readDomainIntentCapability = (
  runtimeManifest: unknown,
  groupName: string,
): DomainIntentCapabilityReference | undefined => {
  if (!hasKey(runtimeManifest, 'domainIntentCapabilities')) return undefined
  const capabilities = runtimeManifest.domainIntentCapabilities
  if (!capabilities || typeof capabilities !== 'object') return undefined
  if (!hasKey(capabilities, groupName)) return undefined
  const capability = capabilities[groupName]
  return isDomainIntentCapability(capability) ? capability : undefined
}

export interface ResolveAndWrapIntentParams {
  readonly groupName: string
  readonly runtimeManifest?: unknown
  readonly unifiedHook: (optionsOrId?: number | { id?: number; list?: boolean }) => unknown
  readonly crudHooks: Record<string, unknown>
  readonly group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>
  readonly hooksMap: Record<string, unknown>
}

export function resolveAndWrapIntent({
  groupName,
  runtimeManifest,
  unifiedHook,
  crudHooks,
  group,
  hooksMap
}: ResolveAndWrapIntentParams): unknown {
  const capability = readDomainIntentCapability(runtimeManifest, groupName)
  if (!capability || capability.intentKind !== 'aggregate_collection' || !capability.aggregateCollection) {
    return unifiedHook
  }

  const aggregateCollection = capability.aggregateCollection
  const wrappedHook = (optionsOrId?: number | { id?: number; list?: boolean }) => {
    const result = unifiedHook(optionsOrId)
    const createItemMut = resolveMutation(aggregateCollection.operations.createItem, hooksMap)
    const updateItemMut = resolveMutation(aggregateCollection.operations.updateItem, hooksMap)
    const removeItemMut = resolveMutation(aggregateCollection.operations.removeItem, hooksMap)
    const applyPromoMut = resolveMutation(aggregateCollection.operations.applyPromo, hooksMap)
    const removePromoMut = resolveMutation(aggregateCollection.operations.removePromo, hooksMap)

    return useAggregateCollectionIntent(result, {
      createItem: createItemMut,
      updateItem: updateItemMut,
      removeItem: removeItemMut,
      applyPromo: applyPromoMut,
      removePromo: removePromoMut,
    }, {
      collectionField: aggregateCollection.fields.collectionField,
      identityField: aggregateCollection.fields.identityField,
      quantityField: aggregateCollection.fields.quantityField,
      groupName,
      promotionCodeField: aggregateCollection.fields.promotionCodeField
    })
  }

  Object.assign(wrappedHook, crudHooks)
  if (hasKey(wrappedHook, 'endpoint')) wrappedHook.endpoint = group
  return wrappedHook
}
