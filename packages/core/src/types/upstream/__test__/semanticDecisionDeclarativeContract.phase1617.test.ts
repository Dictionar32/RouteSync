import { describe, expect, it } from 'vitest';
import type {
  SemanticDecisionAtom,
  SemanticDecisionAuthorityAssessment,
  SemanticDecisionAuthorityInterface,
  SemanticDecisionEvidencePacket,
  SemanticDecisionInterface,
  SemanticDecisionPolicyContract,
  SemanticDecisionRuleAtom,
  SemanticDecisionTerm,
  SemanticDecisionVariableTerm,
} from '../semanticDecisionInterface';

type Relation = 'candidate' | 'classifies_as';
type RuleId = 'expression.single';
type TermValue = string;

const term = (identity: string, value: TermValue): SemanticDecisionTerm<TermValue> => Object.freeze({
  kind: 'semantic_decision_term',
  identity,
  value,
});

const variable = (name: string): SemanticDecisionVariableTerm => Object.freeze({
  kind: 'semantic_decision_variable',
  name,
});

const candidate: SemanticDecisionAtom<Relation, TermValue> = Object.freeze({
  kind: 'semantic_decision_atom',
  relation: 'candidate',
  subject: term('token:variable', 'variable'),
  object: term('token:single', 'single'),
});

const candidatePattern: SemanticDecisionRuleAtom<Relation, TermValue> = Object.freeze({
  kind: 'semantic_decision_rule_atom',
  relation: 'candidate',
  subject: variable('candidateName'),
  object: term('token:single', 'single'),
});

const conclusionPattern: SemanticDecisionRuleAtom<Relation, TermValue> = Object.freeze({
  kind: 'semantic_decision_rule_atom',
  relation: 'classifies_as',
  subject: variable('candidateName'),
  object: term('token:identifier', 'identifier'),
});

const relationVocabulary: readonly Relation[] = Object.freeze(['candidate', 'classifies_as']);

const policy: SemanticDecisionPolicyContract<RuleId, Relation, TermValue> = Object.freeze({
  kind: 'semantic_decision_policy_contract',
  authority: 'upstream',
  identity: 'php.expression.classification',
  revision: '1',
  ruleSetIdentity: 'ruleset:php.expression.classification:1',
  closed: true,
  selection: 'first_proven_by_precedence',
  rules: Object.freeze([Object.freeze({
    id: 'expression.single',
    premises: Object.freeze([candidatePattern]),
    conclusions: Object.freeze([conclusionPattern]),
  })]),
  precedence: Object.freeze([]),
  relationVocabulary,
  matching: Object.freeze({
    kind: 'structural_unification',
    variableScope: 'per_rule_application',
    repeatedVariableBinding: 'same_term_identity',
    conclusionVariables: 'must_be_bound_by_premises',
    termIdentity: 'canonical_stable_identity',
  }),
  proofPolicy: Object.freeze({
    bindSourceSnapshot: true,
    bindEvidenceFactSetIdentity: true,
    bindRuleSetIdentity: true,
    recordEveryRuleBeforeSelection: true,
    recordPremiseWitnesses: true,
    recordVariableSubstitutions: true,
    rejectUnknownRelations: true,
    rejectUnboundConclusionVariables: true,
    rejectConflictingTermIdentities: true,
  }),
});

const packet: SemanticDecisionEvidencePacket<Relation, TermValue> = Object.freeze({
  kind: 'semantic_decision_evidence_packet',
  sourceIdentity: 'php-source:controller.php',
  snapshotIdentity: 'snapshot:sha256:controller-v1',
  factSetIdentity: 'facts:sha256:candidate-single-v1',
  facts: Object.freeze([candidate]),
});

describe('declarative semantic decision contract', () => {
  it('represents policy and evidence without executable rule callbacks', () => {
    expect(policy.rules[0].premises).toEqual([candidatePattern]);
    expect(packet.facts).toEqual([candidate]);
    expect('applies' in policy.rules[0]).toBe(false);
    expect('derive' in policy.rules[0]).toBe(false);
    expect(policy.matching.repeatedVariableBinding).toBe('same_term_identity');
  });

  it('requires authority assessment verification to be part of the contract', () => {
    const rejected: SemanticDecisionAuthorityAssessment<RuleId, Relation, TermValue> = {
      kind: 'decision_contract_rejected',
      reason: 'invalid_contract_identity',
      sourceIdentity: packet.sourceIdentity,
      snapshotIdentity: packet.snapshotIdentity,
      closed: true,
    };
    const authority: SemanticDecisionAuthorityInterface<RuleId, Relation, TermValue> = {
      evaluate: () => rejected,
      verifyAssessment: (contract, evidence, assessment) =>
        contract.identity === policy.identity
        && evidence.factSetIdentity === packet.factSetIdentity
        && assessment.kind === 'decision_contract_rejected'
          ? { kind: 'valid' }
          : { kind: 'invalid', reason: 'contract_identity_mismatch' },
    };
    const canonicalInterface: SemanticDecisionInterface<RuleId, Relation, TermValue> = authority;
    const result = canonicalInterface.evaluate(policy, packet);
    expect(result.kind).toBe('decision_contract_rejected');
    expect(canonicalInterface.verifyAssessment(policy, packet, result)).toEqual({ kind: 'valid' });
    expect('resolve' in canonicalInterface).toBe(false);
  });
});
