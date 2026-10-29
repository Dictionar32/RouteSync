import {
  LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT,
  LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT,
  type LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface,
  type LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness,
  type LaravelControllerInvocationSemanticJudgmentInventoryInput,
  type LaravelControllerInvocationSemanticJudgmentInventoryRejection,
  type LaravelControllerInvocationSemanticJudgmentInventoryResult,
  type LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
  type LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface,
  type LaravelControllerInvocationInventoryProjectBindingJudgment,
  type LaravelControllerInvocationInventoryCompletenessJudgment,
  type LaravelControllerInvocationInventorySourceIdentityJudgment,
  type LaravelControllerInvocationInventoryCorrespondenceJudgment,
  type LaravelControllerInvocationJudgmentMatchCardinality,
  type LaravelControllerInvocationJudgmentMatchCardinalityHandlers,
  type LaravelControllerSourceInventoryCompletenessWitness,
  type LaravelControllerSourceInventoryInterface,
} from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import { sourceFileInventoryFactory, type SourceFile, type SourceFileInventory } from './names';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { ManifestBuilderJudgment } from './manifestBuilderInterface';

type InventoryRejections = readonly [
  LaravelControllerInvocationSemanticJudgmentInventoryRejection,
  ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[],
];

const inventoryRejections = (
  first: LaravelControllerInvocationSemanticJudgmentInventoryRejection,
  rest: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[] = [],
): InventoryRejections => Object.freeze([first, ...rest]);
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';

type CorrespondenceRejectionInventory =
  | Readonly<{
      readonly kind: 'correspondence_rejection_inventory_empty';
      readonly include: (rejection: LaravelControllerInvocationSemanticJudgmentInventoryRejection) => Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_nonempty' }>;
      readonly closeCorrespondence: (
        sourceInventory: LaravelControllerSourceInventoryInterface,
        judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
        missingSources: SourceFileInventory,
        multiplyJudgedSources: SourceFileInventory,
        orphanJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
      ) => LaravelControllerInvocationInventoryCorrespondenceJudgment;
    }>
  | Readonly<{
      readonly kind: 'correspondence_rejection_inventory_nonempty';
      readonly rejections: InventoryRejections;
      readonly include: (rejection: LaravelControllerInvocationSemanticJudgmentInventoryRejection) => Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_nonempty' }>;
      readonly closeCorrespondence: (
        sourceInventory: LaravelControllerSourceInventoryInterface,
        judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
        missingSources: SourceFileInventory,
        multiplyJudgedSources: SourceFileInventory,
        orphanJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
      ) => LaravelControllerInvocationInventoryCorrespondenceJudgment;
    }>;

const correspondenceRejectionInventory: Readonly<{
  readonly empty: () => Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_empty' }>;
}> = Object.freeze({
  empty: (): Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_empty' }> => {
    let inventory: Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_empty' }>;
    inventory = Object.freeze({
      kind: 'correspondence_rejection_inventory_empty',
      include: (rejection: LaravelControllerInvocationSemanticJudgmentInventoryRejection) => nonemptyCorrespondenceRejections(rejection),
      closeCorrespondence: (sourceInventory, judgments) => Object.freeze({
        kind: 'judgment_correspondence_closed',
        sourceInventory,
        judgments,
        rejections: Object.freeze([]),
      }),
    });
    return inventory;
  },
});

const nonemptyCorrespondenceRejections = (
  first: LaravelControllerInvocationSemanticJudgmentInventoryRejection,
  rest: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[] = [],
): Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_nonempty' }> => {
  let inventory: Extract<CorrespondenceRejectionInventory, { readonly kind: 'correspondence_rejection_inventory_nonempty' }>;
  const rejections = inventoryRejections(first, rest);
  inventory = Object.freeze({
    kind: 'correspondence_rejection_inventory_nonempty',
    rejections,
    include: (rejection: LaravelControllerInvocationSemanticJudgmentInventoryRejection) => nonemptyCorrespondenceRejections(first, [...rest, rejection]),
    closeCorrespondence: (_sourceInventory, _judgments, missingSources, multiplyJudgedSources, orphanJudgments) => Object.freeze({
      kind: 'judgment_correspondence_rejected',
      missingSources,
      multiplyJudgedSources,
      orphanJudgments,
      rejections,
    }),
  });
  return inventory;
};

const includeCorrespondenceRejections = (
  inventory: CorrespondenceRejectionInventory,
  rejections: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[],
  position = 0,
): CorrespondenceRejectionInventory => {
  const rejection = rejections[position];
  return rejection === undefined
    ? inventory
    : includeCorrespondenceRejections(inventory.include(rejection), rejections, position + 1);
};

