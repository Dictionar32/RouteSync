/**
 * intentWrapper.ts
 *
 * Resolves domain intents (e.g. AggregateCollection/cart) and wraps unified hooks.
 *
 * @module react/hooks/define/intentWrapper
 */

import { EndpointCallable } from '@routesync/sdk'
import { HttpMethod } from '@routesync/core'
import { useAggregateCollectionIntent } from '../createCrudHooks'
import { HookConfig } from './hookTypes'
import { hasKey } from './unifiedHookBuilder'

export const getHookMethodResult = (hookObj: unknown, method: string): unknown => {
  if (hasKey(hookObj, method)) {
    const fn = hookObj[method]
    if (typeof fn === 'function') {
      return fn()
    }
  }
  return null
}

export const resolveMutation = (ops: unknown, opKey: string, hooksMap: Record<string, unknown>): unknown => {
  if (hasKey(ops, opKey)) {
    const val = ops[opKey]
    if (typeof val === 'string' && val) {
      const parts = val.split('.')
      if (parts.length === 2) {
        return getHookMethodResult(hooksMap[parts[0]], parts[1])
      }
    } else if (val && typeof val === 'object') {
      if (hasKey(val, 'operationId') && typeof val.operationId === 'string') {
        const parts = val.operationId.split('.')
        if (parts.length === 2) {
          return getHookMethodResult(hooksMap[parts[0]], parts[1])
        }
      } else if (hasKey(val, 'resource') && typeof val.resource === 'string' && hasKey(val, 'action') && typeof val.action === 'string') {
        return getHookMethodResult(hooksMap[val.resource], val.action)
      }
    }
  }
  return null
}

export interface ResolveAndWrapIntentParams {
  readonly groupName: string
  readonly groupConfig: HookConfig
  readonly runtimeManifest?: unknown
  readonly unifiedHook: (optionsOrId?: number | { id?: number; list?: boolean }) => any
  readonly crudHooks: Record<string, any>
  readonly group: Record<string, EndpointCallable<unknown, unknown, unknown, HttpMethod>>
  readonly hooksMap: Record<string, unknown>
}

export function resolveAndWrapIntent({
  groupName,
  groupConfig,
  runtimeManifest,
  unifiedHook,
  crudHooks,
  group,
  hooksMap
}: ResolveAndWrapIntentParams): unknown {
  let intent = groupConfig.intent
  if (!intent && runtimeManifest && typeof runtimeManifest === 'object') {
    if (hasKey(runtimeManifest, 'domains') && runtimeManifest.domains && typeof runtimeManifest.domains === 'object') {
      const domains = runtimeManifest.domains
      if (hasKey(domains, groupName)) {
        intent = domains[groupName]
      }
    }
  }

  if (intent && typeof intent === 'object') {
    const intentType = hasKey(intent, 'type') && typeof intent.type === 'string' ? intent.type : ''
    if (intentType === 'AggregateCollection' || intentType === 'cart') {
      const ops = hasKey(intent, 'capabilities') && typeof intent.capabilities === 'object' && intent.capabilities !== null
        ? intent.capabilities
        : hasKey(intent, 'operations') && typeof intent.operations === 'object' && intent.operations !== null
          ? intent.operations
          : {}
      const cfg = hasKey(intent, 'config') && typeof intent.config === 'object' && intent.config !== null ? intent.config : {}

      const itemsGroup = hasKey(ops, 'items') && typeof ops.items === 'object' && ops.items !== null ? ops.items : {}
      const promoGroup = hasKey(ops, 'promotion') && typeof ops.promotion === 'object' && ops.promotion !== null ? ops.promotion : {}

      const wrappedHook = (optionsOrId?: number | { id?: number; list?: boolean }) => {
        const result = unifiedHook(optionsOrId)

        const createItemMut = resolveMutation(itemsGroup, 'create', hooksMap) || resolveMutation(ops, 'createItem', hooksMap)
        const updateItemMut = resolveMutation(itemsGroup, 'update', hooksMap) || resolveMutation(ops, 'updateItem', hooksMap)
        const removeItemMut = resolveMutation(itemsGroup, 'remove', hooksMap) || resolveMutation(ops, 'removeItem', hooksMap)
        const applyPromoMut  = resolveMutation(promoGroup, 'apply', hooksMap) || resolveMutation(ops, 'applyPromo', hooksMap)
        const removePromoMut = resolveMutation(promoGroup, 'remove', hooksMap) || resolveMutation(ops, 'removePromo', hooksMap)

        const collectionField = hasKey(cfg, 'collectionField') && typeof cfg.collectionField === 'string'
          ? cfg.collectionField
          : hasKey(cfg, 'itemsField') && typeof cfg.itemsField === 'string'
            ? cfg.itemsField
            : ''
        const identityField = hasKey(cfg, 'identityField') && typeof cfg.identityField === 'string'
          ? cfg.identityField
          : hasKey(cfg, 'itemKey') && typeof cfg.itemKey === 'string'
            ? cfg.itemKey
            : ''
        const quantityField = hasKey(cfg, 'quantityField') && typeof cfg.quantityField === 'string'
          ? cfg.quantityField
          : hasKey(cfg, 'qtyField') && typeof cfg.qtyField === 'string'
            ? cfg.qtyField
            : ''
        const promotionCodeField = hasKey(cfg, 'promotionCodeField') && typeof cfg.promotionCodeField === 'string'
          ? cfg.promotionCodeField
          : hasKey(cfg, 'promoKey') && typeof cfg.promoKey === 'string'
            ? cfg.promoKey
            : ''

        if (!collectionField || !identityField || !quantityField || !promotionCodeField) {
          throw new Error(`Missing resolved intent config for domain group ${groupName}`)
        }

        return useAggregateCollectionIntent(result, {
          createItem: createItemMut,
          updateItem: updateItemMut,
          removeItem: removeItemMut,
          applyPromo: applyPromoMut,
          removePromo: removePromoMut,
        }, {
          collectionField,
          identityField,
          quantityField,
          groupName,
          promotionCodeField
        })
      }

      Object.assign(wrappedHook, crudHooks)
      if (hasKey(wrappedHook, 'endpoint')) {
        wrappedHook.endpoint = group
      }
      return wrappedHook
    }
  }

  return unifiedHook
}
