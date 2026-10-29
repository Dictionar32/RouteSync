import { semanticSource, knowledgeId, semanticAssignmentEffectKnowledge, SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE, SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE, type SemanticAssignment, type SemanticKnowledgeDataFlow } from '../semanticDataflowKnowledge';
import { semanticModRefEffectFactory } from '../semanticModRefFactOperations';
import { semanticObjectIdentityOperations } from '../semanticObjectIdentityInterface';

const source = semanticSource.create('phase3045.php', 10, 24);
const assignment = knowledgeId(source, 'assignment', 'write-target');
const target = knowledgeId(source, 'variable', 'target');
const access = knowledgeId(source, 'access', 'read-location');
const unset = knowledgeId(source, 'unset', 'unset-target');
const invocation = knowledgeId(source, 'invocation', 'unknown-call');
const directAssignment: SemanticAssignment = Object.freeze({
  id: assignment,
  target,
  value: target,
  operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[0],
  reference: SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[0],
  source,
});

const model: SemanticKnowledgeDataFlow = Object.freeze({
  facts: Object.freeze([]),
  modRefFacts: Object.freeze([semanticModRefEffectFactory.invocationBlocker(invocation, source)]),
  modRefRelations: Object.freeze([
    ...semanticModRefEffectFactory.assignmentEffects(directAssignment),
    semanticModRefEffectFactory.accessRead(access, access, source),
    semanticModRefEffectFactory.unsetWrite(unset, target, source),
  ]),
  dataFlow: Object.freeze([]),
  relations: Object.freeze([]),
});

const assessment = semanticObjectIdentityOperations.modRefEvidence(model);
if (assessment.kind !== 'mod_ref_evidence_partially_derived') throw new Error('Phase 3045: concrete effects and unresolved callable effects must coexist in a typed assessment.');
if (assessment.relations.length !== 3) throw new Error('Phase 3045: assignment, access, and unset effects must remain in the canonical assessment.');
if (assessment.blockers.length !== 1) throw new Error('Phase 3045: only the unknown invocation summary must remain blocked.');
if (assessment.relations[0].kind !== 'mod' || assessment.relations[0].location.identity.slot.value !== 'target') throw new Error('Phase 3045: assignment effect must preserve the exact target identity.');
if (assessment.relations[1].kind !== 'ref' || assessment.relations[1].accessor.identity.slot.value !== 'read-location') throw new Error('Phase 3045: access effect must preserve the source access identity.');
if (assessment.relations[2].kind !== 'mod' || assessment.relations[2].location.identity.slot.value !== 'target') throw new Error('Phase 3045: unset effect must preserve the exact target identity.');
if (assessment.blockers[0].fact.identity.slot.value !== 'unknown-call') throw new Error('Phase 3045: unresolved invocation blocker must preserve its KnowledgeId.');

const compoundAssignment: SemanticAssignment = Object.freeze({
  ...directAssignment,
  operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[1],
});
const compoundEffects = semanticModRefEffectFactory.assignmentEffects(compoundAssignment);
if (compoundEffects.length !== 2 || compoundEffects[0].kind !== 'ref' || compoundEffects[1].kind !== 'mod') throw new Error('Phase 3048: compound assignment must preserve separate read and write effects.');
if (model.modRefRelations[0].kind !== 'mod') throw new Error('Phase 3046: direct assignment must remain a write-only mod outcome.');
