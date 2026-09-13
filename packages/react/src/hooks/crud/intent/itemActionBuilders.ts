/**
 * itemActionBuilders.ts
 *
 * Builds item-level collection manipulation actions (add, changeQty, setQty, remove).
 *
 * @module react/hooks/crud/intent
 */

import { hasKey, getNumberValue, callMutate } from './intentHelpers';
import type { AggregateCollectionConfig } from './intentTypes';

export function buildItemActions<TCreate, TUpdate, TRemove>(
  result: unknown,
  createItem: TCreate,
  updateItem: TUpdate,
  removeItem: TRemove,
  config: AggregateCollectionConfig,
  emit: (event: string, ...args: unknown[]) => void
) {
  const { collectionField, identityField, quantityField, groupName } = config;

  const getQty = (idVal: string | number): number => {
    let cartData: unknown = result;
    if (hasKey(result, groupName)) {
      cartData = result[groupName];
    } else if (hasKey(result, 'data')) {
      cartData = result.data;
    }

    if (hasKey(cartData, collectionField)) {
      const items = cartData[collectionField];
      if (Array.isArray(items)) {
        const item = items.find((i: unknown) => {
          return hasKey(i, identityField) && String(i[identityField]) === String(idVal);
        });
        return getNumberValue(item, quantityField);
      }
    }
    return 0;
  };

  const setQty = async (idVal: string | number, qty: number): Promise<unknown> => {
    const currentQty = getQty(idVal);
    if (qty <= 0) {
      return callMutate(removeItem, idVal);
    }
    try {
      let res: unknown;
      if (currentQty === 0) {
        res = await callMutate(createItem, { [identityField]: String(idVal), [quantityField]: qty });
      } else {
        res = await callMutate(updateItem, { id: idVal, data: { [quantityField]: qty } });
      }
      emit('add:success', res);
      emit('added', res);
      return res;
    } catch (err) {
      emit('add:error', err);
      throw err;
    }
  };

  const changeQty = async (idVal: string | number, delta: number): Promise<unknown> => {
    const currentQty = getQty(idVal);
    const targetQty = currentQty + delta;
    return setQty(idVal, targetQty);
  };

  const add = async (idVal: string | number, qty = 1): Promise<unknown> => {
    const currentQty = getQty(idVal);
    try {
      let res: unknown;
      if (currentQty === 0) {
        res = await callMutate(createItem, { [identityField]: String(idVal), [quantityField]: qty });
      } else {
        res = await callMutate(updateItem, { id: idVal, data: { [quantityField]: currentQty + qty } });
      }
      emit('add:success', res);
      emit('added', res);
      return res;
    } catch (err) {
      emit('add:error', err);
      throw err;
    }
  };

  const remove = async (idVal: string | number): Promise<unknown> => {
    try {
      const res = await callMutate(removeItem, idVal);
      emit('remove:success', res);
      emit('removed', res);
      return res;
    } catch (err) {
      emit('remove:error', err);
      throw err;
    }
  };

  return {
    add: add as any,
    changeQty: changeQty as any,
    setQty: setQty as any,
    remove: remove as any,
    createMut: createItem,
    updateMut: updateItem,
    removeMut: removeItem,
  };
}
