import {
  knowledgeId,
  semanticAssignmentEffectKnowledge,
  SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE,
  SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE,
  semanticSource,
  type SemanticAssignment,
  type SemanticKnowledgeDataFlow,
} from '../semanticDataflowKnowledge';
import { semanticModRefEffectFactory } from '../semanticModRefFactOperations';
import { semanticObjectIdentityOperations } from '../semanticObjectIdentityInterface';

const source = semanticSource.create('phase3046.php', 4, 18);
const assignmentId = knowledgeId(source, 'assignment', 'compound-write');
const target = knowledgeId(source, 'variable', 'counter');
const directAssignment: SemanticAssignment = Object.freeze({
  id: assignmentId,
  target,
  value: target,
  operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[0],
  reference: SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[0],
  source,
});
const compoundAssignment: SemanticAssignment = Object.freeze({
  ...directAssignment,
  operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[1],
});
const directEffects = semanticModRefEffectFactory.assignmentEffects(directAssignment);
const compoundEffects = semanticModRefEffectFactory.assignmentEffects(compoundAssignment);
const directWrite = directEffects[0];
const compoundRead = compoundEffects[0];
const compoundWrite = compoundEffects[1];

if (directEffects.length !== 1 || directWrite.kind !== 'mod') {
  throw new Error('Phase 3046: plain assignment must be represented as a write-only mod effect.');
}
if (compoundEffects.length !== 2 || compoundRead.kind !== 'ref' || compoundWrite.kind !== 'mod') {
  throw new Error('Phase 3048: compound assignment must expose distinct read and write relations.');
}
if (directWrite.location.identity.slot.value !== 'counter' || compoundWrite.location.identity.slot.value !== 'counter') {
  throw new Error('Phase 3046: both assignment effects must preserve the exact target KnowledgeId.');
}
if (directWrite.accessor.identity.slot.value !== 'compound-write' || compoundWrite.accessor.identity.slot.value !== 'compound-write') {
  throw new Error('Phase 3047: the effect accessor must preserve the canonical assignment identity.');
}
if (compoundRead.accessor.identity.slot.value !== 'compound-write' || compoundRead.source !== source || compoundWrite.source !== source) {
  throw new Error('Phase 3048: both compound effects must preserve the same assignment identity and source provenance.');
}

const model: SemanticKnowledgeDataFlow = Object.freeze({
  facts: Object.freeze([]),
  modRefFacts: Object.freeze([]),
  modRefRelations: Object.freeze([...directEffects, ...compoundEffects]),
  dataFlow: Object.freeze([]),
  relations: Object.freeze([]),
});
const assessment = semanticObjectIdentityOperations.modRefEvidence(model);
if (assessment.kind !== 'mod_ref_evidence_derived' || assessment.relations.length !== 3) {
  throw new Error('Phase 3048: separate assignment read/write effects must survive canonical mod/ref assessment.');
}
