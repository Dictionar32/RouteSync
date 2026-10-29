/** Generic declarative rule-resolution algebra. It owns precedence validation, not domain-specific semantics. */
import type { SemanticDecisionContract, SemanticDecisionInterface, SemanticDecisionJudgment, SemanticDecisionProof, SemanticDecisionRule, SemanticDecisionProofVerification } from './semanticDecisionInterface';

const validate = <Input, Output, Id extends symbol>(
  contract: SemanticDecisionContract<Input, Output, Id>,
): SemanticDecisionJudgment<Id, Output> | undefined => {
  if (contract.selection !== 'first_proven_by_precedence') return { kind: 'contract_violation', reason: 'unsupported_selection_policy' };
  const ids = new Set<symbol>();
  for (const rule of contract.rules) {
    if (typeof rule.applies !== 'function' || typeof rule.derive !== 'function') return { kind: 'contract_violation', reason: 'invalid_rule_contract' };
    if (ids.has(rule.id)) return { kind: 'contract_violation', reason: 'duplicate_rule_id' };
    ids.add(rule.id);
  }
  const edges = new Map<symbol, Set<symbol>>();
  const incoming = new Map<symbol, Set<symbol>>([...ids].map(id => [id, new Set<symbol>()]));
  for (const relation of contract.precedence) {
    if (!ids.has(relation.before) || !ids.has(relation.after) || relation.before === relation.after) return { kind: 'contract_violation', reason: 'invalid_precedence_relation' };
    const successors = edges.get(relation.before) ?? new Set<symbol>();
    if (successors.has(relation.after)) return { kind: 'contract_violation', reason: 'invalid_precedence_relation' };
    successors.add(relation.after);
    edges.set(relation.before, successors);
    incoming.get(relation.after)?.add(relation.before);
  }
  const remaining = new Set(ids);
  while (remaining.size > 0) {
    const ready = [...remaining].filter(id => [...(incoming.get(id) ?? [])].every(predecessor => !remaining.has(predecessor)));
    if (ready.length !== 1) return { kind: 'contract_violation', reason: 'ambiguous_precedence' };
    const next = ready[0];
    if (next === undefined) return { kind: 'contract_violation', reason: 'ambiguous_precedence' };
    remaining.delete(next);
  }
  return undefined;
};

const orderedRules = <Input, Output, Id extends symbol>(contract: SemanticDecisionContract<Input, Output, Id>): readonly SemanticDecisionRule<Input, Output, Id>[] => {
  const remaining = new Set(contract.rules);
  const result: SemanticDecisionRule<Input, Output, Id>[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining].filter(rule => contract.precedence.every(relation => relation.after !== rule.id || ![...remaining].some(candidate => candidate.id === relation.before)));
    const next = ready[0];
    if (next === undefined) return [];
    result.push(next);
    remaining.delete(next);
  }
  return result;
};

const proof = <Id extends symbol>(
  selection: SemanticDecisionProof<Id>['selection'],
  evaluated: SemanticDecisionProof<Id>['evaluated'],
  orderedRuleIds: readonly Id[],
  precedence: SemanticDecisionProof<Id>['precedence'],
  termination: SemanticDecisionProof<Id>['termination'],
): SemanticDecisionProof<Id> => Object.freeze({
  kind: 'semantic_decision_proof',
  selection,
  orderedRuleIds: Object.freeze([...orderedRuleIds]),
  precedence: Object.freeze(precedence.map(relation => Object.freeze({ ...relation }))),
  evaluated: Object.freeze([...evaluated]),
  ruleCount: orderedRuleIds.length,
  termination,
  complete: true,
});

const resolve = <Input, Output, Id extends symbol>(
  contract: SemanticDecisionContract<Input, Output, Id>,
  input: Input,
): SemanticDecisionJudgment<Id, Output> => {
  const invalid = validate(contract);
  if (invalid !== undefined) return invalid;
  const rules = orderedRules(contract);
  const evaluated: SemanticDecisionProof<Id>['evaluated'][number][] = [];
  for (const [ordinal, rule] of rules.entries()) {
    const applicable = relationOptionFold(rule.applies(input), () => false, () => true);
    if (!applicable) {
      evaluated.push(Object.freeze({ rule: rule.id, ordinal, applicability: 'not_applicable' as const, derivation: 'not_attempted' as const }));
      continue;
    }
    const result = rule.derive(input);
    if (result.kind === 'none') {
      evaluated.push(Object.freeze({ rule: rule.id, ordinal, applicability: 'applicable' as const, derivation: 'no_result' as const }));
      continue;
    }
    evaluated.push(Object.freeze({ rule: rule.id, ordinal, applicability: 'applicable' as const, derivation: 'selected' as const }));
    return Object.freeze({ kind: 'derived', rule: rule.id, value: result.value, proof: proof(contract.selection, evaluated, rules.map(candidate => candidate.id), contract.precedence, 'selected') });
  }
  return Object.freeze({ kind: 'not_derived', proof: proof(contract.selection, evaluated, rules.map(candidate => candidate.id), contract.precedence, 'exhausted') });
};


const verifyProof = <Input, Output, Id extends symbol>(
  contract: SemanticDecisionContract<Input, Output, Id>,
  judgment: SemanticDecisionJudgment<Id, Output>,
): SemanticDecisionProofVerification => {
  if (judgment.kind === 'contract_violation') return { kind: 'invalid', reason: 'judgment_has_no_proof' };
  const invalid = validate(contract);
  if (invalid !== undefined) return { kind: 'invalid', reason: 'rule_order_mismatch' };
  const rules = orderedRules(contract);
  const proofValue = judgment.proof;
  if (proofValue.orderedRuleIds.length !== rules.length || proofValue.orderedRuleIds.some((id, index) => id !== rules[index]?.id)) {
    return { kind: 'invalid', reason: 'rule_order_mismatch' };
  }
  if (proofValue.precedence.length !== contract.precedence.length || proofValue.precedence.some(edge => !contract.precedence.some(candidate => candidate.before === edge.before && candidate.after === edge.after))) {
    return { kind: 'invalid', reason: 'precedence_snapshot_mismatch' };
  }
  if (proofValue.ruleCount !== rules.length || proofValue.complete !== true || proofValue.evaluated.some((receipt, index) =>
    receipt.ordinal !== index
    || receipt.rule !== proofValue.orderedRuleIds[index]
    || (receipt.applicability === 'not_applicable' && receipt.derivation !== 'not_attempted')
    || (receipt.applicability === 'applicable' && receipt.derivation === 'not_attempted')
  )) {
    return { kind: 'invalid', reason: 'invalid_receipt_prefix' };
  }
  const selectedReceipts = proofValue.evaluated.filter(receipt => receipt.derivation === 'selected');
  if (judgment.kind === 'derived') {
    const last = proofValue.evaluated[proofValue.evaluated.length - 1];
    if (proofValue.termination !== 'selected' || selectedReceipts.length !== 1 || last?.derivation !== 'selected' || last.rule !== judgment.rule || last.applicability !== 'applicable') {
      return { kind: 'invalid', reason: 'invalid_termination' };
    }
  } else if (proofValue.termination !== 'exhausted' || proofValue.evaluated.length !== rules.length || selectedReceipts.length !== 0) {
    return { kind: 'invalid', reason: 'invalid_termination' };
  }
  return { kind: 'valid' };
};

export const semanticDecisionAlgebra: SemanticDecisionInterface = Object.freeze({ resolve, verifyProof });
