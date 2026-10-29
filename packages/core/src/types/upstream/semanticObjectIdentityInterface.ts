/** Canonical typed contract for PHP semantic object identity and alias evidence. */
import { semanticKnowledgeIdOperations } from './semanticDataflowKnowledge';
import { semanticModRefFactOperations, type SemanticModRefBlocker } from './semanticModRefFactOperations';
import type { KnowledgeId, KnowledgeIdEquality, SemanticKnowledgeDataFlow, SemanticPresence, SemanticAliasKind, SemanticModRefKind, SemanticModRefRelation } from './semanticDataflowKnowledge';

export type { SemanticAliasKind, SemanticModRefKind, SemanticModRefRelation } from './semanticDataflowKnowledge';
export type SemanticKnowledgeIdPair = readonly [KnowledgeId, KnowledgeId];
export type SemanticKnowledgeIdPairEquality =
  | Readonly<{ readonly kind: 'same_semantic_object_pair' }>
  | Readonly<{ readonly kind: 'different_semantic_object_pair' }>;

export type SemanticKnowledgeIdMembership =
  | Readonly<{ readonly kind: 'knowledge_id_present'; readonly value: KnowledgeId }>
  | Readonly<{ readonly kind: 'knowledge_id_absent' }>;

export type SemanticAliasPairMembership =
  | Readonly<{ readonly kind: 'semantic_alias_pair_present'; readonly relation: SemanticAliasRelation }>
  | Readonly<{ readonly kind: 'semantic_alias_pair_absent' }>;

export type SemanticIdentityLinkPremises = readonly Extract<SemanticObjectIdentityProofFact, { readonly kind: 'identity_link' }>[];

/** Typed rule vocabulary owned by object identity, not a generic relation solver. */
export type SemanticObjectIdentityRuleId =
  | 'assignment-reference:by-reference'
  | 'may-alias:symmetric-left'
  | 'may-alias:symmetric-right'
  | 'same-identity:must-alias'
  | 'identity-link:may-alias';

export type SemanticObjectIdentityProofFact =
  | Readonly<{
      readonly kind: 'assignment_reference';
      readonly assignment: KnowledgeId;
      readonly left: KnowledgeId;
      readonly right: KnowledgeId;
      readonly source: import('./semanticDataflowKnowledge').SemanticSource;
    }>
  | Readonly<{
      readonly kind: 'may_alias';
      readonly left: KnowledgeId;
      readonly right: KnowledgeId;
      readonly evidence: readonly KnowledgeId[];
    }>
  | Readonly<{
      readonly kind: 'identity_link';
      readonly left: KnowledgeId;
      readonly right: KnowledgeId;
      readonly evidence: readonly KnowledgeId[];
    }>
  | Readonly<{
      readonly kind: 'same_identity';
      readonly left: KnowledgeId;
      readonly right: KnowledgeId;
    }>
  | Readonly<{
      readonly kind: 'alias_answer';
      readonly left: KnowledgeId;
      readonly right: KnowledgeId;
      readonly value: Exclude<SemanticAliasKind, 'no-alias'>;
    }>;

export interface SemanticObjectIdentityProofDerivation {
  readonly ruleId: SemanticObjectIdentityRuleId;
  readonly premises: readonly SemanticObjectIdentityProofFact[];
  readonly conclusion: SemanticObjectIdentityProofFact;
}

/** Finite domain evidence closes directly; it does not depend on a string-atom solver. */
export interface SemanticObjectIdentityProof {
  readonly kind: 'semantic_object_identity_proof';
  readonly status: 'closed';
  readonly closure: 'finite_domain_evidence';
  readonly facts: readonly SemanticObjectIdentityProofFact[];
  readonly derivations: readonly SemanticObjectIdentityProofDerivation[];
}

export interface SemanticAliasRelation {
  readonly left: KnowledgeId;
  readonly right: KnowledgeId;
  readonly kind: SemanticAliasKind;
  readonly evidence: readonly KnowledgeId[];
}

export interface SemanticObjectIdentity {
  readonly object: KnowledgeId;
  readonly aliases: readonly KnowledgeId[];
}

