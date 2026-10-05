/**
 * Relation-backed query storage.
 *
 * Query absence is an explicit relation option; keyed state is an immutable
 * relation rather than a host Map.
 */
import type { RelationOption } from '../../../semantic/foundation/relationFoundation';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/foundation/relationMembership';
import { relationEqual, relationResolve } from '../../../semantic/foundation/relationFoundation';
import { relationFold } from '../../../semantic/foundation/relationalSequence';
import { relationOptionFold } from '../../../semantic/foundation/relationalSequence';

export interface QueryStorage {
  readonly size: number;
  clear(): void;
}

export interface QueryValueStore<O> extends QueryStorage {
  read(id: string): RelationOption<O>;
  write(id: string, value: O): void;
  has(id: string): boolean;
  remove(id: string): boolean;
}

export function createQueryValueStore<O>(): QueryValueStore<O> {
  let values: RelationIndex<string, O> = Object.freeze([]);
  return {
    read: (id: string): RelationOption<O> => relationIndexLookup(values, id),
    write: (id: string, value: O): void => { values = relationIndexAdd(values, id, value); },
    has: (id: string): boolean => relationOptionFold(relationIndexLookup(values, id), () => false, () => true),
    remove: (id: string): boolean => {
      const found = relationIndexLookup(values, id);
      return relationOptionFold(found, () => false, () => {
        values = relationFold(values, Object.freeze([] as RelationIndex<string, O>), (output, entry) => relationResolve(relationEqual(entry[0], id), () => output, () => [...output, entry]));
        return true;
      });
    },
    get size(): number { return values.length; },
    clear: (): void => { values = Object.freeze([]); },
  };
}
