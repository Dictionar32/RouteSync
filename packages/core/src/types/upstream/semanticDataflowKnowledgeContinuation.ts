import type {
  SemanticKnowledgeDataFlow,
} from './semanticDataflowKnowledge';
import type {
  SemanticKnowledgeDataFlowValidationOutcome,
  SemanticKnowledgeDataFlowValidationViolation,
} from './semanticDataflowKnowledgeValidation';

/** A typed continuation decision that preserves the complete source-backed model. */
export type SemanticKnowledgeDataFlowContinuationOutcome =
  | {
      readonly kind: 'continue';
      readonly dataFlow: SemanticKnowledgeDataFlow;
    }
  | {
      readonly kind: 'blocked';
      readonly dataFlow: SemanticKnowledgeDataFlow;
      readonly violations: readonly SemanticKnowledgeDataFlowValidationViolation[];
    };

export interface SemanticKnowledgeDataFlowContinuationOperationsInterface {
  readonly continueAfterValidation: (
    validation: SemanticKnowledgeDataFlowValidationOutcome,
  ) => SemanticKnowledgeDataFlowContinuationOutcome;
}

const continueAfterValidation = (
  validation: SemanticKnowledgeDataFlowValidationOutcome,
): SemanticKnowledgeDataFlowContinuationOutcome =>
  validation.kind === 'valid'
    ? Object.freeze({ kind: 'continue', dataFlow: validation.dataFlow })
    : Object.freeze({
        kind: 'blocked',
        dataFlow: validation.dataFlow,
        violations: validation.violations,
      });

export const semanticKnowledgeDataFlowContinuationOperations: SemanticKnowledgeDataFlowContinuationOperationsInterface = Object.freeze({
  continueAfterValidation,
});
