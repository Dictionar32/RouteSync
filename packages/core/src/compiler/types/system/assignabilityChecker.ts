/** Declarative assignability relation over semantic type witnesses. */

import { type SemanticType } from '../../../types/domain/semanticType';
import { relationResolve, relationEqual } from '../../../semantic/foundation/semanticRelations';
import { relationAnyMatch, relationVariantFold } from '../../../semantic/foundation/relationalSequence';

export function checkAssignable(
  source: SemanticType,
  target: SemanticType,
  isSubtype: (s: SemanticType, t: SemanticType) => boolean,
): boolean {
  return relationResolve(
    isSubtype(source, target),
    () => true,
    () => relationResolve(
      relationEqual(target.kind, 'union'),
      () => relationVariantFold(target, 'union', () => false, union => relationAnyMatch(union.members, member => checkAssignable(source, member, isSubtype))),
      () => false,
    ),
  );
}
