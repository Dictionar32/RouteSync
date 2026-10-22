/** Ordered AST rule contract and closed selection judgment. */
export type AstRuleApplicability =
  | Readonly<{ readonly kind: 'applicable' }>
  | Readonly<{ readonly kind: 'not_applicable' }>;

export type AstRuleResolution<Output, Failure = never> =
  | Readonly<{ readonly kind: 'resolved'; readonly value: Output }>
  | Readonly<{ readonly kind: 'not_resolved' }>
  | Readonly<{ readonly kind: 'malformed'; readonly failure: Failure }>
  | Readonly<{ readonly kind: 'rule_contract_violation'; readonly failure: Failure }>;

/** Resolver choice is explicit: canonical semantic judgments are preferred; legacy result shapes are adapters only. */
export type AstClassificationResolverContract<Input, Output, LegacyInput, LegacyResult, Failure = never> =
  | Readonly<{
      readonly kind: 'judgment';
      readonly resolve: (input: Input) => AstRuleResolution<Output, Failure>;
    }>
  | Readonly<{
      readonly kind: 'legacy_adapter';
      readonly input: 'tokens';
      readonly resolveLegacy: (input: LegacyInput) => LegacyResult;
    }>
  | Readonly<{
      readonly kind: 'legacy_adapter';
      readonly input: 'context';
      readonly deriveLegacy: (input: Input) => LegacyResult;
    }>;

export type AstClassificationRule<Input, Output, Id extends string | symbol = string, Failure = never> = Readonly<{
  readonly id: Id;
  readonly applies: (input: Input) => AstRuleApplicability;
  readonly resolve: (input: Input) => AstRuleResolution<Output, Failure>;
}>;

export type AstClassificationRuleAttempt<Id extends string | symbol> = Readonly<{
  readonly ruleId: Id;
  readonly applicability: AstRuleApplicability['kind'];
  readonly resolution: 'not_attempted' | 'not_resolved' | 'resolved' | 'malformed' | 'rule_contract_violation';
}>;

export type AstClassificationJudgment<Output, Id extends string | symbol, Failure = never> =
  | Readonly<{
      readonly kind: 'resolved'; readonly ruleId: Id; readonly value: Output;
      readonly attempts: readonly AstClassificationRuleAttempt<Id>[];
      readonly proof: Readonly<{ readonly kind: 'ordered_rule_selection_proof'; readonly selectedRule: Id; readonly precedingRulesRejected: true }>;
    }>
  | Readonly<{ readonly kind: 'not_resolved'; readonly attempts: readonly AstClassificationRuleAttempt<Id>[] }>
  | Readonly<{ readonly kind: 'malformed'; readonly ruleId: Id; readonly failure: Failure; readonly attempts: readonly AstClassificationRuleAttempt<Id>[] }>
  | Readonly<{ readonly kind: 'rule_contract_violation'; readonly ruleId: Id; readonly failure: Failure; readonly attempts: readonly AstClassificationRuleAttempt<Id>[] }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'duplicate_rule_identity' | 'selected_rule_not_in_policy'; readonly ruleId?: Id; readonly attempts: readonly AstClassificationRuleAttempt<Id>[] }>;

export type AstClassificationPrecedenceVerification =
  | Readonly<{ readonly kind: 'verified' }>
  | Readonly<{ readonly kind: 'invalid'; readonly reason: 'precedence_rule_missing' | 'precedence_order_mismatch' }>;

export type AstClassificationProofVerification<Id extends string | symbol> =
  | Readonly<{ readonly kind: 'verified'; readonly selectedRule: Id }>
  | Readonly<{ readonly kind: 'invalid'; readonly reason: 'selected_rule_not_in_policy' | 'preceding_rule_not_rejected' | 'selected_rule_attempt_missing' }>;

export type AstClassificationJudgmentVerification<Id extends string | symbol> =
  | Readonly<{ readonly kind: 'verified_resolved'; readonly selectedRule: Id }>
  | Readonly<{ readonly kind: 'verified_not_resolved' }>
  | Readonly<{ readonly kind: 'verified_malformed'; readonly ruleId: Id }>
  | Readonly<{ readonly kind: 'verified_rule_contract_violation'; readonly ruleId: Id }>
  | Readonly<{ readonly kind: 'invalid'; readonly reason: 'duplicate_rule_identity' | 'attempt_history_incomplete' | 'attempt_history_out_of_order' | 'attempt_state_inconsistent' | 'selected_rule_not_in_policy' | 'proof_invalid' }>;

