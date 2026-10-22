import type { RelationOption } from '../../semantic/relations/relationalSequence';

/**
 * Declarative semantic-decision contract.
 *
 * Rules are data, not executable callbacks. Ground terms carry canonical
 * identities; rule variables are explicit patterns. The authority contract
 * must unify patterns, produce a complete witness ledger, and bind the proof
 * to the exact policy, rule set, evidence packet, and source snapshot.
 */
export type SemanticDecisionTerm<Value = string> = Readonly<{
  readonly kind: 'semantic_decision_term';
  /** Stable canonical identity; equal identities must denote equal values. */
  readonly identity: string;
  readonly value: Value;
}>;

export type SemanticDecisionVariableTerm<Name extends string = string> = Readonly<{
  readonly kind: 'semantic_decision_variable';
  readonly name: Name;
}>;

export type SemanticDecisionPatternTerm<Value = string> =
  | SemanticDecisionTerm<Value>
  | SemanticDecisionVariableTerm;

/** A ground fact: variables are not admissible in source evidence or conclusions. */
export type SemanticDecisionAtom<Relation extends string = string, Term = string> = Readonly<{
  readonly kind: 'semantic_decision_atom';
  readonly relation: Relation;
  readonly subject: SemanticDecisionTerm<Term>;
  readonly object: SemanticDecisionTerm<Term>;
}>;

/** A rule atom may contain named variables which are unified per application. */
export type SemanticDecisionRuleAtom<Relation extends string = string, Term = string> = Readonly<{
  readonly kind: 'semantic_decision_rule_atom';
  readonly relation: Relation;
  readonly subject: SemanticDecisionPatternTerm<Term>;
  readonly object: SemanticDecisionPatternTerm<Term>;
}>;

export type SemanticDecisionRuleDefinition<
  Id extends string,
  Relation extends string,
  Term = string,
> = Readonly<{
  readonly id: Id;
  readonly premises: readonly SemanticDecisionRuleAtom<Relation, Term>[];
  readonly conclusions: readonly SemanticDecisionRuleAtom<Relation, Term>[];
}>;

export type SemanticDecisionPolicyContract<
  Id extends string,
  Relation extends string,
  Term = string,
> = Readonly<{
  readonly kind: 'semantic_decision_policy_contract';
  readonly authority: 'upstream';
  readonly identity: string;
  readonly revision: string;
  /** Canonical identity of the complete ordered rule set, not just its label. */
  readonly ruleSetIdentity: string;
  readonly closed: true;
  readonly selection: SemanticDecisionSelectionPolicy;
  readonly rules: readonly SemanticDecisionRuleDefinition<Id, Relation, Term>[];
  /** A total, acyclic order over exactly the declared rule identities. */
  readonly precedence: readonly SemanticDecisionPrecedence<Id>[];
  readonly relationVocabulary: readonly Relation[];
  readonly matching: Readonly<{
    readonly kind: 'structural_unification';
    readonly variableScope: 'per_rule_application';
    readonly repeatedVariableBinding: 'same_term_identity';
    readonly conclusionVariables: 'must_be_bound_by_premises';
    readonly termIdentity: 'canonical_stable_identity';
  }>;
  readonly proofPolicy: Readonly<{
    readonly bindSourceSnapshot: true;
    readonly bindEvidenceFactSetIdentity: true;
    readonly bindRuleSetIdentity: true;
    readonly recordEveryRuleBeforeSelection: true;
    readonly recordPremiseWitnesses: true;
    readonly recordVariableSubstitutions: true;
    readonly rejectUnknownRelations: true;
    readonly rejectUnboundConclusionVariables: true;
    readonly rejectConflictingTermIdentities: true;
  }>;
}>;

export type SemanticDecisionEvidencePacket<Relation extends string, Term = string> = Readonly<{
  readonly kind: 'semantic_decision_evidence_packet';
  readonly sourceIdentity: string;
  /** Stable identity of the exact source snapshot; source identity alone is insufficient. */
  readonly snapshotIdentity: string;
  /** Canonical identity of the complete fact set in this packet. */
  readonly factSetIdentity: string;
  readonly facts: readonly SemanticDecisionAtom<Relation, Term>[];
}>;

export type SemanticDecisionSubstitutionEntry<Term = string> = Readonly<{
  readonly variable: string;
  readonly term: SemanticDecisionTerm<Term>;
}>;

export type SemanticDecisionPremiseWitness<Relation extends string, Term = string> = Readonly<{
  readonly premiseIndex: number;
  readonly rulePremise: SemanticDecisionRuleAtom<Relation, Term>;
  readonly evidence: SemanticDecisionAtom<Relation, Term>;
  /** Binding computed from this exact premise/evidence pair. */
  readonly substitution: readonly SemanticDecisionSubstitutionEntry<Term>[];
}>;