/** Source-backed reasons why a known fact cannot yet be projected into a mod/ref relation. */
export type { SemanticModRefBlocker } from './semanticModRefFactOperations';

/** An empty relation list is not evidence that mod/ref analysis is complete. */
export type SemanticModRefAnalysis =
  | Readonly<{
      readonly kind: 'mod_ref_evidence_not_derived';
      readonly reason: 'mod_ref_domain_rules_not_implemented';
      readonly relations: readonly [];
      readonly blockers: readonly SemanticModRefBlocker[];
    }>
  | Readonly<{
      readonly kind: 'mod_ref_evidence_partially_derived';
      readonly relations: readonly SemanticModRefRelation[];
      readonly blockers: readonly SemanticModRefBlocker[];
    }>
  | Readonly<{
      readonly kind: 'mod_ref_evidence_derived';
      readonly relations: readonly SemanticModRefRelation[];
    }>;

export interface SemanticObjectIdentityAnalysis {
  readonly status: 'closed';
  readonly identities: readonly SemanticObjectIdentity[];
  readonly aliases: readonly SemanticAliasRelation[];
  readonly modRefs: SemanticModRefAnalysis;
  readonly proof: SemanticObjectIdentityProof;
}

export interface SemanticAliasAssessment {
  readonly status: 'resolved';
  readonly value: SemanticPresence<Exclude<SemanticAliasKind, 'no-alias'>>;
  readonly proof: SemanticObjectIdentityProof;
}

/** Domain operations expose identity comparisons and the finite-evidence continuation. */
export interface SemanticObjectIdentityOperationsInterface {
  readonly same: (left: KnowledgeId, right: KnowledgeId) => KnowledgeIdEquality;
  readonly sameOrderedPair: (left: SemanticKnowledgeIdPair, right: SemanticKnowledgeIdPair) => SemanticKnowledgeIdPairEquality;
  readonly sameUnorderedPair: (left: SemanticKnowledgeIdPair, right: SemanticKnowledgeIdPair) => SemanticKnowledgeIdPairEquality;
  readonly membership: (values: readonly KnowledgeId[], candidate: KnowledgeId) => SemanticKnowledgeIdMembership;
  readonly aliasPairMembership: (relations: readonly SemanticAliasRelation[], pair: SemanticKnowledgeIdPair) => SemanticAliasPairMembership;
  readonly identityLinkPremises: (proof: SemanticObjectIdentityProof, pair: SemanticKnowledgeIdPair) => SemanticIdentityLinkPremises;
  readonly modRefEvidence: (model: SemanticKnowledgeDataFlow) => SemanticModRefAnalysis;
}



const sameOrderedPairOperation: SemanticObjectIdentityOperationsInterface['sameOrderedPair'] = (
  left: SemanticKnowledgeIdPair,
  right: SemanticKnowledgeIdPair,
): SemanticKnowledgeIdPairEquality => {
  const leftEquality = semanticKnowledgeIdOperations.same(left[0], right[0]);
  const rightEquality = semanticKnowledgeIdOperations.same(left[1], right[1]);
  let result: SemanticKnowledgeIdPairEquality = Object.freeze({ kind: 'different_semantic_object_pair' });
  Object.is(leftEquality.kind, 'same_knowledge_id') && Object.is(rightEquality.kind, 'same_knowledge_id') &&
    (result = Object.freeze({ kind: 'same_semantic_object_pair' }));
  return result;
};

const sameUnorderedPairOperation: SemanticObjectIdentityOperationsInterface['sameUnorderedPair'] = (
  left: SemanticKnowledgeIdPair,
  right: SemanticKnowledgeIdPair,
): SemanticKnowledgeIdPairEquality => {
  const ordered = sameOrderedPairOperation(left, right);
  const reversed = sameOrderedPairOperation(left, [right[1], right[0]]);
  let result: SemanticKnowledgeIdPairEquality = Object.freeze({ kind: 'different_semantic_object_pair' });
  (Object.is(ordered.kind, 'same_semantic_object_pair') || Object.is(reversed.kind, 'same_semantic_object_pair')) &&
    (result = Object.freeze({ kind: 'same_semantic_object_pair' }));
  return result;
};

