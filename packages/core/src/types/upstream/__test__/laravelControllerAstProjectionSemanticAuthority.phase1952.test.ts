import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory, stringValue } from '../names';
import { laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticInputFactory } from '../laravelControllerInvocationSemanticJudgmentAuthority';
import { laravelControllerAstProjectionSemanticAuthority } from '../laravelControllerAstProjectionSemanticAuthority';

describe('Laravel controller AST projection semantic authority interface-first', () => {
  it('publishes a closed syntax-only projection judgment without manufacturing invocation semantics', () => {
    const result = laravelControllerAstProjectionSemanticAuthority.judge({ kind: 'syntax_only' });

    expect(result).toEqual({
      kind: 'syntax_only_projection',
      sourceContextKind: 'syntax_only',
      semanticDataflow: 'not-requested',
    });
  });

  it('preserves the exact canonical invocation judgment in semantic projection', () => {
    const invocationJudgment = laravelControllerInvocationSemanticJudgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFileIdentityFactory.create(stringValue.create('app/Http/Controllers/ExampleController.php'))));
    const result = laravelControllerAstProjectionSemanticAuthority.judge({
      kind: 'invocation_semantic_judgment',
      judgment: invocationJudgment,
    });

    expect(result.kind).toBe('invocation_only_projection');
    if (result.kind === 'invocation_only_projection') {
      expect(result.invocationJudgment).toBe(invocationJudgment);
      expect(result.invocationJudgment.response.kind).toBe('php_source_invocation_integration_not_connected');
      expect(result.semanticDataflow).toBe('consume-the-canonical-invocation-judgment-without-reclassification');
    }
  });


  it('preserves the exact integrated response judgment when the closed pair is supplied', () => {
    const invocationJudgment = laravelControllerInvocationSemanticJudgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFileIdentityFactory.create(stringValue.create('app/Http/Controllers/IntegratedController.php'))));
    if (invocationJudgment.response.kind !== 'php_source_invocation_integration_not_connected') {
      throw new Error('Expected the explicit not-connected invocation outcome');
    }
    const responseJudgment = Object.freeze({
      kind: 'controller_response_invocation_not_connected' as const,
      invocationJudgment,
    });
    const result = laravelControllerAstProjectionSemanticAuthority.judge({
      kind: 'integrated_invocation_response_judgment',
      judgment: invocationJudgment,
      responseJudgment,
    });

    expect(result.kind).toBe('semantic_projection');
    if (result.kind === 'semantic_projection') {
      expect(result.invocationJudgment).toBe(invocationJudgment);
      expect(result.responseJudgment).toBe(responseJudgment);
      expect(result.semanticDataflow).toBe('consume-the-canonical-invocation-and-response-judgments-without-reclassification');
    }
  });

  it('does not expose a runtime reasoning-rule object on the projection interface', () => {
    expect('reasoning' in laravelControllerAstProjectionSemanticAuthority).toBe(false);
    expect(laravelControllerInvocationSemanticJudgmentAuthority.contract).toMatchObject({
      kind: 'laravel_controller_invocation_semantic_judgment_contract',
      version: 15,
      judgmentShape: 'closed_discriminated_union',
    });
  });
});
