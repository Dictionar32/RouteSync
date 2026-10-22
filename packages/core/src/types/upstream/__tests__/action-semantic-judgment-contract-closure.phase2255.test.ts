import { describe, expect, it } from 'vitest';
import { controllerActionProjectionMigration } from '../laravelControllerActionSemanticJudgmentInterface';
import { legacyLaravelControllerExecutionDependencies } from '../../../compiler/scanner/wiring/laravelControllerExecutionDependencies';

describe('action semantic judgment contract closure phase 2255', () => {
  it('keeps projection migration debt on the contract instead of encoding it as a semantic judgment outcome', () => {
    const contract = legacyLaravelControllerExecutionDependencies.actionJudgment.contract;
    expect(contract.version).toBe(45);
    expect(contract.judgmentShape).toContain('projection-migration-debt-is-contract-level-not-judgment-level');
    expect(contract.projectionMigration).toEqual(controllerActionProjectionMigration);
    expect(contract.projectionMigration.kind).toBe('laravel_controller_action_projection_migration');
  });

  it('keeps the canonical semantic judgment shape independent of migration status', () => {
    const source = legacyLaravelControllerExecutionDependencies.actionJudgment.judge.toString();
    expect(source).not.toContain('coverage:');
    expect(source).toContain('controller_action_semantic_judgment_published');
  });

  it('retains typed ownership debts without falsely calling them semantic incompleteness', () => {
    expect(controllerActionProjectionMigration.derivationOwnershipRemainder).toEqual([
      expect.objectContaining({ kind: 'body_source_ast' }),
      expect.objectContaining({ kind: 'request_binding_compatibility_adapter' }),
      expect.objectContaining({ kind: 'legacy_action_semantic_derivation' }),
      expect.objectContaining({ kind: 'legacy_dataflow_relation_algebra' }),
    ]);
  });
});
