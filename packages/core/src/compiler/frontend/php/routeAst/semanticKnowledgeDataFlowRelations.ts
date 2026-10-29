/**
 * Compatibility facade for the scanner's historical semantic knowledge path.
 * Canonical semantic vocabulary is owned by types/upstream.
 * Scanner-specific closure/relation projections remain wiring compatibility.
 */
export * from '../../../../types/upstream/semanticDataflowKnowledge';

import type { SemanticClosureResult } from './semanticClosureEngine';
import type { SemanticTheoryFact } from './semanticRelationTheory';
import type {
  SemanticKnowledgeDataFlow as CanonicalSemanticKnowledgeDataFlow,
} from '../../../../types/upstream/semanticDataflowKnowledge';
import { knowledgeIdKey } from '../../../../types/upstream/semanticDataflowKnowledge';
import { semanticKnowledgeDataFlowValidationOperations } from '../../../../types/upstream/semanticDataflowKnowledgeValidation';
import { semanticKnowledgeDataFlowContinuationOperations, type SemanticKnowledgeDataFlowContinuationOutcome } from '../../../../types/upstream/semanticDataflowKnowledgeContinuation';

/** Legacy scanner projection; not an upstream semantic authority. */
export interface SemanticKnowledgeDataFlow extends CanonicalSemanticKnowledgeDataFlow {
  readonly semanticRelations?: readonly SemanticTheoryFact[];
  readonly semanticClosure?: SemanticClosureResult;
}

export type SemanticKnowledgeDataFlowViolation = import('../../../../types/upstream/semanticDataflowKnowledgeValidation').SemanticKnowledgeDataFlowValidationViolation;

export type SemanticKnowledgeDataFlowValidation =
  | { readonly kind: 'valid'; readonly dataFlow: SemanticKnowledgeDataFlow }
  | {
      readonly kind: 'invalid';
      readonly dataFlow: SemanticKnowledgeDataFlow;
      readonly violations: readonly SemanticKnowledgeDataFlowViolation[];
    };

export interface SemanticKnowledgeDataFlowWiringInterface {
  readonly validate: (dataFlow: SemanticKnowledgeDataFlow) => SemanticKnowledgeDataFlowValidation;
  readonly continueWithOutcome: (validation: SemanticKnowledgeDataFlowValidation) => SemanticKnowledgeDataFlowContinuationOutcome;
  readonly continueAfterValidation: (validation: SemanticKnowledgeDataFlowValidation) => SemanticKnowledgeDataFlow;
}

const validate = (dataFlow: SemanticKnowledgeDataFlow): SemanticKnowledgeDataFlowValidation => {
  const outcome = semanticKnowledgeDataFlowValidationOperations.validate(dataFlow);
  return outcome.kind === 'valid'
    ? Object.freeze({ kind: 'valid', dataFlow })
    : Object.freeze({ kind: 'invalid', dataFlow, violations: outcome.violations });
};

const continueWithOutcome = (validation: SemanticKnowledgeDataFlowValidation): SemanticKnowledgeDataFlowContinuationOutcome =>
  semanticKnowledgeDataFlowContinuationOperations.continueAfterValidation(validation);

const continueAfterValidation = (validation: SemanticKnowledgeDataFlowValidation): SemanticKnowledgeDataFlow => {
  if (validation.kind === 'valid') return validation.dataFlow;
  const first = validation.violations[0];
  const messages: Readonly<Record<SemanticKnowledgeDataFlowViolation['kind'], (violation: SemanticKnowledgeDataFlowViolation) => string>> = {
    'duplicate-fact-identity': violation => `Duplicate semantic knowledge identity detected: ${violation.kind === 'duplicate-fact-identity' ? violation.identities.length : 0} duplicate identity witness(es)`,
    'unknown-flow-endpoint': violation => {
      const flow = violation.kind === 'unknown-flow-endpoint' ? violation.facts[0] : undefined;
      return `Semantic data-flow fact references unknown knowledge: ${flow ? `${knowledgeIdKey(flow.source)} -> ${knowledgeIdKey(flow.target)}` : 'unknown endpoint'}`;
    },
    'self-reference': violation => {
      const flow = violation.kind === 'self-reference' ? violation.facts[0] : undefined;
      return `Semantic data-flow fact cannot self-reference: ${flow ? knowledgeIdKey(flow.source) : 'unknown identity'}`;
    },
    'unknown-guard-predicate': violation => {
      const flow = violation.kind === 'unknown-guard-predicate' ? violation.facts[0] : undefined;
      return `Semantic data-flow guard references unknown predicate: ${flow && flow.guard.kind === 'present' ? knowledgeIdKey(flow.guard.value.predicate) : 'unknown predicate'}`;
    },
    'unsupported-derived-relation': violation => {
      const edge = violation.kind === 'unsupported-derived-relation' ? violation.relations[0] : undefined;
      return `Derived relation is not backed by canonical data-flow: ${edge ? `${knowledgeIdKey(edge.from)} -> ${knowledgeIdKey(edge.to)} (${edge.role.code})` : 'unknown relation'}`;
    },
  };
  throw Error(messages[first.kind](first));
};

export const semanticKnowledgeDataFlowWiring: SemanticKnowledgeDataFlowWiringInterface = Object.freeze({ validate, continueWithOutcome, continueAfterValidation });
export const validateSemanticKnowledgeDataFlow = semanticKnowledgeDataFlowWiring.validate;