export type SemanticDecisionAuthorityRuleReceipt<
  Id extends string,
  Relation extends string,
  Term = string,
> = Readonly<{
  readonly rule: Id;
  readonly ordinal: number;
  readonly substitution: readonly SemanticDecisionSubstitutionEntry<Term>[];
  readonly premiseWitnesses: readonly SemanticDecisionPremiseWitness<Relation, Term>[];
  readonly derivedConclusions: readonly SemanticDecisionAtom<Relation, Term>[];
  readonly outcome: 'not_applicable' | 'applicable_without_conclusion' | 'derived';
}>;

export type SemanticDecisionAuthorityProof<Id extends string, Relation extends string, Term = string> = Readonly<{
  readonly kind: 'semantic_decision_proof';
  readonly contractIdentity: string;
  readonly contractRevision: string;
  readonly ruleSetIdentity: string;
  readonly sourceIdentity: string;
  readonly snapshotIdentity: string;
  readonly factSetIdentity: string;
  readonly selection: SemanticDecisionSelectionPolicy;
  readonly orderedRuleIds: readonly Id[];
  readonly precedence: readonly SemanticDecisionPrecedence<Id>[];
  /** One receipt per evaluated rule in the canonical order, including non-matches. */
  readonly receipts: readonly SemanticDecisionAuthorityRuleReceipt<Id, Relation, Term>[];
  readonly termination:
    | 'selected_by_precedence'
    | 'all_rules_exhausted'
    | 'conflicting_conclusions'
    | 'evidence_incomplete'
    | 'authority_budget_exhausted';
  readonly complete: boolean;
}>;

/**
 * Closed outcomes preserve policy, source snapshot, fact-set identity and proof
 * as one value. Consumers must not reconstruct a decision from loose fields.
 */
export type SemanticDecisionAuthorityAssessment<Id extends string, Relation extends string, Term = string> =
  | Readonly<{
      readonly kind: 'decision_derived';
      readonly conclusion: SemanticDecisionAtom<Relation, Term>;
      readonly proof: SemanticDecisionAuthorityProof<Id, Relation, Term> & Readonly<{ readonly termination: 'selected_by_precedence'; readonly complete: true }>;
    }>
  | Readonly<{
      readonly kind: 'decision_not_derived';
      readonly proof: SemanticDecisionAuthorityProof<Id, Relation, Term> & Readonly<{ readonly termination: 'all_rules_exhausted'; readonly complete: true }>;
    }>
  | Readonly<{
      readonly kind: 'decision_conflict';
      readonly competingConclusions: readonly SemanticDecisionAtom<Relation, Term>[];
      readonly proof: SemanticDecisionAuthorityProof<Id, Relation, Term> & Readonly<{ readonly termination: 'conflicting_conclusions'; readonly complete: true }>;
    }>
  | Readonly<{
      readonly kind: 'decision_incomplete';
      readonly reason: 'evidence_incomplete' | 'authority_budget_exhausted';
      readonly proof: SemanticDecisionAuthorityProof<Id, Relation, Term> & Readonly<{ readonly complete: false }>;
    }>
  | Readonly<{
      readonly kind: 'decision_contract_rejected';
      readonly reason:
        | 'duplicate_rule_id'
        | 'invalid_precedence_relation'
        | 'ambiguous_precedence'
        | 'incomplete_precedence'
        | 'unknown_relation'
        | 'invalid_contract_identity'
        | 'invalid_rule_set_identity'
        | 'invalid_evidence_binding'
        | 'invalid_fact_set_identity'
        | 'term_identity_collision'
        | 'unbound_conclusion_variable'
        | 'variable_binding_conflict';
      readonly sourceIdentity: string;
      readonly snapshotIdentity: string;
      readonly closed: true;
    }>;

export type SemanticDecisionAuthorityProofVerification =
  | Readonly<{ readonly kind: 'valid' }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly reason:
        | 'contract_identity_mismatch'
        | 'rule_set_identity_mismatch'
        | 'source_snapshot_mismatch'
        | 'fact_set_identity_mismatch'
        | 'rule_order_mismatch'
        | 'precedence_snapshot_mismatch'
        | 'receipt_ledger_incomplete'
        | 'premise_witness_mismatch'
        | 'substitution_mismatch'
        | 'conclusion_not_entitled'
        | 'invalid_termination'
        | 'judgment_has_no_proof';
    }>;

/**
 * Contract-only authority boundary. Implementations must enforce all policy
 * obligations, validate each substitution and premise witness, ensure all
 * rule receipts are complete through the selected precedence prefix, and bind
 * the outcome to the exact rule set and evidence fact set.
 *
 * verifyAssessment must verify the supplied proof without rerunning executable
 * rule callbacks or trusting claims inside the assessment itself.
 */
