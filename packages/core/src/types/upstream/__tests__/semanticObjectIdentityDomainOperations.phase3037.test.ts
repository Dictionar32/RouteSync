import { knowledgeId, semanticAbsent, semanticSource, semanticText, SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE, SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE, type SemanticKnowledgeDataFlow } from '../semanticDataflowKnowledge';
import { semanticObjectIdentityAuthority } from '../semanticObjectIdentityAuthority';
import { semanticObjectIdentityOperations } from '../semanticObjectIdentityInterface';
import { semanticModRefFactOperations } from '../semanticModRefFactOperations';

const source = semanticSource.create('phase3037.php', 0, 32);
const left = knowledgeId(source, 'variable', 'left');
const right = knowledgeId(source, 'variable', 'right');
const firstAssignment = knowledgeId(source, 'assignment', 'reference-one');
const secondAssignment = knowledgeId(source, 'assignment', 'reference-two');
const byValueAssignment = knowledgeId(source, 'assignment', 'value-only');
const invocationId = knowledgeId(source, 'invocation', 'unknown-call');
const accessId = knowledgeId(source, 'access', 'property-read');
const unsetId = knowledgeId(source, 'unset', 'unset-target');

const model: SemanticKnowledgeDataFlow = {
  facts: [
    { kind: 'assignment', value: { id: firstAssignment, target: left, value: right, operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[0], reference: SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[1], source } },
    { kind: 'assignment', value: { id: secondAssignment, target: left, value: right, operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[0], reference: SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[1], source } },
    { kind: 'assignment', value: { id: byValueAssignment, target: left, value: right, operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[0], reference: SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[0], source } },
    { kind: 'invocation', value: { id: invocationId, receiver: semanticAbsent('not_provided'), operation: { kind: 'operation', name: semanticText.create('unknownCall') }, arguments: [left], source } },
    { kind: 'access', value: { id: accessId, receiver: left, member: { kind: 'knowledge-id', value: right }, mode: { code: 'direct' }, source } },
    { kind: 'unset', value: { id: unsetId, targets: [left], source } },
  ],
  modRefFacts: [
    { kind: 'invocation_effect_summary_unmodeled', fact: invocationId, source },
  ],
  modRefRelations: [
    { accessor: firstAssignment, location: left, kind: 'mod', alias: 'must-alias', source },
    { accessor: secondAssignment, location: left, kind: 'mod', alias: 'must-alias', source },
    { accessor: byValueAssignment, location: left, kind: 'mod', alias: 'must-alias', source },
    { accessor: accessId, location: accessId, kind: 'ref', alias: 'must-alias', source },
    { accessor: unsetId, location: left, kind: 'mod', alias: 'must-alias', source },
  ],
  dataFlow: [],
  relations: [],
};

const analysis = semanticObjectIdentityAuthority.analyze(model);
const alias = semanticObjectIdentityAuthority.alias(analysis, left, right);
const same = semanticObjectIdentityAuthority.alias(analysis, left, left);

if (analysis.status !== 'closed') throw new Error('Phase 3037: finite domain evidence must close without a generic solver.');
if (analysis.aliases.length !== 1) throw new Error('Phase 3037: repeated alias pairs must be deduplicated.');
if (analysis.aliases[0].evidence.length !== 2) throw new Error('Phase 3037: deduplication must preserve all assignment evidence.');
if (alias.value.kind !== 'present' || alias.value.value !== 'may-alias') throw new Error('Phase 3037: by-reference assignments must resolve as may-alias.');
if (same.value.kind !== 'present' || same.value.value !== 'must-alias') throw new Error('Phase 3037: identical KnowledgeId values must resolve as must-alias.');
if (analysis.proof.closure !== 'finite_domain_evidence') throw new Error('Phase 3037: proof must identify the domain-owned closure contract.');
if (analysis.proof.facts.some(fact => fact.kind === 'assignment_reference' && fact.assignment.identity.slot.value === 'value-only')) {
  throw new Error('Phase 3037: by-value assignments must not be promoted to alias evidence.');
}


const membership = semanticObjectIdentityOperations.membership([left, right], left);
if (membership.kind !== 'knowledge_id_present') throw new Error('Phase 3038: KnowledgeId membership must return a typed present judgment.');
const aliasPairMembership = semanticObjectIdentityOperations.aliasPairMembership(analysis.aliases, [right, left]);
if (aliasPairMembership.kind !== 'semantic_alias_pair_present') throw new Error('Phase 3038: unordered alias-pair membership must recognize reversed endpoints.');
const identityPremises = semanticObjectIdentityOperations.identityLinkPremises(analysis.proof, [left, right]);
if (identityPremises.length !== 4) throw new Error('Phase 3049: identity-link premise selection must preserve both directions for each source-backed reference binding.');

const modRefEvidence = semanticObjectIdentityOperations.modRefEvidence(model);
const unresolvedModRefs = analysis.modRefs;
if (unresolvedModRefs.kind !== 'mod_ref_evidence_partially_derived') throw new Error('Phase 3045: known effects and unresolved invocation summaries must coexist explicitly.');
if (modRefEvidence.kind !== unresolvedModRefs.kind) throw new Error('Phase 3045: analysis must use the upstream domain operation for mod/ref coverage.');
if (unresolvedModRefs.blockers.length !== 1) throw new Error('Phase 3045: only the invocation with an unmodeled callable summary remains blocked.');
if (!unresolvedModRefs.blockers.some(blocker => blocker.kind === 'invocation_effect_summary_unmodeled' && blocker.fact.identity.slot.value === 'unknown-call')) throw new Error('Phase 3045: unresolved invocation effect must retain its KnowledgeId.');
if (!unresolvedModRefs.blockers.every(blocker => blocker.source.filePath.value === source.filePath.value && blocker.source.span.start.value === source.span.start.value)) throw new Error('Phase 3045: mod/ref blockers must preserve source provenance.');
const assignmentAssessment = model.modRefRelations[0];
if (assignmentAssessment.kind !== 'mod' || assignmentAssessment.location.identity.slot.value !== 'left') throw new Error('Phase 3045: assignment producer must emit a concrete write effect for its target.');
if (unresolvedModRefs.relations.length !== 5) throw new Error('Phase 3045: assignment, access, and unset effects must remain available even while invocation effects are unresolved.');
const reassessedModRefs = semanticObjectIdentityOperations.modRefEvidence(model);
if (reassessedModRefs.kind !== 'mod_ref_evidence_partially_derived') throw new Error('Phase 3045: mixed derived and unresolved effects must remain explicit.');
if (reassessedModRefs.blockers.length !== 1) throw new Error('Phase 3045: only source-backed unresolved invocation facts remain blockers.');