const duplicateSourceRejections = (
  sources: SourceFileInventory,
): readonly Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>[] => sources.continueWith({
  onEmpty: () => Object.freeze([]),
  onSource: (sourceFile, remaining) => Object.freeze([
    Object.freeze({ kind: 'controller_source_inventory_contains_duplicate_source' as const, sourceFile }),
    ...duplicateSourceRejections(remaining),
  ]),
});

const missingInvocationJudgmentRejections = (
  sources: SourceFileInventory,
): readonly Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_has_no_invocation_judgment' }>[] => sources.continueWith({
  onEmpty: () => Object.freeze([]),
  onSource: (sourceFile, remaining) => Object.freeze([
    Object.freeze({ kind: 'controller_source_has_no_invocation_judgment' as const, sourceFile }),
    ...missingInvocationJudgmentRejections(remaining),
  ]),
});

const multipleInvocationJudgmentRejections = (
  sources: SourceFileInventory,
): readonly Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_has_multiple_invocation_judgments' }>[] => sources.continueWith({
  onEmpty: () => Object.freeze([]),
  onSource: (sourceFile, remaining) => Object.freeze([
    Object.freeze({ kind: 'controller_source_has_multiple_invocation_judgments' as const, sourceFile }),
    ...multipleInvocationJudgmentRejections(remaining),
  ]),
});

const noInvocationJudgmentMatchesSource = (): LaravelControllerInvocationJudgmentMatchCardinality => {
  let cardinality: Extract<LaravelControllerInvocationJudgmentMatchCardinality, { readonly kind: 'no_invocation_judgment_matches_source' }>;
  cardinality = Object.freeze({
    kind: 'no_invocation_judgment_matches_source',
    includeRelation: relation => relation.continueWith({
      onSame: () => oneInvocationJudgmentMatchesSource(),
      onDifferent: () => cardinality,
    }),
    continueWith: <Result>(handlers: LaravelControllerInvocationJudgmentMatchCardinalityHandlers<Result>): Result => handlers.onNoMatch(cardinality),
  });
  return cardinality;
};

const oneInvocationJudgmentMatchesSource = (): LaravelControllerInvocationJudgmentMatchCardinality => {
  let cardinality: Extract<LaravelControllerInvocationJudgmentMatchCardinality, { readonly kind: 'one_invocation_judgment_matches_source' }>;
  cardinality = Object.freeze({
    kind: 'one_invocation_judgment_matches_source',
    includeRelation: relation => relation.continueWith({
      onSame: () => multipleInvocationJudgmentsMatchSource(),
      onDifferent: () => cardinality,
    }),
    continueWith: <Result>(handlers: LaravelControllerInvocationJudgmentMatchCardinalityHandlers<Result>): Result => handlers.onOneMatch(cardinality),
  });
  return cardinality;
};

const multipleInvocationJudgmentsMatchSource = (): LaravelControllerInvocationJudgmentMatchCardinality => {
  let cardinality: Extract<LaravelControllerInvocationJudgmentMatchCardinality, { readonly kind: 'multiple_invocation_judgments_match_source' }>;
  cardinality = Object.freeze({
    kind: 'multiple_invocation_judgments_match_source',
    includeRelation: () => cardinality,
    continueWith: <Result>(handlers: LaravelControllerInvocationJudgmentMatchCardinalityHandlers<Result>): Result => handlers.onMultipleMatches(cardinality),
  });
  return cardinality;
};

