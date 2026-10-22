import type {
  LaravelControllerAstProjectionContext,
  LaravelControllerAstProjectionSemanticAuthorityInterface,
  LaravelControllerAstProjectionSemanticJudgment,
  LaravelControllerInvocationSemanticJudgmentInterface,
} from './laravelControllerInvocationSemanticJudgmentInterface';

/**
 * AST projection is a typed projection of already-owned judgments.
 * This class does not resolve invocation meaning or reconstruct response provenance.
 */
export class LaravelControllerAstProjectionSemanticAuthority
  implements LaravelControllerAstProjectionSemanticAuthorityInterface {
  readonly kind: 'laravel_controller_ast_projection_semantic_authority' = 'laravel_controller_ast_projection_semantic_authority';
  readonly responsePreservation: 'ast-projection-forwards-the-artifact-owned-response-judgment-with-the-exact-correlated-invocation-judgment' = 'ast-projection-forwards-the-artifact-owned-response-judgment-with-the-exact-correlated-invocation-judgment';
  readonly runtimeResponsibility: 'preserve-invocation-only-context-as-invocation-only-and-project-integrated-invocation-response-context-without-classification-or-reconstruction' = 'preserve-invocation-only-context-as-invocation-only-and-project-integrated-invocation-response-context-without-classification-or-reconstruction';

  judge<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    context: LaravelControllerAstProjectionContext<InvocationJudgment>,
  ): LaravelControllerAstProjectionSemanticJudgment<InvocationJudgment> {
    switch (context.kind) {
      case 'syntax_only':
        return Object.freeze({
          kind: 'syntax_only_projection',
          sourceContextKind: context.kind,
          semanticDataflow: 'not-requested',
        });
      case 'invocation_semantic_judgment':
        return Object.freeze({
          kind: 'invocation_only_projection',
          sourceContextKind: context.kind,
          invocationJudgment: context.judgment,
          semanticDataflow: 'consume-the-canonical-invocation-judgment-without-reclassification',
        });
      case 'integrated_invocation_response_judgment':
        return Object.freeze({
          kind: 'semantic_projection',
          sourceContextKind: context.kind,
          invocationJudgment: context.judgment,
          responseJudgment: context.responseJudgment,
          semanticDataflow: 'consume-the-canonical-invocation-and-response-judgments-without-reclassification',
        });
    }
  }
}

export const laravelControllerAstProjectionSemanticAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface =
  new LaravelControllerAstProjectionSemanticAuthority();
