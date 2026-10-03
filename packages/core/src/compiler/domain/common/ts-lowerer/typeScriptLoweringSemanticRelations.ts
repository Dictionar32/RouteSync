/** Declarative semantic dispatch for ResolvedSemanticType -> TypeScript lowering operation. */
import type { ResolvedSemanticTypeKind } from '../ResolvedSemanticType';
import { relationFirstOption, relationOptionFold, relationProject, relationResolve, relationRefine } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual } from '../../../../semantic/kernel/semanticRelations';
import {
  solveSemanticRelations,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../../../scanner/lexer/routeAst/semanticRelationSolver';

export type TypeScriptLoweringSemanticRelation =
  | 'resolved_type_kind'
  | 'typescript_lowering_operation';

export type TypeScriptLoweringOperation = ResolvedSemanticTypeKind;

const entries: readonly ResolvedSemanticTypeKind[] = Object.freeze([
  'primitive', 'reference', 'optional', 'nullable', 'collection',
  'object', 'union', 'intersection', 'unknown',
]);

export const TYPESCRIPT_LOWERING_RULES:
  readonly SemanticRelationRewrite<TypeScriptLoweringSemanticRelation>[] = Object.freeze(
    relationProject(entries, (kind, index) => Object.freeze({
      id: `typescript-lowering-${kind}`,
      priority: entries.length - index,
      when: [{ relation: 'resolved_type_kind' as const, arguments: [kind] }],
      then: [{ relation: 'typescript_lowering_operation' as const, arguments: [kind, kind] }],
    })),
  );

const isTypeScriptLoweringOperation = (value: SemanticRelation<TypeScriptLoweringSemanticRelation>['arguments'][number]): value is TypeScriptLoweringOperation => relationAny([
  relationEqual(value, 'primitive'), relationEqual(value, 'reference'), relationEqual(value, 'optional'),
  relationEqual(value, 'nullable'), relationEqual(value, 'collection'), relationEqual(value, 'object'),
  relationEqual(value, 'union'), relationEqual(value, 'intersection'), relationEqual(value, 'unknown'),
]);

export function resolveTypeScriptLoweringOperation(
  kind: ResolvedSemanticTypeKind,
): TypeScriptLoweringOperation {
  const solved = solveSemanticRelations<TypeScriptLoweringSemanticRelation>(
    [{ relation: 'resolved_type_kind', arguments: [kind] }],
    TYPESCRIPT_LOWERING_RULES,
  );
  const fact = relationFirstOption(solved, (entry: SemanticRelation<TypeScriptLoweringSemanticRelation>) => relationAll([relationEqual(entry.relation, 'typescript_lowering_operation'), relationEqual(entry.arguments[0], kind)]));
  return relationOptionFold(fact, () => { throw Error(`No TypeScript lowering semantic rule for '${kind}'`); }, entry =>
    relationOptionFold(
      relationRefine(entry.arguments[1], isTypeScriptLoweringOperation),
      () => { throw Error(`Invalid TypeScript lowering witness for '${kind}'`); },
      value => value,
    ));
}
