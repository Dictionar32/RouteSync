/** Declarative assignability relation over semantic type witnesses. */

import { SemanticType } from '../SemanticType';
import { relationResolve, relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationAnyMatch } from '../../../semantic/kernel/relationalSequence';

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
      () => relationAnyMatch((target as Extract<SemanticType, { kind: 'union' }>).members, member => checkAssignable(source, member, isSubtype)),
      () => false,
    ),
  );
}
