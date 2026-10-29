/** Upstream domain authority for PHP object identity; no generic relation solver or string identity key. */
import {
  semanticAbsent,
  semanticKnowledgeIdOperations,
  semanticAssignmentReferenceFactOperations,
  semanticPresent,
  type KnowledgeId,
  type SemanticAssignment,
  type SemanticAssignmentReferenceIdentityBinding,
  type SemanticKnowledgeDataFlow,
  type SemanticPresence,
} from './semanticDataflowKnowledge';
import type {
  SemanticAliasAssessment,
  SemanticAliasKind,
  SemanticAliasRelation,
  SemanticObjectIdentity,
  SemanticObjectIdentityAnalysis,
  SemanticObjectIdentityAnalysisOperationInterface,
  SemanticObjectIdentityAuthorityInterface,
  SemanticObjectIdentityProof,
  SemanticObjectIdentityProofDerivation,
  SemanticObjectIdentityProofFact,
  SemanticObjectIdentityRuleId,
  SemanticAliasAssessmentOperationInterface,
  SemanticKnowledgeIdPair,
} from './semanticObjectIdentityInterface';
import { semanticObjectIdentityOperations } from './semanticObjectIdentityInterface';

type AssignmentReferenceFact = Extract<SemanticObjectIdentityProofFact, { readonly kind: 'assignment_reference' }>;
type MayAliasFact = Extract<SemanticObjectIdentityProofFact, { readonly kind: 'may_alias' }>;
type IdentityLinkFact = Extract<SemanticObjectIdentityProofFact, { readonly kind: 'identity_link' }>;
type SameIdentityFact = Extract<SemanticObjectIdentityProofFact, { readonly kind: 'same_identity' }>;
type AliasAnswerFact = Extract<SemanticObjectIdentityProofFact, { readonly kind: 'alias_answer' }>;

const isIdentityLinkFact = (fact: SemanticObjectIdentityProofFact): fact is IdentityLinkFact => Object.is(fact.kind, 'identity_link');
const samePair = (left: SemanticKnowledgeIdPair, right: SemanticKnowledgeIdPair): boolean =>
  Object.is(semanticObjectIdentityOperations.sameUnorderedPair(left, right).kind, 'same_semantic_object_pair');

const assignmentReferenceFact = (binding: SemanticAssignmentReferenceIdentityBinding): AssignmentReferenceFact => Object.freeze({
  kind: 'assignment_reference',
  assignment: binding.assignment,
  left: binding.left,
  right: binding.right,
  source: binding.source,
});

const mayAliasFact = (left: KnowledgeId, right: KnowledgeId, evidence: readonly KnowledgeId[]): MayAliasFact => Object.freeze({
  kind: 'may_alias',
  left,
  right,
  evidence: Object.freeze([...evidence]),
});

const identityLinkFact = (left: KnowledgeId, right: KnowledgeId, evidence: readonly KnowledgeId[]): IdentityLinkFact => Object.freeze({
  kind: 'identity_link',
  left,
  right,
  evidence: Object.freeze([...evidence]),
});

const sameIdentityFact = (left: KnowledgeId, right: KnowledgeId): SameIdentityFact => Object.freeze({ kind: 'same_identity', left, right });

const aliasAnswerFact = (left: KnowledgeId, right: KnowledgeId, value: Exclude<SemanticAliasKind, 'no-alias'>): AliasAnswerFact => Object.freeze({
  kind: 'alias_answer',
  left,
  right,
  value,
});

const derivation = (
  ruleId: SemanticObjectIdentityRuleId,
  premises: readonly SemanticObjectIdentityProofFact[],
  conclusion: SemanticObjectIdentityProofFact,
): SemanticObjectIdentityProofDerivation => Object.freeze({
  ruleId,
  premises: Object.freeze([...premises]),
  conclusion,
});

const distinctKnowledgeIds = (values: readonly KnowledgeId[]): readonly KnowledgeId[] => {
  const output: KnowledgeId[] = [];
  values.forEach(candidate => Object.is(semanticObjectIdentityOperations.membership(output, candidate).kind, 'knowledge_id_absent') && output.push(candidate));
  return Object.freeze(output);
};

const distinctAliasRelations = (relations: readonly SemanticAliasRelation[]): readonly SemanticAliasRelation[] => {
  const output: SemanticAliasRelation[] = [];
  relations.forEach(candidate => {
    let matched = false;
    const next: SemanticAliasRelation[] = [];
    output.forEach(existing => {
      const sameAliasPair = samePair([existing.left, existing.right], [candidate.left, candidate.right]);
      Object.is(sameAliasPair, true) && (matched = true) && next.push(Object.freeze({
        ...existing,
        evidence: Object.freeze([...existing.evidence, ...candidate.evidence]),
      }));
      Object.is(sameAliasPair, false) && next.push(existing);
    });
    Object.is(matched, false) && next.push(candidate);
    output.splice(0, output.length, ...next);
  });
  return Object.freeze(output);
};

const proofFromReferenceBindings = (bindings: readonly SemanticAssignmentReferenceIdentityBinding[]): SemanticObjectIdentityProof => {
  const facts: SemanticObjectIdentityProofFact[] = [];
  const derivations: SemanticObjectIdentityProofDerivation[] = [];
  bindings.forEach(binding => {
    const reference = assignmentReferenceFact(binding);
    const mayAlias = mayAliasFact(binding.left, binding.right, [binding.assignment]);
    const forward = identityLinkFact(binding.left, binding.right, [binding.assignment]);
    const reverse = identityLinkFact(binding.right, binding.left, [binding.assignment]);
    facts.push(reference, mayAlias, forward, reverse);
    derivations.push(
      derivation('assignment-reference:by-reference', [reference], mayAlias),
      derivation('may-alias:symmetric-left', [mayAlias], forward),
      derivation('may-alias:symmetric-right', [mayAlias], reverse),
      derivation('identity-link:may-alias', [forward], aliasAnswerFact(binding.left, binding.right, 'may-alias')),
      derivation('identity-link:may-alias', [reverse], aliasAnswerFact(binding.right, binding.left, 'may-alias')),
    );
  });
  return Object.freeze({
    kind: 'semantic_object_identity_proof',
    status: 'closed',
    closure: 'finite_domain_evidence',
    facts: Object.freeze(facts),
    derivations: Object.freeze(derivations),
  });
};

