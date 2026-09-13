/**
 * useAggregateCollectionIntent.ts
 *
 * Active Consumer Orchestrator for high-level aggregate collection manipulation
 * (items add, changeQty, setQty, remove, and promotions).
 * Pure Flow Declaration: coordinates event emitter, item actions, and promotion actions.
 *
 * @module react/hooks/crud
 */

import {
  hasKey,
  getNumberValue,
  callMutate,
  useIntentEventEmitter,
  buildItemActions,
  buildPromotionActions,
  type AggregateCollectionConfig,
  type AggregateCollectionIntentActions
} from './intent';

export {
  hasKey,
  getNumberValue,
  callMutate,
  type AggregateCollectionConfig,
  type AggregateCollectionIntentActions
};

export const useAggregateCollectionIntent = <
  TResult extends object,
  TCreate,
  TUpdate,
  TRemove,
  TApply,
  TRemovePromo
>(
  result: TResult,
  mutations: {
    createItem: TCreate
    updateItem: TUpdate
    removeItem: TRemove
    applyPromo: TApply
    removePromo: TRemovePromo
  },
  config: AggregateCollectionConfig
): TResult & AggregateCollectionIntentActions<TCreate, TUpdate, TRemove, TApply, TRemovePromo> => {
  const { on, emit } = useIntentEventEmitter();

  const items = buildItemActions(
    result,
    mutations.createItem,
    mutations.updateItem,
    mutations.removeItem,
    config,
    emit
  );

  const promotions = buildPromotionActions(
    mutations.applyPromo,
    mutations.removePromo,
    config,
    emit
  );

  return Object.assign(result, {
    items,
    promotions,
    on
  }) as TResult & AggregateCollectionIntentActions<TCreate, TUpdate, TRemove, TApply, TRemovePromo>;
};
