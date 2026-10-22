import type {
  InvocationSemanticEvidence,
  InvocationTargetResolutionJudgment,
  SemanticInvocationObligation,
} from '../../src/types/upstream/invocationSemanticJudgmentInterface';
import type { SemanticCallable, SemanticInvocation } from '../../src/types/upstream/semanticDataflowKnowledge';

declare const invocation: SemanticInvocation;
declare const callable: SemanticCallable;
declare const evidence: InvocationSemanticEvidence;
declare const unresolvedObligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>;
declare const ambiguousObligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>;

const resolved: InvocationTargetResolutionJudgment = {
  kind: 'resolved', invocation, target: callable, evidence,
};
const unresolved: InvocationTargetResolutionJudgment = {
  kind: 'unresolved', invocation, candidates: [], obligation: unresolvedObligation, evidence,
};
const ambiguous: InvocationTargetResolutionJudgment = {
  kind: 'ambiguous', invocation, candidates: [callable, callable], obligation: ambiguousObligation, evidence,
};
const invalidUnresolved: InvocationTargetResolutionJudgment = {
  kind: 'unresolved', invocation,
  // @ts-expect-error unresolved outcomes cannot carry candidate targets
  candidates: [callable], obligation: unresolvedObligation, evidence,
};
const invalidAmbiguous: InvocationTargetResolutionJudgment = {
  kind: 'ambiguous', invocation,
  // @ts-expect-error ambiguous outcomes must retain at least two candidates
  candidates: [callable], obligation: ambiguousObligation, evidence,
};

void resolved;
void unresolved;
void ambiguous;
void invalidUnresolved;
void invalidAmbiguous;
