/**
 * Closed AST semantic interface algebra.
 *
 * The stage port is the transport boundary; this algebra is the semantic
 * interface exposed to compiler clients. It makes stage input/output,
 * judgment authority, facts and refinement obligations one closed contract.
 */
import type {
  AstSemanticStage,
  AstSemanticStageContract,
  AstSemanticStageJudgment,
  AstSemanticStagePort,
  AstSemanticPipeline,
  AstSemanticStageFact,
} from './astSemanticStageInterface';
import type { AstSemanticStageProof } from './astSemanticStageProof';
import { relationEqual, relationResolve } from '../../semantic/kernel/semanticRelations';
import { relationGate, relationNone, relationSome, type RelationOption } from '../../semantic/kernel/relationalSequence';

export type AstSemanticStageInterface = Readonly<{
  readonly kind: 'ast_semantic_stage_interface';
  readonly stage: AstSemanticStage;
  readonly input: AstSemanticStageContract['input'];
  readonly output: AstSemanticStageContract['output'];
  readonly authority: 'ast_semantic_judgment';
  readonly judgment: AstSemanticStageJudgment;
  readonly facts: readonly AstSemanticStageFact[];
  readonly proofs: readonly AstSemanticStageProof[];
  readonly closed: true;
}>;

export const astSemanticStageInterface = (judgment: AstSemanticStageJudgment): AstSemanticStageInterface => Object.freeze({
  kind: 'ast_semantic_stage_interface',
  stage: judgment.stage,
  input: judgment.contract.input,
  output: judgment.contract.output,
  authority: 'ast_semantic_judgment',
  judgment,
  facts: Object.freeze(judgment.facts.items),
  proofs: Object.freeze(judgment.proofObligations),
  closed: true,
});

export const astSemanticStageInterfaceOf = (port: AstSemanticStagePort): AstSemanticStageInterface =>
  astSemanticStageInterface(port.judgment);

const stageInterfaceAt = (
  ports: readonly AstSemanticStagePort[],
  stage: AstSemanticStage,
  index = 0,
): RelationOption<AstSemanticStageInterface> => relationGate(
  relationEqual(index, ports.length),
  () => relationNone(),
  () => relationResolve(
    relationEqual(ports[index].stage, stage),
    () => relationSome(astSemanticStageInterfaceOf(ports[index])),
    () => stageInterfaceAt(ports, stage, index + 1),
  ),
);

export const astSemanticStageInterfaceAt = (
  pipeline: AstSemanticPipeline,
  stage: AstSemanticStage,
): RelationOption<AstSemanticStageInterface> => stageInterfaceAt(pipeline.ports, stage);

export const astSemanticPipelineInterfaces = (
  pipeline: AstSemanticPipeline,
  index = 0,
  output: readonly AstSemanticStageInterface[] = [],
): readonly AstSemanticStageInterface[] => relationGate(
  relationEqual(index, pipeline.ports.length),
  () => Object.freeze(output),
  () => astSemanticPipelineInterfaces(
    pipeline,
    index + 1,
    [...output, astSemanticStageInterfaceOf(pipeline.ports[index])],
  ),
);

export const astSemanticInterfaceFacts = (value: AstSemanticStageInterface): readonly AstSemanticStageFact[] => value.facts;
export const astSemanticInterfaceProofs = (value: AstSemanticStageInterface): readonly AstSemanticStageProof[] => value.proofs;
