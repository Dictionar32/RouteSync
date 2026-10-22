/**
 * Canonical manifest-level dataflow seed surface.
 *
 * Producer and reasoning authority are injected through upstream interfaces;
 * this surface coordinates contracts and does not own semantic classification.
 */
import type { SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowReasoningAuthorityInterface } from './semanticDataflow';
import { semanticDataflowReasoningAuthority } from './semanticDataflowAuthority';
import { semanticDataflowInputProducer, type SemanticDataflowSeedProducerInterface } from './semanticDataflowInputFactory';
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { Sequence } from './collections';
import { materializeSemanticDataflowQueryPolicy, type SemanticDataflowQueryPolicyContract, type SemanticDataflowQueryPolicyIntent } from './semanticDataflowQueryPolicy';

export interface SemanticDataflowManifestSurfaceInterface {
  readonly kind: 'semantic_dataflow_manifest_surface';
  readonly inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel) => Sequence<SemanticDataflowInput>;
  readonly judgmentsFromInputs: (inputs: Sequence<SemanticDataflowInput>) => Sequence<SemanticDataflowJudgment>;
  /** Materializes the selected judgments into closed policy contracts at the upstream boundary. */
  readonly queryPolicyContractsFromJudgments: (
    judgments: Sequence<SemanticDataflowJudgment>,
    intent: SemanticDataflowQueryPolicyIntent | undefined,
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

export const createSemanticDataflowManifestSurface = (
  producer: SemanticDataflowSeedProducerInterface,
  authority: SemanticDataflowReasoningAuthorityInterface,
): SemanticDataflowManifestSurfaceInterface => Object.freeze({
  kind: 'semantic_dataflow_manifest_surface',
  inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel) => producer.sourceModelSeeds(sourceModel),
  judgmentsFromInputs: (inputs: Sequence<SemanticDataflowInput>) => judgmentsFromInputs(inputs, authority),
  queryPolicyContractsFromJudgments: (judgments: Sequence<SemanticDataflowJudgment>, intent: SemanticDataflowQueryPolicyIntent | undefined) => intent === undefined
    ? Object.freeze([])
    : Object.freeze((function materializeAll(items: Sequence<SemanticDataflowJudgment>, output: readonly SemanticDataflowQueryPolicyContract[] = []): readonly SemanticDataflowQueryPolicyContract[] {
        return items.kind === 'empty'
          ? output
          : materializeAll(items.tail, [...output, materializeSemanticDataflowQueryPolicy(items.head, intent)]);
      })(judgments)),
});

export const semanticDataflowManifestSurface = createSemanticDataflowManifestSurface(
  semanticDataflowInputProducer,
  semanticDataflowReasoningAuthority,
);

export const semanticDataflowInputsFromSourceModel = (
  sourceModel: CompleteLaravelSourceModel,
): Sequence<SemanticDataflowInput> => semanticDataflowManifestSurface.inputsFromSourceModel(sourceModel);

/** Upstream-owned handoff; judgments are produced through the injected authority interface. */
export const semanticDataflowJudgmentsFromInputs = (
  inputs: Sequence<SemanticDataflowInput>,
): Sequence<SemanticDataflowJudgment> => semanticDataflowManifestSurface.judgmentsFromInputs(inputs);

export interface ManifestDataflowSeedSurface {
  readonly dataflowInputs: Sequence<SemanticDataflowInput>;
  readonly dataflowJudgments: Sequence<SemanticDataflowJudgment>;
  readonly dataflowQueryPolicyContracts: readonly SemanticDataflowQueryPolicyContract[];
}
