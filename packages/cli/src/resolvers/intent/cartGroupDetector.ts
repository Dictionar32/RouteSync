/**
 * cartGroupDetector.ts
 *
 * Infers itemGroupName, promoGroupName, and promoKey from route paths and schemas.
 *
 * @module cli/resolvers/intent
 */

import type { RouteManifest } from '@routesync/core';
import type { ClassifiedRoute, ResourceCrudMap } from '../../generators/route-classifier';

export interface CartGroupInfo {
  readonly itemsGroupName: string;
  readonly promoGroupName: string;
  readonly promoKey: string;
}

export function detectCartGroups(
  cartGroupName: string,
  manifest: RouteManifest,
  classified: readonly ClassifiedRoute[],
  resources: Map<string, ResourceCrudMap>
): CartGroupInfo {
  let itemsGroupName = '';
  let promoGroupName = '';

  const cartPath = classified.find(r => r.groupName === cartGroupName)?.raw.path || '';
  if (cartPath) {
    for (const [, res] of resources) {
      const resGroupName = res.groupName;
      if (resGroupName === cartGroupName) continue;

      let resPath = '';
      let hasPathParams = false;
      for (const route of manifest.routes) {
        if (route.group === resGroupName) {
          resPath = route.path;
          if (route.path.includes('{') || route.path.includes(':')) {
            hasPathParams = true;
          }
        }
      }

      if (resPath && resPath.startsWith(cartPath + '/')) {
        if (hasPathParams) {
          itemsGroupName = resGroupName;
        } else {
          promoGroupName = resGroupName;
        }
      }
    }
  }

  if (!itemsGroupName) itemsGroupName = `${cartGroupName}Items`;
  if (!promoGroupName) promoGroupName = `${cartGroupName}Promo`;

  let promoKey = 'code';
  if (promoGroupName) {
    const promoRoute = manifest.routes.find(
      r => r.group === promoGroupName && (r.method === 'POST' || r.method === 'PUT' || r.method === 'PATCH')
    );
    if (promoRoute && 'body' in promoRoute && promoRoute.body && typeof promoRoute.body === 'object') {
      const bodyObj = promoRoute.body;
      const schema = 'schema' in bodyObj ? bodyObj.schema : bodyObj;
      if (schema && typeof schema === 'object') {
        let props: unknown = null;
        if ('properties' in schema) {
          props = schema.properties;
        } else if ('resolved' in schema && schema.resolved && typeof schema.resolved === 'object' && 'properties' in schema.resolved) {
          props = schema.resolved.properties;
        }
        if (props && typeof props === 'object') {
          const keys = Object.keys(props);
          const foundKey = keys.find(k => {
            const kLower = k.toLowerCase();
            return kLower === 'code' || kLower === 'coupon' || kLower === 'promo' || kLower === 'voucher';
          });
          if (foundKey) {
            promoKey = foundKey;
          } else if (keys.length > 0) {
            promoKey = keys[0];
          }
        }
      }
    }
  }

  return { itemsGroupName, promoGroupName, promoKey };
}
