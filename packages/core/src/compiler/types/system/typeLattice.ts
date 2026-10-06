/** Declarative join/meet relations over the semantic type lattice. */

import { SemanticType, UnionType, NeverType } from '../../../types/domain/semanticType';
import { TypeHasher, HashContext } from '../TypeHasher';
import { relationEqual, relationResolve } from '../../../semantic/foundation/semanticRelations';

const structuralEqual = (a: SemanticType, b: SemanticType, ctx: HashContext): boolean =>
  relationEqual(TypeHasher.hash(a, ctx), TypeHasher.hash(b, ctx));

export function computeJoin(a: SemanticType, b: SemanticType): SemanticType {
  const ctx: HashContext = TypeHasher.createContext();
  return relationResolve(
    structuralEqual(a, b, ctx),
    () => a,
    () => relationResolve(
      relationEqual(a.kind, 'never'),
      () => b,
      () => relationResolve(relationEqual(b.kind, 'never'), () => a, () => UnionType.of(a, b)),
    ),
  );
}

export function computeMeet(a: SemanticType, b: SemanticType): SemanticType {
  const ctx: HashContext = TypeHasher.createContext();
  return relationResolve(structuralEqual(a, b, ctx), () => a, () => NeverType());
}
