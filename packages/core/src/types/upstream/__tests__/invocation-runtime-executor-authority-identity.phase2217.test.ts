import { describe, expect, it } from 'vitest';
import { invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority } from '../invocationSemanticJudgmentAuthority';
import { invocationSemanticRuntimeExecutorFactory } from '../invocationSemanticRuntimeExecutor';

describe('invocation runtime executor authority identity phase 2217', () => {
  it('exposes the exact individual and batch authority instances that own execution', () => {
    const executor = invocationSemanticRuntimeExecutorFactory.create(
      invocationSemanticAuthority,
      semanticInterproceduralDataFlowAuthority,
    );

    expect(executor.invocationAuthority).toBe(invocationSemanticAuthority);
    expect(executor.batchAuthority).toBe(semanticInterproceduralDataFlowAuthority);
    expect(executor.contract).toBe(executor.invocationAuthority.contract);
    expect(executor.batchContract).toBe(executor.batchAuthority.contract);
  });

  it('keeps execution as direct delegation to each declared authority', () => {
    const executor = invocationSemanticRuntimeExecutorFactory.create(
      invocationSemanticAuthority,
      semanticInterproceduralDataFlowAuthority,
    );

    expect(executor.delegation).toBe(
      'execute-to-InvocationSemanticAuthorityInterface.analyze;executeAll-to-SemanticInterproceduralDataFlowAuthorityInterface.analyze',
    );
    expect(executor.execute).toBeTypeOf('function');
    expect(executor.executeAll).toBeTypeOf('function');
  });
});
