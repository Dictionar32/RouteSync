/**
 * cartModelResolver.ts
 *
 * Resolves cart model, item model, quantity field, and identity item key from manifest models.
 *
 * @module cli/resolvers/intent
 */

import type { RouteManifest } from '@routesync/core';
import type { ClassifiedRoute } from '../../generators/route-classifier';

export interface CartModelInfo {
  readonly itemsField: string;
  readonly qtyField: string;
  readonly itemKey: string;
}

export function resolveCartModelInfo(
  cartGroupName: string,
  manifest: RouteManifest,
  classified: readonly ClassifiedRoute[]
): CartModelInfo {
  let itemKey = 'id';
  let qtyField = 'qty';
  let itemsField = 'items';

  let cartModelName = '';
  for (const route of classified) {
    if (route.groupName === cartGroupName && route.method === 'GET') {
      const resolvedName = route.raw.response?.model || route.raw.response?.resolved?.model;
      if (resolvedName) {
        cartModelName = resolvedName;
        break;
      }
    }
  }

  const cartModel = manifest.models?.find(m => m.name === cartModelName);
  let itemsModelName = '';
  if (cartModel && cartModel.relations) {
    for (const [relName, rel] of Object.entries(cartModel.relations)) {
      if (rel.type === 'hasMany') {
        itemsField = relName;
        itemsModelName = rel.model;
        break;
      }
    }
  }

  const itemsModel = manifest.models?.find(m => m.name === itemsModelName);
  if (itemsModel) {
    if (itemsModel.columns) {
      const foundQty = itemsModel.columns.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower === 'qty' || nameLower === 'quantity' || nameLower === 'jumlah' || nameLower === 'count';
      });
      if (foundQty) {
        qtyField = foundQty.name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
      }
    }

    if (itemsModel.relations) {
      for (const [relName, rel] of Object.entries(itemsModel.relations)) {
        if (rel.type === 'belongsTo' && rel.model !== cartModelName) {
          const possibleKeys = [
            `${relName}_id`,
            `${relName}Id`,
            `${rel.model.toLowerCase()}_id`,
            `${rel.model.toLowerCase()}Id`
          ];
          if (itemsModel.columns) {
            const foundCol = itemsModel.columns.find(c => {
              const colCamel = c.name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
              return possibleKeys.includes(c.name) || possibleKeys.includes(colCamel) || c.name.includes('item_id') || c.name.includes('product_id');
            });
            if (foundCol) {
              itemKey = foundCol.name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
              break;
            }
          }
        }
      }
    }
  }

  return { itemsField, qtyField, itemKey };
}
