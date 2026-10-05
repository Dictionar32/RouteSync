import type { ModelAccessorComputation } from '../../../../types/upstream/modelVocabulary';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationGate } from '../../../../semantic/foundation/relationalSequence';
import type { ResolvedExpression, Expression } from '../../../../types/upstream/expression';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { SemanticValue } from '../../../../types/upstream/primitiveVocabulary';
import { semanticType } from './semanticTypeCanonical';

export function accessorExpression(computation: ModelAccessorComputation, source: SourceSpan): ResolvedExpression {
  const expression: Expression = relationGate(
    relationEqual(computation.kind, 'expression'),
    () => computation.expression,
    () => ({ kind: 'unsupported_expression', reason: { kind: 'unsupported_syntax' }, source }),
  );
  return { kind: 'resolved_expression', expression, result: semanticValue(computation.result) };
}

function semanticValue(value: import('../../../../types/upstream/typeVocabulary').TypeExpression): SemanticValue {
  return { kind: 'typed', type: value };
}

