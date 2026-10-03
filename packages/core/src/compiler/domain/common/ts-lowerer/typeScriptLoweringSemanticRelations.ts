/** Declarative semantic dispatch for ResolvedSemanticType -> TypeScript lowering operation. */
import type { ResolvedSemanticTypeKind } from '../ResolvedSemanticType';
import { astAnalysisTypeJudgment, type AstAnalysisFact, type AstAnalysisJudgment, type AstAnalysisTypeJudgment } from '../../../analysis/astAnalysisInterface';
type SemanticTypeAnalysisFact = { readonly kind: 'semantic_type'; readonly value: ResolvedSemanticTypeKind };
import { astSemanticStageInterfaceOf, type AstSemanticStageInterface } from '../../../../types/upstream/astSemanticStageInterfaceAlgebra';
import { relationFirstOption, relationOptionFold, relationProject, relationResolve, relationRefine, relationCount, relationVariant } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual, relationGate } from '../../../../semantic/kernel/semanticRelations';
import { astSemanticTextTerm } from '../../../../types/upstream/astSemanticInterface';
import { createSemanticTypeLoweringPort, semanticTypeLoweringFact, type AstSemanticStagePort } from '../../../../types/upstream/astSemanticStageInterface';
import {
  solveSemanticRelations,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../../../scanner/lexer/routeAst/semanticRewriteEngine';

export type TypeScriptLoweringSemanticRelation =
  | 'resolved_type_kind'
  | 'typescript_lowering_operation';

export type TypeScriptLoweringOperation = ResolvedSemanticTypeKind;

export type TypeScriptLoweringLegality =
  | Readonly<{ readonly kind: 'legal_target_operation'; readonly source: ResolvedSemanticTypeKind; readonly operation: TypeScriptLoweringOperation }>
  | Readonly<{ readonly kind: 'illegal_target_operation'; readonly source: ResolvedSemanticTypeKind; readonly reason: 'uncovered_source_kind' }>;

export interface TypeScriptLoweringJudgment {
  readonly kind: 'typescript_lowering_judgment';
  readonly source: ResolvedSemanticTypeKind;
  readonly operation: TypeScriptLoweringOperation;
  readonly target: 'typescript_surface';
  readonly legality: TypeScriptLoweringLegality;
  readonly reasoning: 'declarative_relation_rewrite';
  readonly closed: true;
}

const entries: readonly ResolvedSemanticTypeKind[] = Object.freeze([
  'primitive', 'reference', 'optional', 'nullable', 'collection',
  'object', 'union', 'intersection', 'unknown',
]);

export const TYPESCRIPT_LOWERING_RULES:
  readonly SemanticRelationRewrite<TypeScriptLoweringSemanticRelation>[] = Object.freeze(
    relationProject(entries, (kind, index): SemanticRelationRewrite<TypeScriptLoweringSemanticRelation> => Object.freeze({
      id: `typescript-lowering-${kind}`,
      priority: relationCount(entries) - index,
      when: [{ relation: 'resolved_type_kind' as const, arguments: [kind] }],
      then: [{ relation: 'typescript_lowering_operation' as const, arguments: [kind, kind] }],
    })),
  );

const isTypeScriptLoweringOperation = (value: SemanticRelation<TypeScriptLoweringSemanticRelation>['arguments'][number]): value is TypeScriptLoweringOperation => relationAny([
  relationEqual(value, 'primitive'), relationEqual(value, 'reference'), relationEqual(value, 'optional'),
  relationEqual(value, 'nullable'), relationEqual(value, 'collection'), relationEqual(value, 'object'),
  relationEqual(value, 'union'), relationEqual(value, 'intersection'), relationEqual(value, 'unknown'),
]);

export const typeScriptLoweringPort = (kind: ResolvedSemanticTypeKind): AstSemanticStagePort => createSemanticTypeLoweringPort([
  semanticTypeLoweringFact('type_lowers', astSemanticTextTerm(kind), astSemanticTextTerm(kind)),
]);

export const resolveTypeScriptLoweringJudgment = (kind: ResolvedSemanticTypeKind): TypeScriptLoweringJudgment => {
  const solved = solveSemanticRelations<TypeScriptLoweringSemanticRelation>(
    [{ relation: 'resolved_type_kind', arguments: [kind] }],
    TYPESCRIPT_LOWERING_RULES,
  );
  const fact = relationFirstOption(solved, (entry: SemanticRelation<TypeScriptLoweringSemanticRelation>) => relationAll([relationEqual(entry.relation, 'typescript_lowering_operation'), relationEqual(entry.arguments[0], kind)]));
  const operation = relationOptionFold(fact, () => { throw Error(`No TypeScript lowering semantic rule for '${kind}'`); }, entry =>
    relationOptionFold(
      relationRefine(entry.arguments[1], isTypeScriptLoweringOperation),
      () => { throw Error(`Invalid TypeScript lowering witness for '${kind}'`); },
      value => value,
    ));
  return Object.freeze({
    kind: 'typescript_lowering_judgment',
    source: kind,
    operation,
    target: 'typescript_surface',
    legality: Object.freeze({ kind: 'legal_target_operation', source: kind, operation }),
    reasoning: 'declarative_relation_rewrite',
    closed: true,
  });
};

export const resolveTypeScriptLoweringFromAnalysis = (analysis: AstAnalysisJudgment | AstAnalysisTypeJudgment): TypeScriptLoweringJudgment => {
  const analysisFacts = relationOptionFold(
    relationVariant(analysis, 'ast_analysis_type_judgment'),
    () => relationOptionFold(relationVariant(analysis, 'ast_analysis_judgment'), () => [], value => value.facts),
    value => [value.fact],
  );
  const semanticType = relationOptionFold(
    relationFirstOption(analysisFacts, (fact: AstAnalysisFact): fact is SemanticTypeAnalysisFact => relationEqual(fact.kind, 'semantic_type')),
    () => { throw Error('Analysis judgment has no semantic type fact for TypeScript lowering.'); },
    fact => fact.value,
  );
  return resolveTypeScriptLoweringJudgment(semanticType);
};

export const resolveTypeScriptLoweringFromType = (kind: ResolvedSemanticTypeKind): TypeScriptLoweringJudgment =>
  resolveTypeScriptLoweringFromAnalysis(astAnalysisTypeJudgment(kind));

export function resolveTypeScriptLoweringOperation(
  kind: ResolvedSemanticTypeKind,
): TypeScriptLoweringOperation {
  return resolveTypeScriptLoweringFromType(kind).operation;
}

export const typeScriptLoweringInterface = (...args: Parameters<typeof typeScriptLoweringPort>): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(typeScriptLoweringPort(...args));