const reasoning: LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_inventory_reasoning',
  contract: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT,
  judgeProjectBinding: (
    inventoryProject: SourceProjectIdentity,
    witnessProject: SourceProjectIdentity,
  ): LaravelControllerInvocationInventoryProjectBindingJudgment => {
    const relation = laravelSourceIdentitySemantics.relateSourceProjects(inventoryProject, witnessProject);
    return relation.continueWith({
      onSame: sameRelation => Object.freeze({ kind: 'project_binding_accepted', relation: sameRelation, rejections: Object.freeze([]) }),
      onDifferent: differentRelation => Object.freeze({
        kind: 'project_binding_rejected',
        relation: differentRelation,
        rejections: inventoryRejections(Object.freeze({
          kind: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.projectBinding.rejectionKind,
          inventoryProject,
          witnessProject,
        } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_project_binding_mismatch' }>)),
      }),
    });
  },
  judgeCompletenessWitness: (
    witness: LaravelControllerSourceInventoryCompletenessWitness,
  ): LaravelControllerInvocationInventoryCompletenessJudgment => {
    const rule = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.completenessWitness;
    const obligationsMatch = witness.obligations.length === rule.requiredObligations.length
      && witness.obligations.every((obligation, index) => obligation === rule.requiredObligations[index]);
    switch (witness.kind === rule.witnessKind && obligationsMatch) {
      case true:
        return Object.freeze({ kind: 'completeness_witness_accepted', witness, rejections: Object.freeze([]) });
      case false:
        return Object.freeze({
          kind: 'completeness_witness_rejected',
          witness,
          rejections: inventoryRejections(Object.freeze({ kind: rule.rejectionKind, witness } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_completeness_witness_invalid' }>)),
        });
    }
  },
  judgeSourceIdentityUniqueness: (
    sources: SourceFileInventory,
  ): LaravelControllerInvocationInventorySourceIdentityJudgment => {
    const rule = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.sourceIdentityUniqueness;
    const duplicates = sources.duplicateIdentities();
    return duplicates.continueWith({
      onEmpty: () => Object.freeze({ kind: 'source_identity_unique', sources, rejections: Object.freeze([]) }),
      onSource: (firstDuplicate, remainingDuplicates) => {
        const firstRejection = Object.freeze({
          kind: rule.rejectionKind,
          sourceFile: firstDuplicate,
        } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>);
        const remainingRejections = duplicateSourceRejections(remainingDuplicates);
        return Object.freeze({
          kind: 'source_identity_duplicates_found',
          duplicates,
          rejections: inventoryRejections(firstRejection, remainingRejections),
        });
      },
    });
  },
  judgeJudgmentCorrespondence: (
    sourceInventory: LaravelControllerSourceInventoryInterface,
    judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
  ): LaravelControllerInvocationInventoryCorrespondenceJudgment => {
    const rule = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.judgmentCorrespondence;
    const judgeSourceJudgmentCardinality = (
      sourceFile: SourceFile,
      current: LaravelControllerInvocationJudgmentMatchCardinality = noInvocationJudgmentMatchesSource(),
      position = 0,
    ): LaravelControllerInvocationJudgmentMatchCardinality => {
      const judgment = judgments[position];
      return judgment === undefined
        ? current
        : judgeSourceJudgmentCardinality(
          sourceFile,
          current.includeRelation(judgment.relateSourceFileIdentity(sourceFile)),
          position + 1,
        );
    };
    const partitionSourceCorrespondence = (
      sources: SourceFileInventory,
      missingSources: SourceFileInventory = sourceFileInventoryFactory.empty(),
      multiplyJudgedSources: SourceFileInventory = sourceFileInventoryFactory.empty(),
    ): Readonly<{ readonly missingSources: SourceFileInventory; readonly multiplyJudgedSources: SourceFileInventory }> => sources.continueWith({
      onEmpty: () => Object.freeze({ missingSources, multiplyJudgedSources }),
      onSource: (sourceFile, remaining) => judgeSourceJudgmentCardinality(sourceFile).continueWith({
        onNoMatch: () => partitionSourceCorrespondence(remaining, missingSources.include(sourceFile), multiplyJudgedSources),
        onOneMatch: () => partitionSourceCorrespondence(remaining, missingSources, multiplyJudgedSources),
        onMultipleMatches: () => partitionSourceCorrespondence(remaining, missingSources, multiplyJudgedSources.include(sourceFile)),
      }),
    });
    const correspondencePartitions = partitionSourceCorrespondence(sourceInventory.sources);
    const missingSources = correspondencePartitions.missingSources;
    const multiplyJudgedSources = correspondencePartitions.multiplyJudgedSources;
    const judgeOrphanJudgments = (
      position = 0,
      orphans: readonly LaravelControllerInvocationSemanticJudgmentInterface[] = Object.freeze([]),
    ): readonly LaravelControllerInvocationSemanticJudgmentInterface[] => {
      const judgment = judgments[position];
      return judgment === undefined
        ? orphans
        : sourceInventory.sources.identityCardinalityAs(judgment.sourceFile).continueWith({
          onNoMatch: () => judgeOrphanJudgments(position + 1, Object.freeze([...orphans, judgment])),
          onOneMatch: () => judgeOrphanJudgments(position + 1, orphans),
          onMultipleMatches: () => judgeOrphanJudgments(position + 1, orphans),
        });
    };
    const includeOrphanJudgmentRejections = (
      orphans: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
      inventory: CorrespondenceRejectionInventory,
      position = 0,
    ): CorrespondenceRejectionInventory => {
      const orphan = orphans[position];
      return orphan === undefined
        ? inventory
        : includeOrphanJudgmentRejections(
          orphans,
          inventory.include(Object.freeze({
            kind: rule.orphanJudgmentRejectionKind,
            sourceFile: orphan.sourceFile,
          } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'invocation_judgment_is_outside_controller_source_inventory' }>)),
          position + 1,
        );
    };
    const orphanJudgments = judgeOrphanJudgments();
    const rejections = includeOrphanJudgmentRejections(
      orphanJudgments,
      includeCorrespondenceRejections(
        includeCorrespondenceRejections(
          correspondenceRejectionInventory.empty(),
          missingInvocationJudgmentRejections(missingSources),
        ),
        multipleInvocationJudgmentRejections(multiplyJudgedSources),
      ),
    );
    return rejections.closeCorrespondence(sourceInventory, judgments, missingSources, multiplyJudgedSources, orphanJudgments);
  },
});

const rejectedInventoryResult = (
  sourceInventory: LaravelControllerSourceInventoryInterface,
  rejections: readonly [LaravelControllerInvocationSemanticJudgmentInventoryRejection, ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[]],
): Extract<LaravelControllerInvocationSemanticJudgmentInventoryResult, { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected' }> => {
  const result: Extract<LaravelControllerInvocationSemanticJudgmentInventoryResult, { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected' }> = Object.freeze({
    kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected',
    contractVersion: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.version,
    sourceInventory,
    rejections,
    withRejections: (additionalRejections: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[]) =>
      additionalRejections.length === 0
        ? result
        : rejectedInventoryResult(sourceInventory, Object.freeze([...rejections, ...additionalRejections]) as InventoryRejections),
    preserveRejectedInventory: () => result,
  });
  return result;
};

