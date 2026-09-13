/**
 * intentHelpers.ts
 *
 * Runtime reflection and mutation invocation utilities for aggregate collection intents.
 *
 * @module react/hooks/crud/intent
 */

export const hasKey = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return (typeof obj === 'object' || typeof obj === 'function') && obj !== null && key in obj
}

export const getNumberValue = (obj: unknown, key: string): number => {
  if (hasKey(obj, key)) {
    const val = obj[key]
    if (typeof val === 'number') return val
  }
  return 0
}

export const callMutate = (mut: unknown, arg: unknown): Promise<unknown> => {
  if (typeof mut === 'object' && mut !== null && 'mutateAsync' in mut) {
    const fn = (mut as any).mutateAsync
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
