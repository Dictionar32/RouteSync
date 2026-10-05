/**
 * RouteSync cross-stage semantic contract vocabulary.
 *
 * The contract is deliberately separate from implementation ports. It describes
 * the legal direction of semantic evidence and the authority that may derive it.
 */
import type { AstSemanticStage, AstSemanticStageContract } from './astSemanticStageInterface';
import { relationEqual } from '../../semantic/foundation/semanticRelations';
import { relationResolve } from '../../semantic/foundation/relationalSequence';

export type AstSemanticStageEdge = Readonly<{
  readonly from: AstSemanticStageContract['stage'] | 'source_syntax';
  readonly to: AstSemanticStageContract['stage'];
  readonly relation: 'observes' | 'maps' | 'resolves' | 'analyzes' | 'lowers' | 'projects';
}>;

export type AstSemanticStageGraph = Readonly<{
  readonly kind: 'ast_semantic_stage_graph';
  readonly edges: readonly AstSemanticStageEdge[];
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

export const stageGraphContains = (stage: AstSemanticStage, index = 0): boolean => relationResolve(index >= AST_SEMANTIC_STAGE_GRAPH.edges.length, () => false, () => relationResolve(relationEqual(AST_SEMANTIC_STAGE_GRAPH.edges[index].to, stage), () => true, () => stageGraphContains(stage, index + 1)));
