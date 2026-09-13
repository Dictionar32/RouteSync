/**
 * storage.ts
 *
 * QueryStorage and QueryValueStore implementations.
 *
 * @module core/compiler/query/cache
 */

export interface QueryStorage {
  readonly size: number;
  clear(): void;
}

export interface QueryValueStore<O> extends QueryStorage {
  read(id: string): O | undefined;
  write(id: string, value: O): void;
  has(id: string): boolean;
  remove(id: string): boolean;
}

export function createQueryValueStore<O>(): QueryValueStore<O> {
  const values = new Map<string, O>();

  return {
    read: (id: string): O | undefined => values.get(id),
    write: (id: string, value: O): void => {
      values.set(id, value);
    },
    has: (id: string): boolean => values.has(id),
    remove: (id: string): boolean => values.delete(id),
    get size(): number {
      return values.size;
    },
    clear: (): void => {
      values.clear();
    }
  };
}
