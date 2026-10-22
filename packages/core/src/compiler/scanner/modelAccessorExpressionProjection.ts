import type { ModelAccessorExpressionProjectionInterface } from '../../types/upstream/modelAccessorExpressionProjectionInterface';
import type { ResolvedExpression } from '../../types/upstream/expression';
import type { ModelAccessorComputation } from '../../types/upstream/modelVocabulary';
import type { SemanticValue } from '../../types/upstream/primitiveVocabulary';

const semanticValue = (value: ModelAccessorComputation['result']): SemanticValue => ({ kind: 'typed', type: value });
const resolvedExpression = (computation: ModelAccessorComputation): ResolvedExpression => ({
  kind: 'resolved_expression',
  expression: computation.expression,
  result: semanticValue(computation.result),
});

/** Runtime projection only packages the already-complete upstream judgment. */
export const modelAccessorExpressionProjection: ModelAccessorExpressionProjectionInterface = Object.freeze({
  kind: 'model_accessor_expression_projection',
  project: input => resolvedExpression(input.computation),
});
