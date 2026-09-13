/**
 * intent/index.ts
 *
 * Explicit named exports for Aggregate Collection Intent sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module react/hooks/crud/intent
 */

export {
  hasKey,
  getNumberValue,
  callMutate
} from './intentHelpers';

export type {
  AggregateCollectionConfig,
  AggregateCollectionIntentActions
} from './intentTypes';

export {
  useIntentEventEmitter,
  type IntentEventEmitter
} from './intentEventEmitter';

export { buildItemActions } from './itemActionBuilders';
export { buildPromotionActions } from './promotionActionBuilders';
