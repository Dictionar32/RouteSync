export interface AggregateCollectionConfig {
  itemsField: string
  itemKey: string
  qtyField: string
  groupName: string
}

export interface AggregateCollectionIntentActions<
  TCreate,
  TUpdate,
  TRemove,
  TApply,
  TRemovePromo
> {
  inc: (idVal: number) => Promise<unknown>
  dec: (idVal: number) => Promise<unknown>
  remove: (idVal: number) => Promise<unknown>
  add: (idVal: number, qty?: number) => Promise<unknown>
  applyPromo: (code: string) => Promise<unknown>
  removePromo: () => Promise<unknown>
  createItemMut: TCreate
  updateItemMut: TUpdate
  removeItemMut: TRemove
  applyPromoMut: TApply
  removePromoMut: TRemovePromo
}

const hasKey = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return (typeof obj === 'object' || typeof obj === 'function') && obj !== null && key in obj
}

const getNumberValue = (obj: unknown, key: string): number => {
  if (hasKey(obj, key)) {
    const val = obj[key]
    if (typeof val === 'number') return val
  }
  return 0
}

const callMutate = (mut: unknown, arg: unknown): Promise<unknown> => {
  if (typeof mut === 'object' && mut !== null && 'mutateAsync' in mut) {
    const fn = mut.mutateAsync
    if (typeof fn === 'function') {
      const res = fn(arg)
      if (res instanceof Promise) {
        return res
      }
      return Promise.resolve(res)
    }
  }
  return Promise.resolve(null)
}

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
  const { createItem, updateItem, removeItem, applyPromo, removePromo } = mutations
  const { itemsField, itemKey, qtyField, groupName } = config

  const getQty = (idVal: number): number => {
    let cartData: unknown = result
    if (hasKey(result, groupName)) {
      cartData = result[groupName]
    } else if (hasKey(result, 'data')) {
      cartData = result.data
    }

    if (hasKey(cartData, itemsField)) {
      const items = cartData[itemsField]
      if (Array.isArray(items)) {
        const item = items.find((i: unknown) => {
          return hasKey(i, itemKey) && i[itemKey] === idVal
        })
        return getNumberValue(item, qtyField)
      }
    }
    return 0
  }

  const inc = async (idVal: number) => {
    const currentQty = getQty(idVal)
    if (currentQty === 0) {
      return callMutate(createItem, { [itemKey]: String(idVal), [qtyField]: 1 })
    } else {
      return callMutate(updateItem, { id: idVal, data: { [qtyField]: currentQty + 1 } })
    }
  }

  const dec = async (idVal: number) => {
    const currentQty = getQty(idVal)
    if (currentQty <= 1) {
      return callMutate(removeItem, idVal)
    } else {
      return callMutate(updateItem, { id: idVal, data: { [qtyField]: currentQty - 1 } })
    }
  }

  const remove = async (idVal: number) => {
    return callMutate(removeItem, idVal)
  }

  const add = async (idVal: number, qty = 1) => {
    const currentQty = getQty(idVal)
    if (currentQty === 0) {
      return callMutate(createItem, { [itemKey]: String(idVal), [qtyField]: qty })
    } else {
      return callMutate(updateItem, { id: idVal, data: { [qtyField]: currentQty + qty } })
    }
  }

  const applyPromoCode = async (code: string) => {
    return callMutate(applyPromo, { code })
  }

  const removePromoCode = async () => {
    return callMutate(removePromo, 1)
  }

  return Object.assign(result, {
    inc,
    dec,
    remove,
    add,
    applyPromo: applyPromoCode,
    removePromo: removePromoCode,
    createItemMut: createItem,
    updateItemMut: updateItem,
    removeItemMut: removeItem,
    applyPromoMut: applyPromo,
    removePromoMut: removePromo,
  })
}