export interface SemanticDecisionInterface<Id extends string, Relation extends string, Term = string> {
  readonly evaluate: (
    contract: SemanticDecisionPolicyContract<Id, Relation, Term>,
    packet: SemanticDecisionEvidencePacket<Relation, Term>,
  ) => SemanticDecisionAuthorityAssessment<Id, Relation, Term>;
  readonly verifyAssessment: (
    contract: SemanticDecisionPolicyContract<Id, Relation, Term>,
    packet: SemanticDecisionEvidencePacket<Relation, Term>,
    assessment: SemanticDecisionAuthorityAssessment<Id, Relation, Term>,
  ) => SemanticDecisionAuthorityProofVerification;
}

/** Explicit name for code that depends on the semantic-decision authority boundary. */
export type SemanticDecisionAuthorityInterface<Id extends string, Relation extends string, Term = string> =
  SemanticDecisionInterface<Id, Relation, Term>;

/** @deprecated Executable compatibility adapter. New semantic policy definitions must use SemanticDecisionPolicyContract. */
export type SemanticDecisionRule<Input, Output, Id extends symbol = symbol> = Readonly<{
  readonly id: Id;
  readonly applies: (input: Input) => RelationOption<true>;
  readonly derive: (input: Input) => RelationOption<Output>;
}>;

export type SemanticDecisionPrecedence<Id extends string | symbol> = Readonly<{
  readonly before: Id;
  readonly after: Id;
}>;

/** The selection law is part of the contract; rule-array order is never semantic authority. */
export type SemanticDecisionSelectionPolicy = 'first_proven_by_precedence';

/** @deprecated Callback-bound runtime adapter; not the declarative semantic policy contract. */
export type SemanticDecisionContract<Input, Output, Id extends symbol = symbol> = Readonly<{
  readonly kind: 'semantic_decision_contract';
  readonly authority: 'upstream';
  readonly closed: true;
  readonly selection: SemanticDecisionSelectionPolicy;
  readonly rules: readonly SemanticDecisionRule<Input, Output, Id>[];
  /** Must define one total acyclic order over the declared rule identities. */
  readonly precedence: readonly SemanticDecisionPrecedence<Id>[];
}>;

export type SemanticDecisionRuleReceipt<Id extends symbol> = Readonly<{
  readonly rule: Id;
  readonly ordinal: number;
  readonly applicability: 'not_applicable' | 'applicable';
  readonly derivation: 'not_attempted' | 'no_result' | 'selected';
}>;

/** Proof records the exact precedence prefix needed to justify the decision. */
export type SemanticDecisionProof<Id extends symbol> = Readonly<{
  readonly kind: 'semantic_decision_proof';
  readonly selection: SemanticDecisionSelectionPolicy;
  /** Complete canonical rule order, so a consumer can verify the evaluated prefix without re-running rules. */
  readonly orderedRuleIds: readonly Id[];
  /** Snapshot of the precedence relation that justified orderedRuleIds. */
  readonly precedence: readonly SemanticDecisionPrecedence<Id>[];
  readonly evaluated: readonly SemanticDecisionRuleReceipt<Id>[];
  readonly ruleCount: number;
  readonly termination: 'selected' | 'exhausted';
  readonly complete: true;
}>;

export type SemanticDecisionJudgment<Id extends symbol, Output> =
  | Readonly<{ readonly kind: 'derived'; readonly rule: Id; readonly value: Output; readonly proof: SemanticDecisionProof<Id> }>
  | Readonly<{ readonly kind: 'not_derived'; readonly proof: SemanticDecisionProof<Id> }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'duplicate_rule_id' | 'invalid_precedence_relation' | 'ambiguous_precedence' | 'invalid_rule_contract' | 'unsupported_selection_policy' }>;

export type SemanticDecisionProofVerification =
  | Readonly<{ readonly kind: 'valid' }>
  | Readonly<{ readonly kind: 'invalid'; readonly reason: 'judgment_has_no_proof' | 'rule_order_mismatch' | 'precedence_snapshot_mismatch' | 'invalid_receipt_prefix' | 'invalid_termination' }>;

/**
 * @deprecated Callback-based compatibility boundary. Production consumers must
 * migrate to SemanticDecisionInterface's declarative policy/evidence contract.
 * This adapter must not be treated as the canonical semantic authority API.
 */
export interface SemanticDecisionCallbackCompatibilityInterface {
  readonly resolve: <Input, Output, Id extends symbol>(
    contract: SemanticDecisionContract<Input, Output, Id>,
    input: Input,
  ) => SemanticDecisionJudgment<Id, Output>;
  /** Verifies legacy callback proof shape without re-running callbacks. */
  readonly verifyProof: <Input, Output, Id extends symbol>(
    contract: SemanticDecisionContract<Input, Output, Id>,
    judgment: SemanticDecisionJudgment<Id, Output>,
  ) => SemanticDecisionProofVerification;
}
