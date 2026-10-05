/**
 * Phase 657 — closed TypeScript target projection algebra.
 *
 * Target lowering is a projection from a closed semantic operation ADT. It no
 * longer delegates to the scanner's generic relation solver. The target layer
 * owns only its finite vocabulary and a declarative relation table.
 */
import { relationFirstOption, relationOptionFold, relationProject } from '../../../../semantic/foundation/relationalSequence';
import { astSemanticStageInterfaceOf, type AstSemanticStageInterface } from '../../../../types/upstream/astSemanticStageInterfaceAlgebra';
import { relationAll, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { TypeScriptToken } from './typeScriptVocabulary';
import { astSemanticFact, astSemanticTextTerm, astSemanticStageTerm, type AstSemanticFact } from '../../../../types/upstream/astSemanticInterface';
import { createTargetProjectionPort, targetProjectionFact, type AstSemanticStagePort } from '../../../../types/upstream/astSemanticStageInterface';

export type TypeScriptTargetSurfaceRelation = 'surface_operation' | 'surface_token';

export type TypeScriptSurfaceOperation =
  | 'optional_type'
  | 'nullable_type'
  | 'array_type'
  | 'optional_property';

export type TypeScriptSurfaceFact = Readonly<{
  readonly kind: 'typescript_surface_fact';
  readonly relation: TypeScriptTargetSurfaceRelation;
  readonly operation: TypeScriptSurfaceOperation;
  readonly token: string;
  readonly semantic: AstSemanticFact;
  readonly semanticPort: AstSemanticStagePort;
}>;

const entries: readonly [TypeScriptSurfaceOperation, string][] = Object.freeze([
  ['optional_type', TypeScriptToken.Union + TypeScriptToken.Undefined],
  ['nullable_type', TypeScriptToken.Union + TypeScriptToken.Null],
  ['array_type', TypeScriptToken.ArraySuffix],
  ['optional_property', TypeScriptToken.OptionalPropertyMarker],
]);

const facts: readonly TypeScriptSurfaceFact[] = Object.freeze(
  relationProject(entries, ([operation, token]) => Object.freeze({
    kind: 'typescript_surface_fact',
    relation: 'surface_token',
    operation,
    token,
    semantic: astSemanticFact(
      'target_projection',
      'ast_projects',
      astSemanticStageTerm('target_projection'),
      astSemanticTextTerm(operation),
    ),
    semanticPort: createTargetProjectionPort([targetProjectionFact(
      'target_projects',
      astSemanticStageTerm('target_projection'),
      astSemanticTextTerm(operation),
    )]),
  })),
);

export const TYPESCRIPT_TARGET_SURFACE_FACTS = facts;

export function resolveTypeScriptSurfaceToken(operation: TypeScriptSurfaceOperation): string {
  const fact = relationFirstOption(
    facts,
    (entry: TypeScriptSurfaceFact) => relationAll([
      relationEqual(entry.relation, 'surface_token'),
      relationEqual(entry.operation, operation),
    ]),
  );
  return relationOptionFold(
    fact,
    () => { throw Error(`Missing TypeScript target surface rule: '${operation}'`); },
    entry => entry.token,
  );
}

export const typeScriptTargetSurfaceInterface = (...args: Parameters<typeof createTargetProjectionPort>): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(createTargetProjectionPort(...args));
