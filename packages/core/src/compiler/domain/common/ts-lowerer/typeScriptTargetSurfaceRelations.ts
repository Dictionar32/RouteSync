/** Declarative TypeScript target-surface vocabulary owned by relation solving. */
import { relationFirstOption, relationOptionFold, relationProject } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationEqual } from '../../../../semantic/kernel/semanticRelations';
import {
  solveSemanticRelations,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../../../scanner/lexer/routeAst/semanticRelationSolver';
import { TypeScriptToken } from './typeScriptVocabulary';

export type TypeScriptTargetSurfaceRelation =
  | 'surface_operation'
  | 'surface_token';

export type TypeScriptSurfaceOperation =
  | 'optional_type'
  | 'nullable_type'
  | 'array_type'
  | 'optional_property';

const entries: readonly [TypeScriptSurfaceOperation, string][] = Object.freeze([
  ['optional_type', TypeScriptToken.Union + TypeScriptToken.Undefined],
  ['nullable_type', TypeScriptToken.Union + TypeScriptToken.Null],
  ['array_type', TypeScriptToken.ArraySuffix],
  ['optional_property', TypeScriptToken.OptionalPropertyMarker],
]);

export const TYPESCRIPT_TARGET_SURFACE_RULES:
  readonly SemanticRelationRewrite<TypeScriptTargetSurfaceRelation>[] = Object.freeze(
    relationProject(entries, ([operation, token], index) => Object.freeze({
      id: `typescript-surface-${operation}`,
      priority: entries.length - index,
      when: [{ relation: 'surface_operation' as const, arguments: [operation] }],
      then: [{ relation: 'surface_token' as const, arguments: [operation, token] }],
    })),
  );

export function resolveTypeScriptSurfaceToken(operation: TypeScriptSurfaceOperation): string {
  const solved = solveSemanticRelations<TypeScriptTargetSurfaceRelation>(
    [{ relation: 'surface_operation', arguments: [operation] }],
    TYPESCRIPT_TARGET_SURFACE_RULES,
  );
  const fact = relationFirstOption(
    solved,
    (entry: SemanticRelation<TypeScriptTargetSurfaceRelation>) =>
      relationAll([
        relationEqual(entry.relation, 'surface_token'),
        relationEqual(entry.arguments[0], operation),
      ]),
  );
  return relationOptionFold(
    fact,
    () => { throw Error(`Missing TypeScript target surface rule: '${operation}'`); },
    entry => String(entry.arguments[1]),
  );
}
