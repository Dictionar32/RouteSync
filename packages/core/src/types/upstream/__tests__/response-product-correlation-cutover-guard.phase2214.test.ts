import { describe, expect, it } from 'vitest';
import { legacyLaravelControllerExecutionDependencies } from '../../../compiler/scanner/wiring/laravelControllerExecutionDependencies';
import { laravelControllerResponseSemanticPipeline } from '../laravelControllerResponseSemanticPipeline';

describe('response product correlation cutover guard phase 2214', () => {
  it('keeps the action contract version synchronized with the production composition root', () => {
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.version).toBe(45);
  });

  it('requires exact method evidence and source-span correlation before replacing an action descriptor', () => {
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.responseProductCorrelationRule).toBe(
      'controller-artifact-publishes-only-source-correlated-canonical-method-response-products-from-LaravelControllerResponseSemanticPipelineInterface;action-contract-does-not-derive-or-store-a-parallel-response-descriptor',
    );
    expect(laravelControllerResponseSemanticPipeline.contract.methodResponseProductProvenanceRule).toContain(
      'exact-canonical-method-evidence',
    );
  });

  it('closes action response descriptor derivation while preserving unrelated action coverage obligations', () => {
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.projectionMigration.kind).toBe('laravel_controller_action_projection_migration');
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.projectionMigration.derivationOwnershipRemainder).not.toContainEqual(
      expect.objectContaining({ kind: 'response_descriptor_resolution' }),
    );
  });
});
