/**
 * Upstream-owned AST semantic stage topology and executable membership judgment.
 * This contract deliberately has no semantic/relations dependency.
 */
import type { AstSemanticStage, AstSemanticStageContract } from './astSemanticStageInterface';

export type AstSemanticStageEdge = Readonly<{
  readonly from: AstSemanticStageContract['stage'] | 'source_syntax';
  readonly to: AstSemanticStageContract['stage'];
  readonly relation: 'observes' | 'maps' | 'resolves' | 'analyzes' | 'lowers' | 'projects';
}>;
export type AstSemanticStageGraph = Readonly<{
  readonly kind: 'ast_semantic_stage_graph';
  readonly edges: readonly AstSemanticStageEdge[];
}>;
export type AstSemanticStageMembershipHandlers<Result> = Readonly<{
  readonly onDeclared: (stage: AstSemanticStage) => Result;
  readonly onUndeclared: (stage: string) => Result;
}>;
export type AstSemanticStageMembership = Readonly<{
  readonly kind: 'ast_semantic_stage_declared';
  readonly stage: AstSemanticStage;
  readonly continueWith: <Result>(handlers: AstSemanticStageMembershipHandlers<Result>) => Result;
}> | Readonly<{
  readonly kind: 'ast_semantic_stage_undeclared';
  readonly stage: string;
  readonly continueWith: <Result>(handlers: AstSemanticStageMembershipHandlers<Result>) => Result;
}>;
export type AstSemanticStageTopologyAuthorityInterface = Readonly<{
  readonly kind: 'ast_semantic_stage_topology_authority';
  readonly graph: AstSemanticStageGraph;
  readonly classifyMembership: (stage: string) => AstSemanticStageMembership;
  readonly order: () => readonly AstSemanticStage[];
}>;

export const AST_SEMANTIC_STAGE_GRAPH: AstSemanticStageGraph = Object.freeze({
  kind: 'ast_semantic_stage_graph',
  edges: Object.freeze([
    Object.freeze({ from: 'source_syntax', to: 'scanner_evidence', relation: 'observes' }),
    Object.freeze({ from: 'scanner_evidence', to: 'upstream_mapping', relation: 'maps' }),
    Object.freeze({ from: 'upstream_mapping', to: 'resolver_graph', relation: 'resolves' }),
    Object.freeze({ from: 'resolver_graph', to: 'analysis', relation: 'analyzes' }),
    Object.freeze({ from: 'analysis', to: 'semantic_type_lowering', relation: 'lowers' }),
    Object.freeze({ from: 'semantic_type_lowering', to: 'target_projection', relation: 'projects' }),
  ]),
});

const declaredStage = (stage: AstSemanticStage): AstSemanticStageMembership => Object.freeze({
  kind: 'ast_semantic_stage_declared', stage,
  continueWith: <Result>(handlers: AstSemanticStageMembershipHandlers<Result>): Result => handlers.onDeclared(stage),
});
const undeclaredStage = (stage: string): AstSemanticStageMembership => Object.freeze({
  kind: 'ast_semantic_stage_undeclared', stage,
  continueWith: <Result>(handlers: AstSemanticStageMembershipHandlers<Result>): Result => handlers.onUndeclared(stage),
});
const classifyMembershipImplementation = (stage: string, index = 0): AstSemanticStageMembership => {
  const edge = AST_SEMANTIC_STAGE_GRAPH.edges[index];
  switch (edge) {
    case undefined: return undeclaredStage(stage);
    default: {
      switch (edge.to) {
        case stage: return declaredStage(stage as AstSemanticStage);
        default: return classifyMembershipImplementation(stage, index + 1);
      }
    }
  }
};
const stageOrderImplementation = (): readonly AstSemanticStage[] => Object.freeze(
  AST_SEMANTIC_STAGE_GRAPH.edges.map(edge => edge.to),
);

export const astSemanticStageTopologyAuthority: AstSemanticStageTopologyAuthorityInterface = Object.freeze({
  kind: 'ast_semantic_stage_topology_authority',
  graph: AST_SEMANTIC_STAGE_GRAPH,
  classifyMembership: classifyMembershipImplementation,
  order: stageOrderImplementation,
});
