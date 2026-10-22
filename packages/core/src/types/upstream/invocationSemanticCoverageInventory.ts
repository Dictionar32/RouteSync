/** Source-subject inventory authority for invocation coverage. */
import type { SemanticKnowledgeDataFlow, SemanticInvocation, SemanticStaticInvocation } from './semanticDataflowKnowledge';
import {
  INVOCATION_SEMANTIC_COVERAGE_CONTRACT,
  type InvocationSemanticSubject,
  type InvocationSemanticSubjectCoverageEntry,
  type InvocationSemanticSubjectCoverageInventoryInterface,
} from './invocationSemanticPipelineInterface';


const ordinarySubject = (invocation: SemanticInvocation): InvocationSemanticSubject => Object.freeze({
  kind: 'ordinary-invocation-subject',
  invocation,
});

const staticSubject = (invocation: SemanticStaticInvocation): InvocationSemanticSubject => Object.freeze({
  kind: 'static-invocation-subject',
  invocation,
});

const inventoryEntry = (subject: InvocationSemanticSubject): InvocationSemanticSubjectCoverageEntry => {
  switch (subject.kind) {
    case 'ordinary-invocation-subject':
      return Object.freeze({
        kind: 'ordinary-invocation-subject-coverage-entry',
        subject,
        disposition: Object.freeze({ kind: 'current-judgment-domain', domain: 'ordinary-invocation' }),
      });
    case 'static-invocation-subject':
      return Object.freeze({
        kind: 'static-invocation-subject-coverage-entry',
        subject,
        disposition: Object.freeze({ kind: 'uncovered-judgment-domain', reason: 'static-invocation-algebra-and-authority-not-yet-implemented' }),
      });
    default: {
      const exhaustive: never = subject;
      return exhaustive;
    }
  }
};

const inspectKnowledge = (knowledge: SemanticKnowledgeDataFlow): readonly InvocationSemanticSubjectCoverageEntry[] => Object.freeze(
  knowledge.facts.flatMap(fact => {
    switch (fact.kind) {
      case 'invocation':
        return [inventoryEntry(ordinarySubject(fact.value))];
      case 'static-invocation':
        return [inventoryEntry(staticSubject(fact.value))];
      case 'variable':
      case 'value':
      case 'operator':
      case 'comparison':
      case 'binary-operation':
      case 'unary-operation':
      case 'predicate':
      case 'merge':
      case 'match':
      case 'outcome':
      case 'assignment':
      case 'binding':
      case 'reference':
      case 'callable':
      case 'access':
      case 'cast':
      case 'array':
      case 'construction':
      case 'type-check':
      case 'class-reference':
      case 'class-constant':
      case 'resource-access':
      case 'interpolated-string':
      case 'magic-constant':
      case 'closure':
      case 'arrow-function':
      case 'anonymous-class':
      case 'unsupported-expression':
      case 'emission':
      case 'include':
      case 'unset':
      case 'region':
      case 'exception-handler':
      case 'exception':
      case 'scope':
        return [];
      default: {
        const exhaustive: never = fact;
        return exhaustive;
      }
    }
  }),
);

export const invocationSemanticSubjectCoverageInventory: InvocationSemanticSubjectCoverageInventoryInterface = Object.freeze({
  kind: 'invocation_semantic_subject_coverage_inventory',
  contract: INVOCATION_SEMANTIC_COVERAGE_CONTRACT,
  inspectKnowledge,
});

