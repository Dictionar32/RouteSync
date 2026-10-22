import { describe, expect, it } from 'vitest';
import { LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT } from '../laravelChannelScannerInterface';
import { invocationSemanticRuntimeExecutor } from '../invocationSemanticRuntimeExecutor';
import { INVOCATION_SEMANTIC_CONTRACT } from '../invocationSemanticJudgmentInterface';

describe('authority interface-first model phase 2208', () => {
  it('keeps the invocation runtime executor explicitly delegated to upstream authority', () => {
    expect(invocationSemanticRuntimeExecutor.kind).toBe('invocation_semantic_runtime_executor');
    expect(invocationSemanticRuntimeExecutor.authority).toBe('upstream');
    expect(invocationSemanticRuntimeExecutor.execute).toBeTypeOf('function');
    expect(invocationSemanticRuntimeExecutor.executeAll).toBeTypeOf('function');
    expect(invocationSemanticRuntimeExecutor.contract).toBe(INVOCATION_SEMANTIC_CONTRACT);
    expect(invocationSemanticRuntimeExecutor.batchContract).toBe(INVOCATION_SEMANTIC_CONTRACT);
  });

  it('does not claim channel semantic authority is closed while legacy pattern classification remains', () => {
    expect(LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT).toMatchObject({
      kind: 'laravel_channel_scanner_migration_contract',
      version: 3,
      currentRuntime: 'legacy-channel-scanner-still-classifies-public-private-presence-from-channel-pattern-without-client-subscription-evidence',
    });
    expect(LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT.requiredCutover)
      .toContain('BroadcastChannelKindJudgmentAuthority');
  });
});
