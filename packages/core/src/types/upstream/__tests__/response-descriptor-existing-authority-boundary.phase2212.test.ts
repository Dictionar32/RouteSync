import { describe, expect, it } from 'vitest';
import { legacyLaravelControllerExecutionDependencies } from '../../../compiler/scanner/wiring/laravelControllerExecutionDependencies';
import { laravelControllerResponseSemanticPipeline } from '../laravelControllerResponseSemanticPipeline';

describe('response descriptor existing-authority boundary phase 2212', () => {
  it('closes the legacy response descriptor derivation obligation', () => {
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.projectionMigration.derivationOwnershipRemainder).not.toContainEqual(
      expect.objectContaining({ kind: 'response_descriptor_resolution' }),
    );
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.derivationBoundary).toContain(
      'response-descriptor-derivation-is-retired-from-action-contract',
    );
  });


  it('keeps the runtime pipeline identity synchronized with its declared interface and contract version', () => {
    expect(laravelControllerResponseSemanticPipeline.contractVersion).toBe(31);
    expect(laravelControllerResponseSemanticPipeline.contract.contractVersion).toBe(31);
    expect(laravelControllerResponseSemanticPipeline.contractVersion).toBe(
      laravelControllerResponseSemanticPipeline.contract.contractVersion,
    );
  });

  it('keeps the existing response pipeline as the authority instead of declaring a parallel descriptor authority', () => {
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.version).toBe(45);
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.derivationBoundary).toContain(
      'response-descriptor-derivation-is-retired-from-action-contract',
    );
    expect(laravelControllerResponseSemanticPipeline.kind).toBe('laravel_controller_response_semantic_pipeline');
    expect(laravelControllerResponseSemanticPipeline.dependencies.dtoResponseContractProjectionAuthority.kind).toBe(
      'laravel_dto_response_contract_projection_authority',
    );
  });
});
