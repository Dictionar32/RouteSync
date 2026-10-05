/**
 * cartModelResolver.ts
 *
 * Resolves cart model, item model, quantity field, and identity item key from manifest models.
 *
 * @module cli/resolvers/intent
 */

import type { RouteManifest } from '@routesync/core';
import type { ClassifiedRoute } from '../../generators/route-classifier';

const sequenceToArray = <T>(sequence: { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: typeof sequence }): readonly T[] =>
  sequence.kind === 'empty' ? [] : [sequence.head, ...sequenceToArray(sequence.tail)];

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

  const cartModel = manifest.models?.find(m => m.definition.semantic.identity.name.value.value === cartModelName);
  let itemsModelName = '';
  if (cartModel) {
    for (const property of sequenceToArray(cartModel.definition.semantic.surface.properties)) {
      if (property.kind === 'relation' && property.eloquentType.kind === 'has_many') {
        itemsField = property.property.value.value;
        itemsModelName = property.targetModel.value.value;
        break;
      }
    }
  }

  const itemsModel = manifest.models?.find(m => m.definition.semantic.identity.name.value.value === itemsModelName);
  if (itemsModel) {
    const properties = sequenceToArray(itemsModel.definition.semantic.surface.properties);
    const columns = properties.filter((property): property is Extract<typeof property, { readonly kind: 'column' }> => property.kind === 'column');
    const relations = properties.filter((property): property is Extract<typeof property, { readonly kind: 'relation' }> => property.kind === 'relation');

    const foundQty = columns.find(column => {
      const nameLower = column.property.value.value.toLowerCase();
      return nameLower === 'qty' || nameLower === 'quantity' || nameLower === 'jumlah' || nameLower === 'count';
    });
    if (foundQty) {
      qtyField = foundQty.property.value.value.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    for (const relation of relations) {
      if (relation.eloquentType.kind !== 'belongs_to' || relation.targetModel.value.value === cartModelName) continue;
      const relName = relation.property.value.value;
      const targetModel = relation.targetModel.value.value;
      const possibleKeys = [
        `${relName}_id`,
        `${relName}Id`,
        `${targetModel.toLowerCase()}_id`,
        `${targetModel.toLowerCase()}Id`,
      ];
      const foundCol = columns.find(column => {
        const name = column.property.value.value;
        const colCamel = name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
        return possibleKeys.includes(name) || possibleKeys.includes(colCamel) || name.includes('item_id') || name.includes('product_id');
      });
      if (foundCol) {
        itemKey = foundCol.property.value.value.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
        break;
      }
    }
  }

  return { itemsField, qtyField, itemKey };
}