const aliasesFromReferenceBindings = (bindings: readonly SemanticAssignmentReferenceIdentityBinding[]): readonly SemanticAliasRelation[] => {
  const candidates: SemanticAliasRelation[] = [];
  bindings.forEach(binding => candidates.push(Object.freeze({
    left: binding.left,
    right: binding.right,
    kind: 'may-alias',
    evidence: Object.freeze([binding.assignment]),
  })));
  return distinctAliasRelations(candidates);
};

const identitiesFromAliases = (aliases: readonly SemanticAliasRelation[]): readonly SemanticObjectIdentity[] => {
  const objectCandidates: KnowledgeId[] = [];
  aliases.forEach(alias => objectCandidates.push(alias.left, alias.right));
  const objects = distinctKnowledgeIds(objectCandidates);
  const identities: SemanticObjectIdentity[] = [];
  objects.forEach(object => {
    const aliasCandidates: KnowledgeId[] = [];
    aliases.forEach(alias => {
      const leftMatches = Object.is(semanticKnowledgeIdOperations.same(alias.left, object).kind, 'same_knowledge_id');
      const rightMatches = Object.is(semanticKnowledgeIdOperations.same(alias.right, object).kind, 'same_knowledge_id');
      leftMatches && aliasCandidates.push(alias.right);
      rightMatches && aliasCandidates.push(alias.left);
    });
    identities.push(Object.freeze({ object, aliases: distinctKnowledgeIds(aliasCandidates) }));
  });
  return Object.freeze(identities);
};

const analyze: SemanticObjectIdentityAnalysisOperationInterface['execute'] = (model: SemanticKnowledgeDataFlow): SemanticObjectIdentityAnalysis => {
  const bindings = semanticAssignmentReferenceFactOperations.identityBindings(model.facts);
  const aliases = aliasesFromReferenceBindings(bindings);
  return Object.freeze({
    status: 'closed',
    identities: identitiesFromAliases(aliases),
    aliases,
    modRefs: semanticObjectIdentityOperations.modRefEvidence(model),
    proof: proofFromReferenceBindings(bindings),
  });
};

const proofWithAnswer = (
  proof: SemanticObjectIdentityProof,
  left: KnowledgeId,
  right: KnowledgeId,
  value: Exclude<SemanticAliasKind, 'no-alias'>,
): SemanticObjectIdentityProof => {
  const answer = aliasAnswerFact(left, right, value);
  const sameIdentity = sameIdentityFact(left, right);
  let premises: readonly SemanticObjectIdentityProofFact[] = semanticObjectIdentityOperations.identityLinkPremises(proof, [left, right]);
  let ruleId: SemanticObjectIdentityRuleId = 'identity-link:may-alias';
  const facts = [...proof.facts];
  Object.is(value, 'must-alias') && (premises = Object.freeze([sameIdentity]));
  Object.is(value, 'must-alias') && (ruleId = 'same-identity:must-alias');
  Object.is(value, 'must-alias') && facts.push(sameIdentity);
  facts.push(answer);
  return Object.freeze({
    ...proof,
    facts: Object.freeze(facts),
    derivations: Object.freeze([...proof.derivations, derivation(ruleId, premises, answer)]),
  });
};

const alias: SemanticAliasAssessmentOperationInterface['execute'] = (
  analysis: SemanticObjectIdentityAnalysis,
  left: KnowledgeId,
  right: KnowledgeId,
): SemanticAliasAssessment => {
  const sameIdentity = semanticKnowledgeIdOperations.same(left, right);
  const matchingAlias = semanticObjectIdentityOperations.aliasPairMembership(analysis.aliases, [left, right]);
  let value: SemanticPresence<Exclude<SemanticAliasKind, 'no-alias'>> = semanticAbsent<Exclude<SemanticAliasKind, 'no-alias'>>('not_provided');
  Object.is(matchingAlias.kind, 'semantic_alias_pair_present') &&
    (value = semanticPresent<Exclude<SemanticAliasKind, 'no-alias'>>('may-alias'));
  Object.is(sameIdentity.kind, 'same_knowledge_id') &&
    (value = semanticPresent<Exclude<SemanticAliasKind, 'no-alias'>>('must-alias'));
  const proof = value.continueWith({
    present: answer => proofWithAnswer(analysis.proof, left, right, answer),
    absent: () => analysis.proof,
  });
  return Object.freeze({ status: 'resolved', value, proof });
};

export const analyzeSemanticObjectIdentityOperation: SemanticObjectIdentityAnalysisOperationInterface = Object.freeze({ execute: analyze });
export const semanticAliasAssessmentOperation: SemanticAliasAssessmentOperationInterface = Object.freeze({ execute: alias });

export const semanticObjectIdentityAuthority: SemanticObjectIdentityAuthorityInterface = Object.freeze({
  kind: 'semantic_object_identity_authority',
  analyze: analyzeSemanticObjectIdentityOperation.execute,
  alias: semanticAliasAssessmentOperation.execute,
});
