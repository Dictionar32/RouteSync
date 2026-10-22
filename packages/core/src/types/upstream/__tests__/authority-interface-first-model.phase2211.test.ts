import { describe, expect, it } from 'vitest';
import { legacyLaravelControllerExecutionDependencies } from '../../../compiler/scanner/wiring/laravelControllerExecutionDependencies';
import { controllerBodySemanticJudgmentAuthority } from '../../../compiler/scanner/subscanners/controller/controllerAstCanonical';

describe('authority interface-first model phase 2211', () => {
  it('declares exact body-judgment preservation as part of canonical action knowledge', () => {
    expect(legacyLaravelControllerExecutionDependencies.actionJudgment.contract.projectionMigration.derivationOwnershipRemainder).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'body_source_ast',
        currentOwner: 'controller_action_contract',
        targetOwner: 'source_evidence_projection_boundary',
      }),
      expect.objectContaining({
        kind: 'request_binding_compatibility_adapter',
        currentOwner: 'legacy_action_adapter',
        targetOwner: 'source_evidence_projection_boundary',
      }),
    ]));
  });

  it('keeps the existing body authority source-correlated instead of introducing another authority', () => {
    expect(controllerBodySemanticJudgmentAuthority.kind).toBe('controller_body_semantic_judgment_authority');
    expect(controllerBodySemanticJudgmentAuthority.contractVersion).toBe(5);
    expect(controllerBodySemanticJudgmentAuthority.sourceCorrelation).toBe(
      'body-judgment-retains-the-exact-source-identity-supplied-as-input',
    );
  });
});
