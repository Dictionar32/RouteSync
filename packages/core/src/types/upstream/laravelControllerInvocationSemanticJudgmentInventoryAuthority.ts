import {
  LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT,
  LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT,
  type LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface,
  type LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness,
  type LaravelControllerInvocationSemanticJudgmentInventoryInput,
  type LaravelControllerInvocationSemanticJudgmentInventoryRejection,
  type LaravelControllerInvocationSemanticJudgmentInventoryResult,
  type LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface,
  type LaravelControllerInvocationInventoryProjectBindingJudgment,
  type LaravelControllerInvocationInventoryCompletenessJudgment,
  type LaravelControllerInvocationInventorySourceIdentityJudgment,
  type LaravelControllerInvocationInventoryCorrespondenceJudgment,
  type LaravelControllerSourceInventoryCompletenessWitness,
  type LaravelControllerSourceInventoryInterface,
} from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import type { SourceFile } from './names';
import type { SourceProjectIdentity } from './highLevelSourceModel';

const nonEmpty = <T>(first: T, rest: readonly T[] = []): readonly [T, ...T[]] => Object.freeze([first, ...rest]);
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';

const reasoning: LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_inventory_reasoning',
  contract: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT,
  judgeProjectBinding: (
    inventoryProject: SourceProjectIdentity,
    witnessProject: SourceProjectIdentity,
  ): LaravelControllerInvocationInventoryProjectBindingJudgment => {
    const relation = laravelSourceIdentitySemantics.relateSourceProjects(inventoryProject, witnessProject);
    switch (relation.kind) {
      case 'same_source_project_identity':
        return Object.freeze({ kind: 'project_binding_accepted', relation, rejections: Object.freeze([]) });
      case 'different_source_project_identity':
        return Object.freeze({
          kind: 'project_binding_rejected',
          relation,
          rejections: nonEmpty(Object.freeze({
            kind: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.projectBinding.rejectionKind,
            inventoryProject,
            witnessProject,
          } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_project_binding_mismatch' }>)),
        });
    }
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
          rejections: nonEmpty(Object.freeze({ kind: rule.rejectionKind, witness } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_completeness_witness_invalid' }>)),
        });
    }
  },
  judgeSourceIdentityUniqueness: (
    sources: readonly SourceFile[],
  ): LaravelControllerInvocationInventorySourceIdentityJudgment => {
    const rule = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.sourceIdentityUniqueness;
    const duplicates = sources.filter(sourceFile =>
      sources.filter(candidate => laravelSourceIdentitySemantics.relateSourceFiles(candidate, sourceFile).kind === rule.sameIdentityRelation).length > rule.maximumOccurrences,
    );
    const rejections = duplicates.map(sourceFile => Object.freeze({
      kind: rule.rejectionKind,
      sourceFile,
    } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>));
    switch (rejections.length) {
      case 0:
        return Object.freeze({ kind: 'source_identity_unique', sources, rejections: Object.freeze([]) });
      default: {
        const [first, ...rest] = rejections;
        return Object.freeze({
          kind: 'source_identity_duplicates_found',
          duplicates: Object.freeze(duplicates),
          rejections: nonEmpty(first, rest),
        });
      }
    }
  },
  judgeJudgmentCorrespondence: (
    sourceInventory: LaravelControllerSourceInventoryInterface,
    judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
  ): LaravelControllerInvocationInventoryCorrespondenceJudgment => {
    const rule = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT.rules.judgmentCorrespondence;
    const missingSources = sourceInventory.sources.filter(sourceFile =>
      judgments.filter(judgment => laravelSourceIdentitySemantics.relateSourceFiles(judgment.sourceFile, sourceFile).kind === rule.sameIdentityRelation).length < rule.minimumMatches,
    );
    const multiplyJudgedSources = sourceInventory.sources.filter(sourceFile =>
      judgments.filter(judgment => laravelSourceIdentitySemantics.relateSourceFiles(judgment.sourceFile, sourceFile).kind === rule.sameIdentityRelation).length > rule.maximumMatches,
    );
    const orphanJudgments = judgments.filter(judgment =>
      sourceInventory.sources.filter(sourceFile => laravelSourceIdentitySemantics.relateSourceFiles(sourceFile, judgment.sourceFile).kind === rule.sameIdentityRelation).length < rule.minimumMatches,
    );
    const rejections: LaravelControllerInvocationSemanticJudgmentInventoryRejection[] = [
      ...missingSources.map(sourceFile => Object.freeze({ kind: rule.missingJudgmentRejectionKind, sourceFile } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_has_no_invocation_judgment' }>)),
      ...multiplyJudgedSources.map(sourceFile => Object.freeze({ kind: rule.multipleJudgmentsRejectionKind, sourceFile } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_has_multiple_invocation_judgments' }>)),
      ...orphanJudgments.map(judgment => Object.freeze({ kind: rule.orphanJudgmentRejectionKind, sourceFile: judgment.sourceFile } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'invocation_judgment_is_outside_controller_source_inventory' }>)),
    ];
    switch (rejections.length) {
      case 0:
        return Object.freeze({ kind: 'judgment_correspondence_closed', sourceInventory, judgments, rejections: Object.freeze([]) });
      default: {
        const [first, ...rest] = rejections;
        return Object.freeze({
          kind: 'judgment_correspondence_rejected',
          missingSources: Object.freeze(missingSources),
          multiplyJudgedSources: Object.freeze(multiplyJudgedSources),
          orphanJudgments: Object.freeze(orphanJudgments),
          rejections: nonEmpty(first, rest),
        });
      }
    }
  },
});

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
    const rejections: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[] = Object.freeze([
      ...projectBinding.rejections,
      ...completeness.rejections,
      ...sourceIdentity.rejections,
      ...correspondence.rejections,
    ]);
    const validatedResult: LaravelControllerInvocationSemanticJudgmentInventoryResult = Object.freeze({
      kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated',
      contractVersion: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.version,
      receipt: Object.freeze({
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
      }),
    } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryResult, { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated' }>);
    return rejections.reduce<LaravelControllerInvocationSemanticJudgmentInventoryResult>(
      (result, rejection) => {
        switch (result.kind) {
          case 'laravel_controller_invocation_semantic_judgment_inventory_validated': {
            const rejectionLedger: readonly [LaravelControllerInvocationSemanticJudgmentInventoryRejection, ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[]] = [rejection];
            return Object.freeze({
              kind: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.rejectionAggregation.resultKind,
              contractVersion: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.version,
              sourceInventory: inventory,
              rejections: Object.freeze(rejectionLedger),
            } satisfies Extract<LaravelControllerInvocationSemanticJudgmentInventoryResult, { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected' }>);
          }
          case 'laravel_controller_invocation_semantic_judgment_inventory_rejected': {
            const rejectionLedger: readonly [LaravelControllerInvocationSemanticJudgmentInventoryRejection, ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[]] = [
              result.rejections[0],
              ...result.rejections.slice(1),
              rejection,
            ];
            return Object.freeze({ ...result, rejections: Object.freeze(rejectionLedger) });
          }
        }
      },
      validatedResult,
    );
  },
});
