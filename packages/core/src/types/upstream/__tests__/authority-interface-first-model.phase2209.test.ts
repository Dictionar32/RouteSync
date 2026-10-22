import { describe, expect, it } from 'vitest';
import { invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority } from '../invocationSemanticJudgmentAuthority';
import { createInvocationSemanticRuntimeExecutor } from '../invocationSemanticRuntimeExecutor';
import { INVOCATION_SEMANTIC_CONTRACT } from '../invocationSemanticJudgmentInterface';
import { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT } from '../laravelControllerInvocationSemanticJudgmentAuthority';
import { LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT } from '../laravelChannelScannerInterface';

describe('authority interface-first model phase 2209', () => {
  it('publishes the individual and batch contracts separately while preserving the shared contract identity', () => {
    const executor = createInvocationSemanticRuntimeExecutor(
      invocationSemanticAuthority,
      semanticInterproceduralDataFlowAuthority,
    );

    expect(executor.invocationAuthority).toBe(invocationSemanticAuthority);
    expect(executor.batchAuthority).toBe(semanticInterproceduralDataFlowAuthority);
    expect(executor.contract).toBe(executor.invocationAuthority.contract);
    expect(executor.contract).toBe(INVOCATION_SEMANTIC_CONTRACT);
    expect(executor.batchContract).toBe(executor.batchAuthority.contract);
    expect(executor.batchContract).toBe(semanticInterproceduralDataFlowAuthority.contract);
    expect(executor.batchContract).toBe(executor.contract);
    expect(executor.delegation).toBe(
      'execute-to-InvocationSemanticAuthorityInterface.analyze;executeAll-to-SemanticInterproceduralDataFlowAuthorityInterface.analyze',
    );
  });

  it('keeps PHP invocation integration distinct from Laravel HTTP response ownership', () => {
    expect(LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT).toMatchObject({
      kind: 'laravel_controller_invocation_semantic_judgment_contract',
      responseCorrelation: 'integrated_response_indexed_by_exact_invocation_judgment',
    });
    expect(LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT.version).toBe(3);
  });
});
