import type { ModelAccessorComputation } from '../../../../types/domain/eloquentTypes';
import type { ResolvedExpression, Expression } from '../../../../types/upstream/expression';
import type { SemanticType } from '../../../types/SemanticType';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { SemanticValue } from '../../../../types/upstream/primitiveVocabulary';
import { semanticType } from './semanticTypeCanonical';

const primitives: ReadonlyMap<string, PrimitiveVocabulary> = new Map([
  ['string', { kind: 'string' }], ['number', { kind: 'number' }], ['boolean', { kind: 'boolean' }],
  ['datetime', { kind: 'date_time' }], ['file', { kind: 'file' }], ['json_value', { kind: 'json' }],
  ['optional', { kind: 'json' }], ['nullable', { kind: 'json' }], ['never', { kind: 'json' }],
  ['error', { kind: 'json' }], ['reference', { kind: 'json' }], ['union', { kind: 'json' }],
  ['intersection', { kind: 'json' }], ['readonly_collection', { kind: 'json' }],
  ['mutable_collection', { kind: 'json' }], ['generic', { kind: 'json' }], ['object', { kind: 'json' }],
]);

export function accessorExpression(computation: ModelAccessorComputation, source: SourceSpan): ResolvedExpression {
  const reasons = { rejected: 'unsupported_syntax' as const, known: 'unsupported_syntax' as const, requires_binding: 'unsupported_syntax' as const };
  const reason = reasons[computation.kind];
  const expression: Expression = { kind: 'unsupported_expression', reason: { kind: reason }, source };
  return { kind: 'resolved_expression', expression, result: semanticValue(computation.result) };
}

function semanticValue(value: SemanticType): SemanticValue {
  return { kind: 'typed', type: semanticType(value) };
}

