/**
 * Relational equivalence closure.
 *
 * Equivalence is represented as immutable parent/rank relations.  The solver
 * owns the current witness and receives a new witness after union; no host
 * Map/Set or constructor state participates in semantic authority.
 */
import {
  relationEqual,
  relationResolve,
} from '../../semantic/foundation/semanticRelations';
import {
  relationIndexAdd,
  relationIndexLookup,
  type RelationIndex,
} from '../../semantic/foundation/relationMembership';
import { relationOptionFold } from '../../semantic/foundation/relationalSequence';

export interface UnionFind {
  readonly parents: RelationIndex<number, number>;
  readonly ranks: RelationIndex<number, number>;
}

export const createUnionFind = (): UnionFind => Object.freeze({
  parents: Object.freeze([]),
  ranks: Object.freeze([]),
});

export const unionFindFind = (state: UnionFind, id: number): number =>
  relationOptionFold(
    relationIndexLookup(state.parents, id),
    () => id,
    value => relationResolve(relationEqual(value, id), () => id, () => unionFindFind(state, value)),
  );

export const unionFindUnion = (state: UnionFind, a: number, b: number): UnionFind => {
  const rootA = unionFindFind(state, a);
  const rootB = unionFindFind(state, b);
  return relationResolve(
    relationEqual(rootA, rootB),
    () => state,
    () => {
      const rankA = relationOptionFold(relationIndexLookup(state.ranks, rootA), () => 0, value => value);
      const rankB = relationOptionFold(relationIndexLookup(state.ranks, rootB), () => 0, value => value);
      return relationResolve(
        rankA < rankB,
        () => Object.freeze({ ...state, parents: relationIndexAdd(state.parents, rootA, rootB) }),
        () => relationResolve(
          rankA > rankB,
          () => Object.freeze({ ...state, parents: relationIndexAdd(state.parents, rootB, rootA) }),
          () => Object.freeze({
            ...state,
            parents: relationIndexAdd(state.parents, rootB, rootA),
            ranks: relationIndexAdd(state.ranks, rootA, rankA + 1),
          }),
        ),
      );
    },
  );
};
