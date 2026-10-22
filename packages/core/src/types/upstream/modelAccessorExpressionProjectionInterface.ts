import type { ModelAccessorComputation } from './modelVocabulary';
import type { ResolvedExpression } from './expression';

/** Projects a complete upstream accessor computation without reclassifying rejected cases. */
export interface ModelAccessorExpressionProjectionInterface {
  readonly kind: 'model_accessor_expression_projection';
  readonly project: (input: ModelAccessorExpressionProjectionInput) => ResolvedExpression;
}

export interface ModelAccessorExpressionProjectionInput {
  readonly computation: ModelAccessorComputation;
}
