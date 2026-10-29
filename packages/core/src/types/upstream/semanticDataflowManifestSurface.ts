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
import type { Sequence } from './collections';
import type { SemanticDataflowQueryPolicyContract, SemanticDataflowQueryPolicySelection } from './semanticDataflowQueryPolicy';

export interface SemanticDataflowManifestSurfaceInterface {
  readonly kind: 'semantic_dataflow_manifest_surface';
  readonly inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel) => Sequence<SemanticDataflowInput>;
  readonly judgmentsFromInputs: (inputs: Sequence<SemanticDataflowInput>) => Sequence<SemanticDataflowJudgment>;
  /** Materializes the selected judgments into closed policy contracts at the upstream boundary. */
  readonly queryPolicyContractsFromJudgments: (
    judgments: Sequence<SemanticDataflowJudgment>,
    selection: SemanticDataflowQueryPolicySelection,
  ) => readonly SemanticDataflowQueryPolicyContract[];
}

const judgmentsFromInputs = (
  inputs: Sequence<SemanticDataflowInput>,
  authority: SemanticDataflowReasoningAuthorityInterface,
): Sequence<SemanticDataflowJudgment> => inputs.kind === 'empty'
  ? { kind: 'empty' }
  : {
      kind: 'cons',
      head: authority.judge(inputs.head),
      tail: judgmentsFromInputs(inputs.tail, authority),
    };

/**
 * Canonical interface-first runtime operation. The previously exported factory
 * and forwarding functions duplicated this object's existing operation surface;
 * dependencies are fixed at this composition boundary and consumers call methods
 * on this typed object directly.
 */
export const semanticDataflowManifestSurface: SemanticDataflowManifestSurfaceInterface = Object.freeze({
  kind: 'semantic_dataflow_manifest_surface',
  inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel): Sequence<SemanticDataflowInput> =>
    semanticDataflowInputProducer.sourceModelSeeds(sourceModel),
  judgmentsFromInputs: (inputs: Sequence<SemanticDataflowInput>): Sequence<SemanticDataflowJudgment> =>
    judgmentsFromInputs(inputs, semanticDataflowReasoningAuthority),
  queryPolicyContractsFromJudgments: (
    judgments: Sequence<SemanticDataflowJudgment>,
    selection: SemanticDataflowQueryPolicySelection,
  ): readonly SemanticDataflowQueryPolicyContract[] => selection.materializeQueryPolicyContracts(judgments),
});

export interface ManifestDataflowSeedSurface {
  readonly dataflowInputs: Sequence<SemanticDataflowInput>;
  readonly dataflowJudgments: Sequence<SemanticDataflowJudgment>;
  readonly dataflowQueryPolicyContracts: readonly SemanticDataflowQueryPolicyContract[];
}
