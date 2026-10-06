/**
 * Closed analysis semantic authority.
 *
 * Analysis consumes the resolver graph as a typed premise and emits a closed
 * relation algebra. Dataflow is represented by a finite vocabulary rather than
 * free subject/predicate strings.
 */
import type { AstSemanticPreservationRelation } from '../../types/upstream/astSemanticStageInterface';
import type { AstSemanticStageProof } from '../../types/upstream/astSemanticStageProof';
import type { ResolverGraphSemanticJudgment } from '../scanner/resolvers/resolverGraphSemanticInterface';
import type { ResolvedSemanticTypeKind } from '../domain/common/ResolvedSemanticType';
import type { DataFlowInterface } from '../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowInput, SemanticDataflowIdentity, SemanticDataflowJudgment, SemanticDataflowFact } from '../../types/upstream/semanticDataflow';

export type AstAnalysisFact =
  | { readonly kind: 'cfg_reachable'; readonly blockId: number }
  | { readonly kind: 'dominates'; readonly dominator: number; readonly block: number }
  | { readonly kind: 'ssa_definition'; readonly variable: number; readonly block: number }
  | { readonly kind: 'ssa_phi_required'; readonly variable: number; readonly block: number }
  /**
   * Dataflow facts remain the canonical upstream ADT. Analysis carries the
   * exact fact rather than re-encoding identity as primitive source/target
   * numbers.
   */
  | { readonly kind: 'dataflow_fact'; readonly value: SemanticDataflowFact }
  | { readonly kind: 'resolver_domain'; readonly value: ResolverGraphSemanticJudgment['domain']['result'] }
  | { readonly kind: 'resolver_security'; readonly value: ResolverGraphSemanticJudgment['security']['security'] }
  | { readonly kind: 'resolver_crud'; readonly value: ResolverGraphSemanticJudgment['crudRole'] }
  | { readonly kind: 'mapping_refinement'; readonly value: ResolverGraphSemanticJudgment['mapping'] }
  | { readonly kind: 'semantic_type'; readonly value: ResolvedSemanticTypeKind }
  | { readonly kind: 'dataflow_closure'; readonly value: readonly SemanticDataflowFact[] };

export type AstAnalysisDerivation = Readonly<{
  readonly kind: 'ast_analysis_derivation';
  readonly rule: string;
  readonly premises: readonly AstAnalysisFact[];
  readonly conclusion: AstAnalysisFact;
}>;

export type AstAnalysisJudgment = Readonly<{
  readonly kind: 'ast_analysis_judgment';
  readonly resolver: ResolverGraphSemanticJudgment;
  readonly dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>;
  readonly facts: readonly AstAnalysisFact[];
  readonly derivations: readonly AstAnalysisDerivation[];
  readonly preservation: readonly AstSemanticPreservationRelation[];
  readonly proof: AstSemanticStageProof;
  readonly closure: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'ast_analysis_judgment';
  readonly closed: true;
}>;

export type AstAnalysisTypeJudgment = Readonly<{
  readonly kind: 'ast_analysis_type_judgment';
  readonly semanticType: ResolvedSemanticTypeKind;
  readonly fact: AstAnalysisFact & { readonly kind: 'semantic_type' };
  readonly closure: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'ast_analysis_type_judgment';
  readonly closed: true;
}>;

export const astAnalysisTypeJudgment = (semanticType: ResolvedSemanticTypeKind): AstAnalysisTypeJudgment => Object.freeze({
  kind: 'ast_analysis_type_judgment',
  semanticType,
  fact: Object.freeze({ kind: 'semantic_type', value: semanticType }),
  closure: 'least_fixed_point',
  reasoning: 'declarative_relation_rewrite_fixed_point',
  authority: 'ast_analysis_type_judgment',
  closed: true,
});

export type AstAnalysisInput = Readonly<{
  readonly kind: 'ast_analysis_input';
  readonly resolver: ResolverGraphSemanticJudgment;
  readonly semanticType: ResolvedSemanticTypeKind;
  readonly dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>;
  readonly proof: AstSemanticStageProof;
}>;

export const astAnalysisJudgment = (input: AstAnalysisInput): AstAnalysisJudgment => {
  const resolver = input.resolver;
  const facts: readonly AstAnalysisFact[] = Object.freeze([
    Object.freeze({ kind: 'resolver_domain' as const, value: resolver.domain.result }),
    Object.freeze({ kind: 'resolver_security' as const, value: resolver.security.security }),
    Object.freeze({ kind: 'resolver_crud' as const, value: resolver.crudRole }),
    Object.freeze({ kind: 'mapping_refinement' as const, value: resolver.mapping }),
    Object.freeze({ kind: 'semantic_type' as const, value: input.semanticType }),
    ...input.dataflow.state.closure.map(fact => Object.freeze({ kind: 'dataflow_fact' as const, value: fact })),
    Object.freeze({ kind: 'dataflow_closure' as const, value: input.dataflow.state.closure }),
  ]);
  return Object.freeze({
    kind: 'ast_analysis_judgment',
    resolver,
    dataflow: input.dataflow,
    facts,
    derivations: Object.freeze([]),
    preservation: Object.freeze(input.proof.preservation),
    proof: input.proof,
    closure: 'least_fixed_point',
    reasoning: 'declarative_relation_rewrite_fixed_point',
    authority: 'ast_analysis_judgment',
    closed: true,
  });
};

export type AstAnalysisInterface = Readonly<{
  readonly kind: 'ast_analysis_interface';
  readonly authority: 'ast_analysis_judgment';
  readonly judgment: AstAnalysisJudgment;
  /** Canonical upstream dataflow interface; no re-encoded source/target payload. */
  readonly dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>;
  readonly closed: true;
}>;

export const astAnalysisInterface = (judgment: AstAnalysisJudgment): AstAnalysisInterface => Object.freeze({
  kind: 'ast_analysis_interface', authority: 'ast_analysis_judgment', judgment,
  dataflow: judgment.dataflow,
  closed: true,
});
