/**
 * promotionActionBuilders.ts
 *
 * Builds promotion-level collection manipulation actions (apply, remove).
 *
 * @module react/hooks/crud/intent
 */

import { callMutate } from './intentHelpers';
import type { AggregateCollectionConfig } from './intentTypes';

export function buildPromotionActions<TApply, TRemovePromo>(
  applyPromo: TApply,
  removePromo: TRemovePromo,
  config: AggregateCollectionConfig,
  emit: (event: string, ...args: unknown[]) => void
) {
  const { promotionCodeField } = config;

  const applyPromoCode = async (code: string): Promise<unknown> => {
    try {
      const res = await callMutate(applyPromo, { [promotionCodeField]: code });
      emit('applyPromo:success', res);
      emit('promoApplied', res);
      return res;
    } catch (err) {
      emit('applyPromo:error', err);
      throw err;
    }
  };

  const removePromoCode = async (): Promise<unknown> => {
    try {
      const res = await callMutate(removePromo, undefined);
      emit('removePromo:success', res);
      emit('promoRemoved', res);
      return res;
    } catch (err) {
      emit('removePromo:error', err);
      throw err;
    }
  };

  return {
    apply: applyPromoCode,
    remove: removePromoCode,
    applyMut: applyPromo,
    removeMut: removePromo,
  };
}
