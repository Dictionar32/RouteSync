import {
  knowledgeId,
  semanticSource,
  SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE,
  SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE,
  semanticAssignmentReferenceFactOperations,
  type SemanticAssignment,
  type SemanticKnowledgeDataFlow,
} from '../semanticDataflowKnowledge';
import { semanticObjectIdentityAuthority } from '../semanticObjectIdentityAuthority';

const source = semanticSource.create('phase3049.php', 7, 19);
const assignmentId = knowledgeId(source, 'assignment', 'reference-binding');
const target = knowledgeId(source, 'variable', 'alias');
const value = knowledgeId(source, 'variable', 'original');
const assignment: SemanticAssignment = Object.freeze({
  id: assignmentId,
  target,
  value,
  operator: SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE[0],
  reference: SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[1],
  source,
});
const byReferenceBindings = assignment.reference.identityProjection.project(assignment);
const byValueDefinition = SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE[0];
const byValueBindings = byValueDefinition.identityProjection.project(Object.freeze({
  ...assignment,
  reference: byValueDefinition,
}));

if (byReferenceBindings.length !== 1) throw new Error('Phase 3049: by-reference mode must emit one explicit identity-binding fact.');
if (byValueBindings.length !== 0) throw new Error('Phase 3049: by-value mode must not emit identity-binding evidence.');
if (byReferenceBindings[0].assignment !== assignmentId || byReferenceBindings[0].left !== target || byReferenceBindings[0].right !== value) {
  throw new Error('Phase 3049: identity binding must preserve canonical assignment and endpoint identities.');
}
if (byReferenceBindings[0].source !== source) throw new Error('Phase 3049: identity binding must preserve source provenance.');

const model: SemanticKnowledgeDataFlow = Object.freeze({
  facts: Object.freeze([
    Object.freeze({ kind: 'assignment' as const, value: assignment }),
    Object.freeze({ kind: 'assignment' as const, value: Object.freeze({ ...assignment, id: knowledgeId(source, 'assignment', 'by-value'), reference: byValueDefinition }) }),
  ]),
  modRefFacts: Object.freeze([]),
  modRefRelations: Object.freeze([]),
  dataFlow: Object.freeze([]),
  relations: Object.freeze([]),
});
const projectedBindings = semanticAssignmentReferenceFactOperations.identityBindings(model.facts);
if (projectedBindings.length !== 1) throw new Error('Phase 3050: upstream fact-domain continuation must project only by-reference identity bindings.');
if (projectedBindings[0].assignment !== assignmentId || projectedBindings[0].source !== source) {
  throw new Error('Phase 3050: upstream fact-domain continuation must preserve identity and provenance.');
}

const analysis = semanticObjectIdentityAuthority.analyze(model);
if (analysis.aliases.length !== 1) throw new Error('Phase 3049: only source-emitted by-reference bindings may become alias relations.');
if (analysis.aliases[0].left !== target || analysis.aliases[0].right !== value) throw new Error('Phase 3049: alias relation must preserve binding endpoints.');
const sourceBackedReferenceFact = analysis.proof.facts.find(fact => fact.kind === 'assignment_reference');
if (sourceBackedReferenceFact?.kind !== 'assignment_reference' || sourceBackedReferenceFact.source !== source) {
  throw new Error('Phase 3049: proof must retain the source evidence of the reference binding.');
}
if (analysis.proof.facts.some(fact => fact.kind === 'assignment_reference' && fact.assignment.identity.slot.value === 'by-value')) {
  throw new Error('Phase 3049: by-value assignment must not enter the reference-binding proof.');
}
