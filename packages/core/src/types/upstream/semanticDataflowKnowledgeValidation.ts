import type {
  SemanticDataFlowEdge,
  SemanticDataFlowFact,
  SemanticKnowledgeDataFlow,
  KnowledgeId,
} from './semanticDataflowKnowledge';
import { semanticKnowledgeIdOperations } from './semanticDataflowKnowledge';

export type SemanticKnowledgeDataFlowValidationViolation =
  | { readonly kind: 'duplicate-fact-identity'; readonly identities: readonly KnowledgeId[] }
  | { readonly kind: 'unknown-flow-endpoint'; readonly facts: readonly SemanticDataFlowFact[] }
  | { readonly kind: 'self-reference'; readonly facts: readonly SemanticDataFlowFact[] }
  | { readonly kind: 'unknown-guard-predicate'; readonly facts: readonly SemanticDataFlowFact[] }
  | { readonly kind: 'unsupported-derived-relation'; readonly relations: readonly SemanticDataFlowEdge[] };

export type SemanticKnowledgeDataFlowValidationOutcome =
  | { readonly kind: 'valid'; readonly dataFlow: SemanticKnowledgeDataFlow }
  | {
      readonly kind: 'invalid';
      readonly dataFlow: SemanticKnowledgeDataFlow;
      readonly violations: readonly SemanticKnowledgeDataFlowValidationViolation[];
    };

export interface SemanticKnowledgeDataFlowValidationOperationsInterface {
  readonly validate: (dataFlow: SemanticKnowledgeDataFlow) => SemanticKnowledgeDataFlowValidationOutcome;
}

const validateSemanticKnowledgeDataFlow = (
  dataFlow: SemanticKnowledgeDataFlow,
): SemanticKnowledgeDataFlowValidationOutcome => {
  const factIdentities: KnowledgeId[] = [];
  for (const fact of dataFlow.facts) factIdentities.push(fact.value.id);

  const sameIdentity = (left: KnowledgeId, right: KnowledgeId): boolean =>
    semanticKnowledgeIdOperations.same(left, right).kind === 'same_knowledge_id';

  const duplicateFactIdentities: KnowledgeId[] = [];
  for (let left = 0; left < factIdentities.length; left += 1) {
    for (let right = left + 1; right < factIdentities.length; right += 1) {
      if (sameIdentity(factIdentities[left], factIdentities[right])) duplicateFactIdentities.push(factIdentities[left]);
    }
  }

  const hasFactIdentity = (identity: KnowledgeId): boolean => {
    for (const candidate of factIdentities) if (sameIdentity(candidate, identity)) return true;
    return false;
  };

  const unknownFlowEndpoints: SemanticDataFlowFact[] = [];
  for (const flow of dataFlow.dataFlow) {
    if (!hasFactIdentity(flow.source) || !hasFactIdentity(flow.target)) {
      unknownFlowEndpoints.push(flow);
    }
  }

  const selfReferences: SemanticDataFlowFact[] = [];
  for (const flow of dataFlow.dataFlow) {
    if (sameIdentity(flow.source, flow.target)) selfReferences.push(flow);
  }

  const unknownGuards: SemanticDataFlowFact[] = [];
  for (const flow of dataFlow.dataFlow) {
    if (flow.guard.kind === 'present' && !hasFactIdentity(flow.guard.value.predicate)) unknownGuards.push(flow);
  }

  const unsupportedRelations: SemanticDataFlowEdge[] = [];
  for (const edge of dataFlow.relations) {
    let backedByCanonicalFlow = false;
    for (const flow of dataFlow.dataFlow) {
      const relationCode = Object.is(flow.kind, 'dependency') ? 'depends_on' : 'flows_to';
      const sameFlow = sameIdentity(flow.source, edge.from)
        && sameIdentity(flow.target, edge.to)
        && Object.is(relationCode, edge.relation.code)
        && Object.is(flow.role.code, edge.role.code);
      if (sameFlow) backedByCanonicalFlow = true;
    }
    if (!backedByCanonicalFlow) unsupportedRelations.push(edge);
  }

  const violations: SemanticKnowledgeDataFlowValidationViolation[] = [
    ...(duplicateFactIdentities.length > 0 ? [{ kind: 'duplicate-fact-identity' as const, identities: Object.freeze(duplicateFactIdentities) }] : []),
    ...(unknownFlowEndpoints.length > 0 ? [{ kind: 'unknown-flow-endpoint' as const, facts: Object.freeze(unknownFlowEndpoints) }] : []),
    ...(selfReferences.length > 0 ? [{ kind: 'self-reference' as const, facts: Object.freeze(selfReferences) }] : []),
    ...(unknownGuards.length > 0 ? [{ kind: 'unknown-guard-predicate' as const, facts: Object.freeze(unknownGuards) }] : []),
    ...(unsupportedRelations.length > 0 ? [{ kind: 'unsupported-derived-relation' as const, relations: Object.freeze(unsupportedRelations) }] : []),
  ];

  return violations.length === 0
    ? Object.freeze({ kind: 'valid', dataFlow })
    : Object.freeze({ kind: 'invalid', dataFlow, violations: Object.freeze(violations) });
};

export const semanticKnowledgeDataFlowValidationOperations: SemanticKnowledgeDataFlowValidationOperationsInterface = Object.freeze({
  validate: validateSemanticKnowledgeDataFlow,
});
