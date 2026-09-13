import type { RouteManifest } from '@routesync/core';
import { classifyRoutes, buildResourceMap } from '../generators/route-classifier';
import { resolveCartModelInfo, detectCartGroups } from './intent';

export class IntentResolver {
  private static getPropString(obj: unknown, key: string): string {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const val = Reflect.get(obj, key);
      if (typeof val === 'string') return val;
    }
    return '';
  }

  static resolve(manifest: RouteManifest): RouteManifest {
    if (!manifest.frontend) {
      manifest.frontend = {};
    }
    if (!manifest.frontend.domains) {
      manifest.frontend.domains = {};
    }

    const classified = classifyRoutes(manifest.routes, manifest.frontend.groupAliases);
    const resources = buildResourceMap(classified);

    for (const [groupName] of resources) {
      const domainVal = manifest.frontend.domains[groupName];
      if (domainVal === 'cart' || (domainVal && typeof domainVal === 'object' && (
        Reflect.get(domainVal, 'type') === 'cart' || 
        Reflect.get(domainVal, 'type') === 'AggregateCollection' ||
        Reflect.get(domainVal, 'role') === 'cart'
      ))) {
        const cartGroupName = groupName;
        const modelInfo = resolveCartModelInfo(cartGroupName, manifest, classified);
        const groupInfo = detectCartGroups(cartGroupName, manifest, classified, resources);

        const itemsGroup = IntentResolver.getPropString(domainVal, 'itemsGroup') || IntentResolver.getPropString(domainVal, 'items') || groupInfo.itemsGroupName;
        const promoGroup = IntentResolver.getPropString(domainVal, 'promoGroup') || IntentResolver.getPropString(domainVal, 'promo') || groupInfo.promoGroupName;

        manifest.frontend.domains[groupName] = {
          type: 'AggregateCollection',
          capabilities: {
            items: {
              create: { operationId: `${itemsGroup}.create` },
              update: { operationId: `${itemsGroup}.update` },
              remove: { operationId: `${itemsGroup}.remove` }
            },
            promotion: promoGroup ? {
              apply: { operationId: `${promoGroup}.create` },
              remove: { operationId: `${promoGroup}.delete` }
            } : null
          },
          config: {
            collectionField: IntentResolver.getPropString(domainVal, 'collectionField') || IntentResolver.getPropString(domainVal, 'itemsField') || modelInfo.itemsField,
            identityField: IntentResolver.getPropString(domainVal, 'identityField') || IntentResolver.getPropString(domainVal, 'itemKey') || modelInfo.itemKey,
            quantityField: IntentResolver.getPropString(domainVal, 'quantityField') || IntentResolver.getPropString(domainVal, 'qtyField') || modelInfo.qtyField,
            promotionCodeField: IntentResolver.getPropString(domainVal, 'promotionCodeField') || IntentResolver.getPropString(domainVal, 'promoKey') || groupInfo.promoKey
          }
        };
      }
    }

    return manifest;
  }
}