const knowledgeIdMembership: SemanticObjectIdentityOperationsInterface['membership'] = (
  values: readonly KnowledgeId[],
  candidate: KnowledgeId,
): SemanticKnowledgeIdMembership => {
  let result: SemanticKnowledgeIdMembership = Object.freeze({ kind: 'knowledge_id_absent' });
  values.forEach(value => Object.is(semanticKnowledgeIdOperations.same(value, candidate).kind, 'same_knowledge_id') &&
    Object.is(result.kind, 'knowledge_id_absent') && (result = Object.freeze({ kind: 'knowledge_id_present', value })));
  return result;
};

const aliasPairMembership: SemanticObjectIdentityOperationsInterface['aliasPairMembership'] = (
  relations: readonly SemanticAliasRelation[],
  pair: SemanticKnowledgeIdPair,
): SemanticAliasPairMembership => {
  let result: SemanticAliasPairMembership = Object.freeze({ kind: 'semantic_alias_pair_absent' });
  relations.forEach(relation => Object.is(sameUnorderedPairOperation([relation.left, relation.right], pair).kind, 'same_semantic_object_pair') &&
    Object.is(result.kind, 'semantic_alias_pair_absent') && (result = Object.freeze({ kind: 'semantic_alias_pair_present', relation })));
  return result;
};

const identityLinkPremises: SemanticObjectIdentityOperationsInterface['identityLinkPremises'] = (
  proof: SemanticObjectIdentityProof,
  pair: SemanticKnowledgeIdPair,
): SemanticIdentityLinkPremises => {
  const premises: Extract<SemanticObjectIdentityProofFact, { readonly kind: 'identity_link' }>[] = [];
  proof.facts.forEach(fact => {
    switch (fact.kind) {
      case 'identity_link':
        Object.is(sameUnorderedPairOperation([fact.left, fact.right], pair).kind, 'same_semantic_object_pair') && premises.push(fact);
        break;
      default:
        break;
    }
  });
  return Object.freeze(premises);
};

const modRefEvidenceNotDerived: SemanticObjectIdentityOperationsInterface['modRefEvidence'] = (
  model: SemanticKnowledgeDataFlow,
): SemanticModRefAnalysis => {
  const blockers = semanticModRefFactOperations.blockers(model.modRefFacts);
  const relations = model.modRefRelations;
  return blockers.length === 0
    ? Object.freeze({ kind: 'mod_ref_evidence_derived', relations })
    : relations.length === 0
      ? Object.freeze({ kind: 'mod_ref_evidence_not_derived', reason: 'mod_ref_domain_rules_not_implemented', relations: Object.freeze([]) as readonly [], blockers })
      : Object.freeze({ kind: 'mod_ref_evidence_partially_derived', relations, blockers });
};

export const semanticObjectIdentityOperations: SemanticObjectIdentityOperationsInterface = Object.freeze({
  same: semanticKnowledgeIdOperations.same,
  sameOrderedPair: sameOrderedPairOperation,
  sameUnorderedPair: sameUnorderedPairOperation,
  membership: knowledgeIdMembership,
  aliasPairMembership,
  identityLinkPremises,
  modRefEvidence: modRefEvidenceNotDerived,
});

export interface SemanticObjectIdentityAuthorityInterface {
  readonly kind: 'semantic_object_identity_authority';
  readonly analyze: (model: SemanticKnowledgeDataFlow) => SemanticObjectIdentityAnalysis;
  readonly alias: (analysis: SemanticObjectIdentityAnalysis, left: KnowledgeId, right: KnowledgeId) => SemanticAliasAssessment;
}

export interface SemanticObjectIdentityAnalysisOperationInterface {
  readonly execute: (model: SemanticKnowledgeDataFlow) => SemanticObjectIdentityAnalysis;
}

export interface SemanticAliasAssessmentOperationInterface {
  readonly execute: (analysis: SemanticObjectIdentityAnalysis, left: KnowledgeId, right: KnowledgeId) => SemanticAliasAssessment;
}
