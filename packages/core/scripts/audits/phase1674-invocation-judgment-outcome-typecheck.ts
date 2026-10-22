import type {
  InvocationArgumentBindingJudgment,
  InvocationArgumentBindingUnavailableTarget,
  InvocationClosedSemanticJudgment,
  InvocationIncompleteSemanticJudgment,
  InvocationTargetResolutionJudgment,
} from '../../src/types/upstream/invocationSemanticJudgmentInterface';

declare const unresolved: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'unresolved' }>;
declare const ambiguous: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'ambiguous' }>;
declare const unresolvedBlocked: Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> & {
  readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'unresolved' }>;
};
declare const ambiguousBlocked: Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> & {
  readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'ambiguous' }>;
};
declare const incomplete: InvocationIncompleteSemanticJudgment;
declare const closed: InvocationClosedSemanticJudgment;

// @ts-expect-error a closed judgment cannot carry an unresolved target
const invalidClosedTarget: InvocationClosedSemanticJudgment['targetResolution'] = unresolved;
// @ts-expect-error a closed judgment cannot carry an ambiguous target
const invalidClosedAmbiguousTarget: InvocationClosedSemanticJudgment['targetResolution'] = ambiguous;
// @ts-expect-error unresolved targets cannot pair with ambiguous blocked-binding outcomes
const invalidUnresolvedBinding: Extract<InvocationIncompleteSemanticJudgment, { readonly targetResolution: { readonly kind: 'unresolved' } }>['argumentBinding'] = ambiguousBlocked;
// @ts-expect-error ambiguous targets cannot pair with unresolved blocked-binding outcomes
const invalidAmbiguousBinding: Extract<InvocationIncompleteSemanticJudgment, { readonly targetResolution: { readonly kind: 'ambiguous' } }>['argumentBinding'] = unresolvedBlocked;

void incomplete;
void closed;
void invalidClosedTarget;
void invalidClosedAmbiguousTarget;
void invalidUnresolvedBinding;
void invalidAmbiguousBinding;
