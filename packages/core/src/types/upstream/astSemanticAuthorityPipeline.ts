/**
 * Closed AST semantic authority pipeline.
 *
 * This is the highest interface above individual stage ports.  A compiler
 * consumer receives exactly one contract spanning source evidence, upstream
 * mapping, resolver graph, analysis, semantic type lowering, and target
 * projection.  Stage interfaces remain the transport representation; this
 * interface is the semantic authority boundary.
 */
import type { AstSemanticPipeline, AstSemanticStage } from './astSemanticStageInterface';
import type { AstSemanticStageInterface } from './astSemanticStageInterfaceAlgebra';
import { astSemanticStageInterfaceAt } from './astSemanticStageInterfaceAlgebra';
import { relationFirstOption, relationOptionFold } from '../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import type { AstSemanticStageTransition } from './astSemanticStageTransition';
import { astSemanticStageTransition } from './astSemanticStageTransition';

export type ScannerSemanticStageInterface = AstSemanticStageInterface & Readonly<{ readonly stage: 'scanner_evidence' }> ;
export type UpstreamMappingSemanticStageInterface = AstSemanticStageInterface & Readonly<{ readonly stage: 'upstream_mapping' }> ;
export type ResolverGraphSemanticStageInterface = AstSemanticStageInterface & Readonly<{ readonly stage: 'resolver_graph' }> ;
export type AnalysisSemanticStageInterface = AstSemanticStageInterface & Readonly<{ readonly stage: 'analysis' }> ;
export type SemanticTypeLoweringStageInterface = AstSemanticStageInterface & Readonly<{ readonly stage: 'semantic_type_lowering' }> ;
export type TargetProjectionSemanticStageInterface = AstSemanticStageInterface & Readonly<{ readonly stage: 'target_projection' }> ;

export type AstSemanticAuthorityPipeline = Readonly<{
  readonly kind: 'ast_semantic_authority_pipeline';
  readonly scanner: ScannerSemanticStageInterface;
  readonly mapping: UpstreamMappingSemanticStageInterface;
  readonly resolver: ResolverGraphSemanticStageInterface;
  readonly analysis: AnalysisSemanticStageInterface;
  readonly lowering: SemanticTypeLoweringStageInterface;
  readonly target: TargetProjectionSemanticStageInterface;
  readonly transitions: readonly AstSemanticStageTransition[];
  readonly stageOrder: readonly AstSemanticStage[];
  readonly authority: 'ast_semantic_judgment';
  readonly closure: 'least_fixed_point';
  readonly rewriteEngine: 'semantic_rewrite_engine';
  readonly closed: true;
}>;

const requireStage = (pipeline: AstSemanticPipeline, stage: AstSemanticStage): AstSemanticStageInterface =>
  relationOptionFold(
    astSemanticStageInterfaceAt(pipeline, stage),
    () => { throw Error(`Missing AST semantic stage '${stage}'.`); },
    value => value,
  );


const requireTransition = (
  from: AstSemanticStageInterface,
  to: AstSemanticStageInterface,
): AstSemanticStageTransition => relationOptionFold(
  relationFirstOption(from.proofs, () => true),
  () => { throw Error(`Missing AST semantic proof from '${from.stage}'.`); },
  proof => relationOptionFold(
    astSemanticStageTransition(from.stage, to.stage, from.judgment.contract, proof),
    () => { throw Error(`Invalid AST semantic transition '${from.stage}' -> '${to.stage}'.`); },
    value => value,
  ),
);

const pipelineTransitions = (
  scanner: ScannerSemanticStageInterface,
  mapping: UpstreamMappingSemanticStageInterface,
  resolver: ResolverGraphSemanticStageInterface,
  analysis: AnalysisSemanticStageInterface,
  lowering: SemanticTypeLoweringStageInterface,
  target: TargetProjectionSemanticStageInterface,
): readonly AstSemanticStageTransition[] => Object.freeze([
  requireTransition(scanner, mapping),
  requireTransition(mapping, resolver),
  requireTransition(resolver, analysis),
  requireTransition(analysis, lowering),
  requireTransition(lowering, target),
]);
export const astSemanticAuthorityPipeline = (
  pipeline: AstSemanticPipeline,
): AstSemanticAuthorityPipeline => Object.freeze({
  kind: 'ast_semantic_authority_pipeline',
  scanner: requireStage(pipeline, 'scanner_evidence'),
  mapping: requireStage(pipeline, 'upstream_mapping'),
  resolver: requireStage(pipeline, 'resolver_graph'),
  analysis: requireStage(pipeline, 'analysis'),
  lowering: requireStage(pipeline, 'semantic_type_lowering'),
  target: requireStage(pipeline, 'target_projection'),
  transitions: pipelineTransitions(
    requireStage(pipeline, 'scanner_evidence'),
    requireStage(pipeline, 'upstream_mapping'),
    requireStage(pipeline, 'resolver_graph'),
    requireStage(pipeline, 'analysis'),
    requireStage(pipeline, 'semantic_type_lowering'),
    requireStage(pipeline, 'target_projection'),
  ),
  stageOrder: Object.freeze([
    'scanner_evidence',
    'upstream_mapping',
    'resolver_graph',
    'analysis',
    'semantic_type_lowering',
    'target_projection',
  ]),
  authority: 'ast_semantic_judgment',
  closure: 'least_fixed_point',
  rewriteEngine: 'semantic_rewrite_engine',
  closed: true,
});

export const astSemanticAuthorityStage = (
  pipeline: AstSemanticAuthorityPipeline,
  stage: AstSemanticStage,
): AstSemanticStageInterface =>
  relationOptionFold(
    relationFirstOption(
      [pipeline.scanner, pipeline.mapping, pipeline.resolver, pipeline.analysis, pipeline.lowering, pipeline.target],
      candidate => relationEqual(candidate.stage, stage),
    ),
    () => { throw Error(`Unknown AST semantic stage '${stage}'.`); },
    value => value,
  );

export const createAstSemanticAuthorityPipeline = (
  scanner: ScannerSemanticStageInterface,
  mapping: UpstreamMappingSemanticStageInterface,
  resolver: ResolverGraphSemanticStageInterface,
  analysis: AnalysisSemanticStageInterface,
  lowering: SemanticTypeLoweringStageInterface,
  target: TargetProjectionSemanticStageInterface,
): AstSemanticAuthorityPipeline => Object.freeze({
  kind: 'ast_semantic_authority_pipeline',
  scanner,
  mapping,
  resolver,
  analysis,
  lowering,
  target,
  transitions: pipelineTransitions(scanner, mapping, resolver, analysis, lowering, target),
  stageOrder: Object.freeze([
    'scanner_evidence',
    'upstream_mapping',
    'resolver_graph',
    'analysis',
    'semantic_type_lowering',
    'target_projection',
  ]),
  authority: 'ast_semantic_judgment',
  closure: 'least_fixed_point',
  rewriteEngine: 'semantic_rewrite_engine',
  closed: true,
});
