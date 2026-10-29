/**
 * Canonical manifest-level dataflow seed surface.
 *
 * Producer and reasoning authority are injected through upstream interfaces;
 * this surface coordinates contracts and does not own semantic classification.
 */
import type { SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowReasoningAuthorityInterface } from './semanticDataflow';
import { semanticDataflowReasoningAuthority } from './semanticDataflowAuthority';
import { semanticDataflowInputProducer } from './semanticDataflowInputFactory';
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { SemanticDataflowQueryPolicyContract, SemanticDataflowQueryPolicySelection } from './semanticDataflowQueryPolicy';

export interface SemanticDataflowManifestSurfaceInterface {
  readonly kind: 'semantic_dataflow_manifest_surface';
  readonly inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel) => readonly SemanticDataflowInput[];
  readonly judgmentsFromInputs: (inputs: readonly SemanticDataflowInput[]) => readonly SemanticDataflowJudgment[];
  /** Materializes the selected judgments into closed policy contracts at the upstream boundary. */
  readonly queryPolicyContractsFromJudgments: (
    judgments: readonly SemanticDataflowJudgment[],
    selection: SemanticDataflowQueryPolicySelection,
  ) => readonly SemanticDataflowQueryPolicyContract[];
}

const judgmentsFromInputs = (
  inputs: readonly SemanticDataflowInput[],
  authority: SemanticDataflowReasoningAuthorityInterface,
): readonly SemanticDataflowJudgment[] => Object.freeze(inputs.map(input => authority.judge(input)));

/**
 * Canonical interface-first runtime operation. The previously exported factory
 * and forwarding functions duplicated this object's existing operation surface;
 * dependencies are fixed at this composition boundary and consumers call methods
 * on this typed object directly.
 */
export const semanticDataflowManifestSurface: SemanticDataflowManifestSurfaceInterface = Object.freeze({
  kind: 'semantic_dataflow_manifest_surface',
  inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel): readonly SemanticDataflowInput[] =>
    semanticDataflowInputProducer.sourceModelSeeds(sourceModel),
  judgmentsFromInputs: (inputs: readonly SemanticDataflowInput[]): readonly SemanticDataflowJudgment[] =>
    judgmentsFromInputs(inputs, semanticDataflowReasoningAuthority),
  queryPolicyContractsFromJudgments: (
    judgments: readonly SemanticDataflowJudgment[],
    selection: SemanticDataflowQueryPolicySelection,
  ): readonly SemanticDataflowQueryPolicyContract[] => selection.materializeQueryPolicyContracts(judgments),
});

export interface ManifestDataflowSeedSurface {
  readonly dataflowInputs: readonly SemanticDataflowInput[];
  readonly dataflowJudgments: readonly SemanticDataflowJudgment[];
  readonly dataflowQueryPolicyContracts: readonly SemanticDataflowQueryPolicyContract[];
}
