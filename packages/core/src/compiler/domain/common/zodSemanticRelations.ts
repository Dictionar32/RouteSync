/** Declarative resolved-type -> Zod lowering semantics. */
import { solveSemanticRelations, type SemanticRelation, type SemanticRelationRewrite } from '../../scanner/lexer/routeAst/semanticRelationSolver';
import { relationAll } from '../../../semantic/kernel/semanticRelations';
import { relationFirst, relationOptionFold, relationProject } from '../../../semantic/kernel/relationalSequence';
import type { ResolvedSemanticTypeKind } from './ResolvedSemanticType';

export type ZodSemanticRelation = 'resolved_type_kind' | 'zod_lowering_operation';

const kinds: readonly ResolvedSemanticTypeKind[] = Object.freeze([
  'primitive', 'reference', 'optional', 'nullable', 'collection', 'object', 'union', 'intersection', 'unknown',
]);

export const ZOD_LOWERING_RULES: readonly SemanticRelationRewrite<ZodSemanticRelation>[] = Object.freeze(
  relationProject(kinds, (kind, index) => Object.freeze({
    id: `zod-lowering-${kind}`,
    priority: kinds.length - index,
    when: [{ relation: 'resolved_type_kind' as const, arguments: [kind] }],
    then: [{ relation: 'zod_lowering_operation' as const, arguments: [kind, kind] }],
  })),
);

export function resolveZodLoweringOperation(kind: ResolvedSemanticTypeKind): ResolvedSemanticTypeKind {
  const solved = solveSemanticRelations<ZodSemanticRelation>(
    [{ relation: 'resolved_type_kind', arguments: [kind] }],
    ZOD_LOWERING_RULES,
  );
  const fact = relationFirst(solved, entry => relationAll([Object.is(entry.relation, 'zod_lowering_operation'), Object.is(entry.arguments[0], kind)]));
  return relationOptionFold(fact, () => { throw new Error(`No Zod lowering semantic rule for '${kind}'`); }, entry => entry.arguments[1] as ResolvedSemanticTypeKind);
}
