import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory, stringValue } from '../names';
import { laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticInputFactory } from '../laravelControllerInvocationSemanticJudgmentAuthority';

describe('Phase2954 invocation judgment source identity operation', () => {
  it('owns canonical same-identity and different-identity follow-up judgments', () => {
    const sourceFile = sourceFileIdentityFactory.create(stringValue.create('/workspace/app/Http/Controllers/OrderController.php'));
    const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFile));

    const sameIdentity = judgment.relateSourceFileIdentity(
      sourceFileIdentityFactory.create(stringValue.create('/workspace/app/Http/Controllers/OrderController.php')),
    ).continueWith({
      onSame: relation => relation.kind,
      onDifferent: relation => relation.kind,
    });
    const differentIdentity = judgment.relateSourceFileIdentity(
      sourceFileIdentityFactory.create(stringValue.create('/workspace/app/Http/Controllers/InvoiceController.php')),
    ).continueWith({
      onSame: relation => relation.kind,
      onDifferent: relation => relation.kind,
    });

    expect(sameIdentity).toBe('same_source_file_identity');
    expect(differentIdentity).toBe('different_source_file_identity');
  });
});