export interface AstClassificationRuleAlgebraInterface {
  readonly resolveFirst: <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], input: Input) => AstClassificationJudgment<Output, Id, Failure>;
  readonly verifyProof: <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], judgment: AstClassificationJudgment<Output, Id, Failure>) => AstClassificationProofVerification<Id>;
  readonly verifyJudgment: <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], judgment: AstClassificationJudgment<Output, Id, Failure>) => AstClassificationJudgmentVerification<Id>;
  readonly verifyPrecedence: <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], precedence: readonly Readonly<{ readonly before: Id; readonly after: Id }>[]) => AstClassificationPrecedenceVerification;
}

const uniqueRuleIds = <Input, Output, Id extends string | symbol, Failure>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[]): boolean =>
  rules.every((rule, index) => rules.findIndex(candidate => candidate.id === rule.id) === index);

const resolveAt = <Input, Output, Id extends string | symbol, Failure>(
  rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], input: Input, index: number,
  attempts: readonly AstClassificationRuleAttempt<Id>[],
): AstClassificationJudgment<Output, Id, Failure> => {
  if (index >= rules.length) return Object.freeze({ kind: 'not_resolved', attempts });
  const rule = rules[index];
  const applicability = rule.applies(input);
  if (applicability.kind === 'not_applicable') {
    return resolveAt(rules, input, index + 1, Object.freeze([...attempts, Object.freeze({ ruleId: rule.id, applicability: applicability.kind, resolution: 'not_attempted' as const })]));
  }
  const resolution = rule.resolve(input);
  const attempt = Object.freeze({ ruleId: rule.id, applicability: applicability.kind, resolution: resolution.kind });
  const nextAttempts = Object.freeze([...attempts, attempt]);
  switch (resolution.kind) {
    case 'not_resolved': return resolveAt(rules, input, index + 1, nextAttempts);
    case 'malformed': return Object.freeze({ kind: 'malformed', ruleId: rule.id, failure: resolution.failure, attempts: nextAttempts });
    case 'rule_contract_violation': return Object.freeze({ kind: 'rule_contract_violation', ruleId: rule.id, failure: resolution.failure, attempts: nextAttempts });
    case 'resolved': return Object.freeze({ kind: 'resolved', ruleId: rule.id, value: resolution.value, attempts: nextAttempts, proof: Object.freeze({ kind: 'ordered_rule_selection_proof', selectedRule: rule.id, precedingRulesRejected: true }) });
  }
};

const resolveFirst = <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], input: Input): AstClassificationJudgment<Output, Id, Failure> => {
  if (!uniqueRuleIds(rules)) return Object.freeze({ kind: 'contract_violation', reason: 'duplicate_rule_identity', attempts: Object.freeze([]) });
  return resolveAt(rules, input, 0, Object.freeze([]));
};

const verifyProof = <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], judgment: AstClassificationJudgment<Output, Id, Failure>): AstClassificationProofVerification<Id> => {
  if (judgment.kind !== 'resolved') return Object.freeze({ kind: 'invalid', reason: 'selected_rule_attempt_missing' });
  const selectedIndex = rules.findIndex(rule => rule.id === judgment.ruleId);
  if (selectedIndex < 0) return Object.freeze({ kind: 'invalid', reason: 'selected_rule_not_in_policy' });
  if (judgment.proof.selectedRule !== judgment.ruleId || judgment.proof.precedingRulesRejected !== true) return Object.freeze({ kind: 'invalid', reason: 'preceding_rule_not_rejected' });
  if (judgment.attempts.length !== selectedIndex + 1) return Object.freeze({ kind: 'invalid', reason: 'preceding_rule_not_rejected' });
  const precedingAttemptsRejected = rules.slice(0, selectedIndex).every((rule, index) => {
    const attempt = judgment.attempts[index];
    return attempt !== undefined && attempt.ruleId === rule.id &&
      ((attempt.applicability === 'not_applicable' && attempt.resolution === 'not_attempted') ||
       (attempt.applicability === 'applicable' && attempt.resolution === 'not_resolved'));
  });
  if (!precedingAttemptsRejected) return Object.freeze({ kind: 'invalid', reason: 'preceding_rule_not_rejected' });
  const selectedAttempt = judgment.attempts[selectedIndex];
  return selectedAttempt !== undefined && selectedAttempt.ruleId === judgment.ruleId && selectedAttempt.applicability === 'applicable' && selectedAttempt.resolution === 'resolved'
    ? Object.freeze({ kind: 'verified', selectedRule: judgment.ruleId })
    : Object.freeze({ kind: 'invalid', reason: 'selected_rule_attempt_missing' });
};

