/**
 * Declarative subtyping relation.
 *
 * The checker is expressed as an ordered relation catalog: each rule declares
 * the shape it owns and the witness that proves that shape. Collection walks,
 * generic variance and hierarchy closure are recursive relations rather than
 * host-language control flow.
 */

import { SemanticType, PrimitiveKind } from '../SemanticType';
import { TypeHasher, HashContext } from '../TypeHasher';
import type { TypeHierarchy } from '../TypeHierarchy';
import { presenceFold, type Presence } from '../../../types/upstream/presence';
import { relationContains, relationInsert } from '../../../semantic/kernel/relationMembership';
import { relationAll, relationAny, relationEqual, relationResolve } from '../../../semantic/kernel/semanticRelations';
import { relationOptionFold } from '../../../semantic/kernel/relationalSequence';

const sameReference = (
  source: Extract<SemanticType, { kind: 'reference' }>,
  target: Extract<SemanticType, { kind: 'reference' }>,
): boolean => relationAll([
  relationEqual(source.name, target.name),
  relationEqual(source.namespace, target.namespace),
]);

const sameHash = (left: SemanticType, right: SemanticType, ctx: HashContext): boolean =>
  relationEqual(TypeHasher.hash(left, ctx), TypeHasher.hash(right, ctx));

const referenceClosure = (
  source: Extract<SemanticType, { kind: 'reference' }>,
  target: Extract<SemanticType, { kind: 'reference' }>,
  hierarchy: TypeHierarchy,
  seen: readonly string[],
): boolean => {
  const identifier = `${source.namespace}\\${source.name}`;
  const cycle = relationContains(seen, identifier);
  const nextSeen = relationInsert(seen, identifier);
  const parent: Presence<SemanticType> = relationResolve(cycle, () => ({ kind: 'absent' as const }), () => hierarchy.getParent(source));
  return relationResolve(
    cycle,
    () => false,
    () => relationResolve(
      sameReference(source, target),
      () => true,
      () => presenceFold(
        parent,
        () => false,
        value => relationResolve(
          relationEqual(value.kind, 'reference'),
          () => referenceClosure(value as Extract<SemanticType, { kind: 'reference' }>, target, hierarchy, nextSeen),
          () => false,
        ),
      ),
    ),
  );
};

const genericParametersSubtype = (
  source: Extract<SemanticType, { kind: 'generic' }>['parameters'],
  target: Extract<SemanticType, { kind: 'generic' }>['parameters'],
  hierarchy: TypeHierarchy,
  isAssignable: (s: SemanticType, t: SemanticType) => boolean,
  ctx: HashContext,
  index = 0,
): boolean => relationResolve(
  index >= source.length,
  () => true,
  () => {
    const s = source[index];
    const t = target[index];
    const variance = relationResolve(
      relationEqual(s.variance, 'covariant'),
      () => checkSubtype(s.type, t.type, hierarchy, isAssignable, ctx),
      () => relationResolve(
        relationEqual(s.variance, 'contravariant'),
        () => checkSubtype(t.type, s.type, hierarchy, isAssignable, ctx),
        () => relationResolve(
          relationEqual(s.variance, 'invariant'),
          () => sameHash(s.type, t.type, ctx),
          () => false,
        ),
      ),
    );
    return relationAll([variance, genericParametersSubtype(source, target, hierarchy, isAssignable, ctx, index + 1)]);
  },
);

const unionSubtype = (
  members: readonly SemanticType[],
  target: SemanticType,
  isAssignable: (s: SemanticType, t: SemanticType) => boolean,
  index = 0,
): boolean => relationResolve(
  index >= members.length,
  () => true,
  () => relationAll([
    isAssignable(members[index], target),
    unionSubtype(members, target, isAssignable, index + 1),
  ]),
);

export function checkSubtype(
  source: SemanticType,
  target: SemanticType,
  hierarchy: TypeHierarchy,
  isAssignable: (s: SemanticType, t: SemanticType) => boolean,
  ctx: HashContext = TypeHasher.createContext(),
): boolean {
  return relationResolve(
    relationAll([relationEqual(target.kind, 'primitive'), relationEqual((target as Extract<SemanticType, { kind: 'primitive' }>).type, PrimitiveKind.INDETERMINATE)]),
    () => true,
    () => relationResolve(
      relationEqual(source.kind, 'union'),
      () => unionSubtype((source as Extract<SemanticType, { kind: 'union' }>).members, target, isAssignable),
      () => relationResolve(
        relationAll([relationEqual(source.kind, 'primitive'), relationEqual(target.kind, 'primitive')]),
        () => relationEqual((source as Extract<SemanticType, { kind: 'primitive' }>).type, (target as Extract<SemanticType, { kind: 'primitive' }>).type),
        () => relationResolve(
          relationAll([relationEqual(source.kind, 'reference'), relationEqual(target.kind, 'reference')]),
          () => referenceClosure(source as Extract<SemanticType, { kind: 'reference' }>, target as Extract<SemanticType, { kind: 'reference' }>, hierarchy, []),
          () => relationResolve(
            relationAll([relationEqual(source.kind, 'readonly_collection'), relationEqual(target.kind, 'readonly_collection')]),
            () => checkSubtype((source as Extract<SemanticType, { kind: 'readonly_collection' }>).elementType, (target as Extract<SemanticType, { kind: 'readonly_collection' }>).elementType, hierarchy, isAssignable, ctx),
            () => relationResolve(
              relationAll([relationEqual(source.kind, 'mutable_collection'), relationEqual(target.kind, 'mutable_collection')]),
              () => sameHash((source as Extract<SemanticType, { kind: 'mutable_collection' }>).elementType, (target as Extract<SemanticType, { kind: 'mutable_collection' }>).elementType, ctx),
              () => relationResolve(
                relationAll([relationEqual(source.kind, 'generic'), relationEqual(target.kind, 'generic')]),
                () => relationAll([
                  checkSubtype((source as Extract<SemanticType, { kind: 'generic' }>).base, (target as Extract<SemanticType, { kind: 'generic' }>).base, hierarchy, isAssignable, ctx),
                  genericParametersSubtype((source as Extract<SemanticType, { kind: 'generic' }>).parameters, (target as Extract<SemanticType, { kind: 'generic' }>).parameters, hierarchy, isAssignable, ctx),
                ]),
                () => false,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
