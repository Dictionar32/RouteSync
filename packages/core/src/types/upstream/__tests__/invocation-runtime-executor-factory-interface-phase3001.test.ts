import { describe, expect, it } from 'vitest';
import {
  invocationSemanticAuthority,
  semanticInterproceduralDataFlowAuthority,
} from '../invocationSemanticJudgmentAuthority';
import {
  invocationSemanticRuntimeExecutor,
  invocationSemanticRuntimeExecutorFactory,
} from '../invocationSemanticRuntimeExecutor';
import { channelKindFactory } from '../channel';

describe('invocation runtime executor factory interface phase 3001', () => {
  it('constructs an executor that retains the exact upstream authority identities', () => {
    const executor = invocationSemanticRuntimeExecutorFactory.create(
      invocationSemanticAuthority,
      semanticInterproceduralDataFlowAuthority,
    );

    expect(executor.invocationAuthority).toBe(invocationSemanticAuthority);
    expect(executor.batchAuthority).toBe(semanticInterproceduralDataFlowAuthority);
    expect(executor.contract).toBe(invocationSemanticAuthority.contract);
    expect(executor.batchContract).toBe(semanticInterproceduralDataFlowAuthority.contract);
    expect(Object.isFrozen(executor)).toBe(true);
  });

  it('publishes one canonical production executor assembled by the same domain operation', () => {
    expect(invocationSemanticRuntimeExecutorFactory.kind)
      .toBe('invocation_semantic_runtime_executor_factory');
    expect(invocationSemanticRuntimeExecutor.kind).toBe('invocation_semantic_runtime_executor');
    expect(invocationSemanticRuntimeExecutor.authority).toBe('upstream');
    expect(invocationSemanticRuntimeExecutor.execute).toBeTypeOf('function');
    expect(invocationSemanticRuntimeExecutor.executeAll).toBeTypeOf('function');
  });
});


describe('upstream channel-kind domain continuation phase 3001', () => {
  it('projects channel kind through its own exhaustive domain operation', () => {
    const kind = channelKindFactory.presence();
    const projected = kind.continueWith({
      public: () => 'public-projection',
      private: () => 'private-projection',
      presence: () => 'presence-projection',
    });

    expect(projected).toBe('presence-projection');
    expect(kind.requiresAuthentication()).toEqual({ kind: 'true' });
    expect(channelKindFactory.public().requiresAuthentication()).toEqual({ kind: 'false' });
    expect(channelKindFactory.private().requiresAuthentication()).toEqual({ kind: 'true' });
    expect(Object.isFrozen(kind)).toBe(true);
  });
});
