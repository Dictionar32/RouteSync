import { describe, expect, it } from 'vitest';
import { createSourceFile } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { laravelControllerInvocationSemanticJudgmentAuthority } from '../laravelControllerInvocationSemanticJudgmentAuthority';
import { laravelControllerInvocationSemanticJudgmentInventoryAuthority } from '../laravelControllerInvocationSemanticJudgmentInventoryAuthority';
import { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT, type LaravelControllerSourceInventoryCompletenessWitness, type LaravelControllerSourceInventoryInterface } from '../laravelControllerInvocationSemanticJudgmentInventoryInterface';

describe('Laravel invocation inventory closure interface-first', () => {
  it('executes the completeness witness obligations exposed by its reasoning contract', () => {
    expect(laravelControllerInvocationSemanticJudgmentInventoryAuthority.contract.reasoning).toBe(
      LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning,
    );
    expect(LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.judgmentCorrespondence.minimumMatches).toBe(1);
    expect(LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.judgmentCorrespondence.maximumMatches).toBe(1);
    expect(LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.rejectionAggregation.mode).toBe('preserve_all_independent_violations');
    expect(laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.contract).toBe(
      LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning,
    );
    expect(laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.kind).toBe(
      'laravel_controller_invocation_semantic_judgment_inventory_reasoning',
    );
  });

  it('keeps project-binding rejection separate from completeness-witness rejection', () => {
    const sourceProject = createLaravelSourceProjectIdentity('/workspace/app');
    const witnessProject = createLaravelSourceProjectIdentity('/workspace/other-app');
    const sourceFile = createSourceFile('/workspace/app/app/Http/Controllers/ExampleController.php');
    const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge({
      kind: 'controller_invocation_pipeline_not_provided',
      sourceFile,
    });
    const result = laravelControllerInvocationSemanticJudgmentInventoryAuthority.close({
      kind: 'laravel_controller_invocation_semantic_judgment_inventory_input',
      sourceInventory: {
        kind: 'laravel_controller_source_inventory',
        contractVersion: 1,
        sourceProject,
        sources: [sourceFile],
        completeness: {
          kind: 'laravel_controller_source_inventory_completeness_witness',
          sourceProject: witnessProject,
          obligations: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.completenessWitness.requiredObligations,
        },
      },
      judgments: [judgment],
    });

    expect(result.kind).toBe('laravel_controller_invocation_semantic_judgment_inventory_rejected');
    if (result.kind === 'laravel_controller_invocation_semantic_judgment_inventory_rejected') {
      expect(result.contractVersion).toBe(11);
      expect(result.rejections.map(rejection => rejection.kind)).toEqual([
        'controller_source_inventory_project_binding_mismatch',
      ]);
    }
  });

  it('publishes closed semantic judgments before inventory closure composes the result', () => {
    const sourceProject = createLaravelSourceProjectIdentity('/workspace/app');
    const sourceFile = createSourceFile('/workspace/app/app/Http/Controllers/ExampleController.php');
    const witness: LaravelControllerSourceInventoryCompletenessWitness = {
      kind: 'laravel_controller_source_inventory_completeness_witness',
      sourceProject,
      obligations: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.completenessWitness.requiredObligations,
    };
    const projectBinding = laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.judgeProjectBinding(sourceProject, sourceProject);
    const completeness = laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.judgeCompletenessWitness(witness);
    const sourceIdentity = laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.judgeSourceIdentityUniqueness([sourceFile]);
    const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge({
      kind: 'controller_invocation_pipeline_not_provided',
      sourceFile,
    });
    const inventory: LaravelControllerSourceInventoryInterface = {
      kind: 'laravel_controller_source_inventory',
      contractVersion: 1,
      sourceProject,
      sources: [sourceFile],
      completeness: witness,
    };
    const correspondence = laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.judgeJudgmentCorrespondence(inventory, [judgment]);

    expect(projectBinding.kind).toBe('project_binding_accepted');
    expect(completeness.kind).toBe('completeness_witness_accepted');
    expect(sourceIdentity.kind).toBe('source_identity_unique');
    expect(correspondence.kind).toBe('judgment_correspondence_closed');
  });

  it('publishes the exact v11 contract on the authority-produced receipt', () => {
    const sourceProject = createLaravelSourceProjectIdentity('/workspace/app');
    const sourceFile = createSourceFile('/workspace/app/app/Http/Controllers/ExampleController.php');
    const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge({
      kind: 'controller_invocation_pipeline_not_provided',
      sourceFile,
    });
    const result = laravelControllerInvocationSemanticJudgmentInventoryAuthority.close({
      kind: 'laravel_controller_invocation_semantic_judgment_inventory_input',
      sourceInventory: {
        kind: 'laravel_controller_source_inventory',
        contractVersion: 1,
        sourceProject,
        sources: [sourceFile],
        completeness: {
          kind: 'laravel_controller_source_inventory_completeness_witness',
          sourceProject,
          obligations: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.completenessWitness.requiredObligations,
        },
      },
      judgments: [judgment],
    });

    expect(result.kind).toBe('laravel_controller_invocation_semantic_judgment_inventory_validated');
    if (result.kind === 'laravel_controller_invocation_semantic_judgment_inventory_validated') {
      expect(result.contractVersion).toBe(11);
      expect(result.receipt.contract).toBe(LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT);
      expect(result.receipt.correspondences[0]).toBe(judgment);
      expect(result.receipt.outcomePreservation).toBe(LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.outcomePreservation);
    }
  });
});
