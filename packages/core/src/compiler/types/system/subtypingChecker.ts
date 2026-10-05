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
import { relationContains, relationInsert } from '../../../semantic/foundation/relationMembership';
import { relationAll, relationAny, relationEqual, relationResolve } from '../../../semantic/foundation/semanticRelations';
import { relationOptionFold, relationVariantFold } from '../../../semantic/foundation/relationalSequence';

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
        value => relationVariantFold(value, 'reference', () => false, reference => referenceClosure(reference, target, hierarchy, nextSeen)),
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
  const indeterminateTarget = relationVariantFold(
    target,
    'primitive',
    () => false,
    primitive => relationEqual(primitive.type, PrimitiveKind.INDETERMINATE),
  );
  return relationResolve(
    indeterminateTarget,
    () => true,
    () => relationVariantFold(
      source,
      'union',
      () => relationVariantFold(
        source,
        'primitive',
        () => relationVariantFold(
          source,
          'reference',
          () => relationVariantFold(
            source,
            'readonly_collection',
            () => relationVariantFold(
              source,
              'mutable_collection',
              () => relationVariantFold(
                source,
                'generic',
                () => false,
                genericSource => relationVariantFold(
                  target,
                  'generic',
                  () => false,
                  genericTarget => relationAll([
                    checkSubtype(genericSource.base, genericTarget.base, hierarchy, isAssignable, ctx),
                    genericParametersSubtype(genericSource.parameters, genericTarget.parameters, hierarchy, isAssignable, ctx),
                  ]),
                ),
              ),
              mutableSource => relationVariantFold(
                target,
                'mutable_collection',
                () => false,
                mutableTarget => sameHash(mutableSource.elementType, mutableTarget.elementType, ctx),
              ),
            ),
            readonlySource => relationVariantFold(
              target,
              'readonly_collection',
              () => false,
              readonlyTarget => checkSubtype(readonlySource.elementType, readonlyTarget.elementType, hierarchy, isAssignable, ctx),
            ),
          ),
          referenceSource => relationVariantFold(
            target,
            'reference',
            () => false,
            referenceTarget => referenceClosure(referenceSource, referenceTarget, hierarchy, []),
          ),
        ),
        primitiveSource => relationVariantFold(
          target,
          'primitive',
          () => false,
          primitiveTarget => relationEqual(primitiveSource.type, primitiveTarget.type),
        ),
      ),
      unionSource => unionSubtype(unionSource.members, target, isAssignable),
    ),
  );
}