const validatedInventoryResult = (
  receipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
): Extract<LaravelControllerInvocationSemanticJudgmentInventoryResult, { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated' }> => {
  const result: Extract<LaravelControllerInvocationSemanticJudgmentInventoryResult, { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated' }> = Object.freeze({
    kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated',
    contractVersion: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.version,
    receipt,
    withRejections: (rejections: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[]) =>
      rejections.length === 0
        ? result
        : rejectedInventoryResult(receipt.sourceInventory, Object.freeze([...rejections]) as InventoryRejections),
    buildManifest: async ({ routeSelection, manifestBuilderPreparation }) => {
      const input = Object.freeze({
        kind: 'manifest_builder_input' as const,
        invocationInventoryReceipt: receipt,
        routeSelection,
      });
      const builder = manifestBuilderPreparation.prepare(input);
      const judgment: ManifestBuilderJudgment = await builder.build();
      return judgment;
    },
  });
  return result;
};

export const laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_inventory_authority',
  contract: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT,
  identitySemantics: laravelSourceIdentitySemantics,
  reasoning,
  close: (input: LaravelControllerInvocationSemanticJudgmentInventoryInput): LaravelControllerInvocationSemanticJudgmentInventoryResult => {
    const inventory = input.sourceInventory;
    const projectBinding = reasoning.judgeProjectBinding(inventory.sourceProject, inventory.completeness.sourceProject);
    const completeness = reasoning.judgeCompletenessWitness(inventory.completeness);
    const sourceIdentity = reasoning.judgeSourceIdentityUniqueness(inventory.sources);
    const correspondence = reasoning.judgeJudgmentCorrespondence(inventory, input.judgments);
    const validatedReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = Object.freeze({
        kind: 'laravel_controller_invocation_semantic_judgment_inventory_closure_receipt',
        contract: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT,
        sourceInventory: inventory,
        correspondences: Object.freeze([...input.judgments]),
        completeness: Object.freeze({
          kind: 'laravel_controller_invocation_semantic_judgment_inventory_complete',
          obligations: Object.freeze([
            'controller-source-inventory-is-complete-and-project-bound',
            'every-controller-source-has-exactly-one-invocation-judgment',
            'no-judgment-exists-outside-the-controller-source-inventory',
            'not-connected-is-preserved-as-an-explicit-integrated-outcome',
            'source-identity-and-integrated-response-remain-one-correlated-judgment',
          ] satisfies LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness['obligations']),
        } satisfies LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness),
        outcomePreservation: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.outcomePreservation,
      });
    const validatedResult = validatedInventoryResult(validatedReceipt);
    return validatedResult.withRejections(Object.freeze([
      ...projectBinding.rejections,
      ...completeness.rejections,
      ...sourceIdentity.rejections,
      ...correspondence.rejections,
    ]));
  },
});
