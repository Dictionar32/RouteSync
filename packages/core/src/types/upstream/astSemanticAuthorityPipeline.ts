/**
 * Closed AST semantic authority pipeline.
 *
 * This is the highest interface above individual stage ports.  A compiler
 * consumer receives exactly one contract spanning source evidence, upstream
 * mapping, resolver graph, analysis, semantic type lowering, and target
 * projection.  Stage interfaces remain the transport representation; this
 * interface is the semantic authority boundary.
 */
import type { AstSemanticPipeline, AstSemanticStage, AstSemanticStageFact } from './astSemanticStageInterface';
import { astSemanticInterface } from './astSemanticInterface';
import type { AstSemanticInterface } from './astSemanticInterface';
import { astSemanticInterfaceFacts, astSemanticInterfaceProofs, astSemanticPipelineInterfaces, type AstSemanticStageInterface } from './astSemanticStageInterfaceAlgebra';
import { astSemanticStageTopologyAuthority } from './astSemanticStageContract';
import { relationFirstOption, relationFold, relationOptionFold, relationRefine } from '../../semantic/relations/relationalSequence';
import { relationEqual, relationResolve } from '../../semantic/relations/semanticRelations';
import type { AstSemanticStageTransition } from './astSemanticStageTransition';
import { astSemanticStageTransitionAuthority } from './astSemanticStageTransition';

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
  /** Ordered semantic facts projected from each closed stage interface. */
  readonly facts: readonly AstSemanticStageFact[];
  readonly stageOrder: readonly AstSemanticStage[];
  readonly authority: 'ast_semantic_judgment';
  /**
   * Canonical semantic authority, not just strategy metadata. All closure,
   * proof verification, and projection operations cross this existing contract.
   * Consumers must not reconstruct a parallel reasoning executor.
   */
  readonly semanticAuthority: AstSemanticInterface;
  readonly closure: 'least_fixed_point';
  readonly rewriteEngine: 'semantic_rewrite_engine';
  readonly closed: true;
}>;

const requireStage = <Stage extends AstSemanticStage>(
  interfaces: readonly AstSemanticStageInterface[],
  stage: Stage,
): AstSemanticStageInterface & Readonly<{ readonly stage: Stage }> =>
  astSemanticStageTopologyAuthority.classifyMembership(stage).continueWith({
    onUndeclared: () => { throw Error(`AST semantic stage '${stage}' is not declared by the upstream stage graph.`); },
    onDeclared: () => relationOptionFold(
      relationFirstOption(interfaces, candidate => relationEqual(candidate.stage, stage)),
      () => { throw Error(`Missing AST semantic stage '${stage}'.`); },
      value => relationOptionFold(
        relationRefine(value, (candidate): candidate is AstSemanticStageInterface & Readonly<{ readonly stage: Stage }> => relationEqual(candidate.stage, stage)),
        () => { throw Error(`AST semantic stage '${stage}' resolved to an incompatible stage interface.`); },
        narrowed => narrowed,
      ),
    ),
  });




const requireTransition = (
  from: AstSemanticStageInterface,
  to: AstSemanticStageInterface,
): AstSemanticStageTransition => relationOptionFold(
  relationFirstOption(astSemanticInterfaceProofs(from), () => true),
  () => { throw Error(`Missing AST semantic proof from '${from.stage}'.`); },
  proof => astSemanticStageTransitionAuthority.continueWith(
    from.stage,
    to.stage,
    from.judgment.contract,
    proof,
    {
      onTransition: value => value,
      onRejected: rejection => { throw Error(`Invalid AST semantic transition '${from.stage}' -> '${to.stage}' (${rejection.reason}).`); },
    },
  ),
);

const pipelineFacts = (interfaces: readonly AstSemanticStageInterface[]): readonly AstSemanticStageFact[] =>
  Object.freeze(relationFold(
    interfaces,
    [] as readonly AstSemanticStageFact[],
    (facts, stageInterface) => [...facts, ...astSemanticInterfaceFacts(stageInterface)],
  ));

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
): AstSemanticAuthorityPipeline => {
  const interfaces = astSemanticPipelineInterfaces(pipeline);
  const scanner = requireStage(interfaces, 'scanner_evidence');
  const mapping = requireStage(interfaces, 'upstream_mapping');
  const resolver = requireStage(interfaces, 'resolver_graph');
  const analysis = requireStage(interfaces, 'analysis');
  const lowering = requireStage(interfaces, 'semantic_type_lowering');
  const target = requireStage(interfaces, 'target_projection');
  return Object.freeze({
    kind: 'ast_semantic_authority_pipeline',
    scanner,
    mapping,
    resolver,
    analysis,
    lowering,
    target,
    transitions: pipelineTransitions(scanner, mapping, resolver, analysis, lowering, target),
    facts: pipelineFacts(interfaces),
    stageOrder: astSemanticStageTopologyAuthority.order(),
    authority: 'ast_semantic_judgment',
    semanticAuthority: astSemanticInterface,
    closure: 'least_fixed_point',
    rewriteEngine: 'semantic_rewrite_engine',
    closed: true,
  });
};

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
  facts: pipelineFacts([scanner, mapping, resolver, analysis, lowering, target]),
  stageOrder: astSemanticStageTopologyAuthority.order(),
  authority: 'ast_semantic_judgment',
  semanticAuthority: astSemanticInterface,
  closure: 'least_fixed_point',
  rewriteEngine: 'semantic_rewrite_engine',
  closed: true,
});
