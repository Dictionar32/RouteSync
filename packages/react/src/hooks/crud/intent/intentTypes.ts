/**
 * intentTypes.ts
 *
 * Contract specifications and action interfaces for aggregate collection intents.
 *
 * @module react/hooks/crud/intent
 */

import { type UseMutationResult } from '@tanstack/react-query'

export interface AggregateCollectionConfig {
  collectionField: string
  identityField: string
  quantityField: string
  groupName: string
  promotionCodeField: string
}

export interface AggregateCollectionIntentActions<
  TCreate,
  TUpdate,
  TRemove,
  TApply,
  TRemovePromo,
  TIdentityField extends string = 'id',
  TQuantityField extends string = 'qty'
> {
  items: {
    add: (
      idVal: TCreate extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends { [K in TIdentityField]: infer TId }
          ? TId
          : string | number
        : string | number,
      qty?: number
    ) => Promise<unknown>
    changeQty: (
      idVal: TCreate extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends { [K in TIdentityField]: infer TId }
          ? TId
          : string | number
        : string | number,
      delta: number
    ) => Promise<unknown>
    setQty: (
      idVal: TCreate extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends { [K in TIdentityField]: infer TId }
          ? TId
          : string | number
        : string | number,
      qty: number
    ) => Promise<unknown>
    remove: (
      idVal: TRemove extends UseMutationResult<unknown, Error, infer TVar>
        ? TVar extends number
          ? number
          : TVar extends string
            ? string
            : string | number
        : string | number
    ) => Promise<unknown>
    createMut: TCreate
    updateMut: TUpdate
    removeMut: TRemove
  }
  promotions: {
    apply: (code: string) => Promise<unknown>
    remove: () => Promise<unknown>
    applyMut: TApply
    removeMut: TRemovePromo
  }
  on: (event: string, callback: (...args: unknown[]) => void) => () => void
}
