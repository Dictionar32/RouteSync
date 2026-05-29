export type KeyCase = 'camel' | 'snake'
export type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
  : S

export type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `${Lowercase<Head>}_${CamelToSnake<Tail>}`
  : S

export type CamelCasedPropertiesDeep<T> = T extends readonly (infer Item)[]
  ? CamelCasedPropertiesDeep<Item>[]
  : T extends object
    ? {
        [K in keyof T as K extends string ? SnakeToCamel<K> : K]: CamelCasedPropertiesDeep<T[K]>
      }
    : T

export type SnakeCasedPropertiesDeep<T> = T extends readonly (infer Item)[]
  ? SnakeCasedPropertiesDeep<Item>[]
  : T extends object
    ? {
        [K in keyof T as K extends string ? CamelToSnake<K> : K]: SnakeCasedPropertiesDeep<T[K]>
      }
    : T

export type UnknownRecord = Record<string, unknown>

export function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase())
}

export function camelToSnakeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

export function isPlainObject(value: unknown): value is UnknownRecord {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function mapKeysDeep<T>(value: T, keyCase: KeyCase): T {
  if (Array.isArray(value)) {
    return value.map((item) => mapKeysDeep(item, keyCase)) as T
  }

  if (!isPlainObject(value)) {
    return value
  }

  const mapper = keyCase === 'camel' ? snakeToCamelKey : camelToSnakeKey
  const mapped: UnknownRecord = {}

  for (const [key, child] of Object.entries(value)) {
    mapped[mapper(key)] = mapKeysDeep(child, keyCase)
  }

  return mapped as T
}

export function toCamelCase<T>(value: T): T {
  return mapKeysDeep(value, 'camel')
}

export function toSnakeCase<T>(value: T): T {
  return mapKeysDeep(value, 'snake')
}
