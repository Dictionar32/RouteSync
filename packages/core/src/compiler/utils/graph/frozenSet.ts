/**
 * frozenSet.ts
 *
 * Immutable ReadonlySet implementation.
 *
 * @module core/compiler/utils/graph
 */

export class FrozenSet<T> implements ReadonlySet<T> {
  #data: Set<T>;

  constructor(source: ReadonlySet<T>) {
    this.#data = new Set(source);
    Object.freeze(this);
  }

  public has(v: T): boolean {
    return this.#data.has(v);
  }

  public values(): IterableIterator<T> {
    return this.#data.values();
  }

  public get size(): number {
    return this.#data.size;
  }

  public forEach(
    callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void,
    thisArg?: unknown
  ): void {
    this.#data.forEach((v, v2) => callbackfn.call(thisArg, v, v2, this));
  }

  public [Symbol.iterator](): IterableIterator<T> {
    return this.#data[Symbol.iterator]();
  }

  public entries(): IterableIterator<[T, T]> {
    return this.#data.entries();
  }

  public keys(): IterableIterator<T> {
    return this.#data.keys();
  }
}