const verifyJudgment = <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], judgment: AstClassificationJudgment<Output, Id, Failure>): AstClassificationJudgmentVerification<Id> => {
  if (!uniqueRuleIds(rules)) return Object.freeze({ kind: 'invalid', reason: 'duplicate_rule_identity' });
  if (judgment.kind === 'contract_violation') return Object.freeze({ kind: 'invalid', reason: judgment.reason === 'duplicate_rule_identity' ? 'duplicate_rule_identity' : 'selected_rule_not_in_policy' });
  if (judgment.kind === 'resolved') {
    const proof = verifyProof(rules, judgment);
    return proof.kind === 'verified' ? Object.freeze({ kind: 'verified_resolved', selectedRule: proof.selectedRule }) : Object.freeze({ kind: 'invalid', reason: proof.reason === 'selected_rule_not_in_policy' ? 'selected_rule_not_in_policy' : 'proof_invalid' });
  }
  const terminalKind = judgment.kind;
  if (terminalKind === 'not_resolved') {
    if (judgment.attempts.length !== rules.length) return Object.freeze({ kind: 'invalid', reason: 'attempt_history_incomplete' });
    if (!judgment.attempts.every((attempt, index) => attempt.ruleId === rules[index]?.id)) return Object.freeze({ kind: 'invalid', reason: 'attempt_history_out_of_order' });
    const attemptsAreRejected = judgment.attempts.every(attempt =>
      (attempt.applicability === 'not_applicable' && attempt.resolution === 'not_attempted') ||
      (attempt.applicability === 'applicable' && attempt.resolution === 'not_resolved'));
    return attemptsAreRejected ? Object.freeze({ kind: 'verified_not_resolved' }) : Object.freeze({ kind: 'invalid', reason: 'attempt_state_inconsistent' });
  }
  const terminalIndex = rules.findIndex(rule => rule.id === judgment.ruleId);
  if (terminalIndex < 0) return Object.freeze({ kind: 'invalid', reason: 'selected_rule_not_in_policy' });
  if (judgment.attempts.length !== terminalIndex + 1) return Object.freeze({ kind: 'invalid', reason: 'attempt_history_incomplete' });
  if (!judgment.attempts.every((attempt, index) => attempt.ruleId === rules[index]?.id)) return Object.freeze({ kind: 'invalid', reason: 'attempt_history_out_of_order' });
  const precedingRejected = judgment.attempts.slice(0, -1).every(attempt =>
    (attempt.applicability === 'not_applicable' && attempt.resolution === 'not_attempted') ||
    (attempt.applicability === 'applicable' && attempt.resolution === 'not_resolved'));
  if (!precedingRejected) return Object.freeze({ kind: 'invalid', reason: 'attempt_state_inconsistent' });
  const terminalAttempt = judgment.attempts[judgment.attempts.length - 1];
  if (terminalAttempt?.ruleId !== judgment.ruleId || terminalAttempt.applicability !== 'applicable' || terminalAttempt.resolution !== terminalKind) {
    return Object.freeze({ kind: 'invalid', reason: 'attempt_state_inconsistent' });
  }
  return terminalKind === 'malformed'
    ? Object.freeze({ kind: 'verified_malformed', ruleId: judgment.ruleId })
    : Object.freeze({ kind: 'verified_rule_contract_violation', ruleId: judgment.ruleId });
};

const verifyPrecedence = <Input, Output, Id extends string | symbol, Failure = never>(rules: readonly AstClassificationRule<Input, Output, Id, Failure>[], precedence: readonly Readonly<{ readonly before: Id; readonly after: Id }>[]): AstClassificationPrecedenceVerification => {
  const indexOf = (id: Id): number => rules.findIndex(rule => rule.id === id);
  if (precedence.some(edge => indexOf(edge.before) < 0 || indexOf(edge.after) < 0)) return Object.freeze({ kind: 'invalid', reason: 'precedence_rule_missing' });
  return precedence.some(edge => indexOf(edge.before) >= indexOf(edge.after))
    ? Object.freeze({ kind: 'invalid', reason: 'precedence_order_mismatch' }) : Object.freeze({ kind: 'verified' });
};

export const astClassificationRuleAlgebra: AstClassificationRuleAlgebraInterface = Object.freeze({ resolveFirst, verifyProof, verifyJudgment, verifyPrecedence });
