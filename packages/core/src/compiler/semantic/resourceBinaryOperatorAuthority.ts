import type { SemanticOperator } from '../../types/domain/semanticValues';
import type { ResourceBinaryOperatorMappingOperationInterface, ResourceBinaryOperatorSourceKind } from '../../types/upstream/resourceBinaryOperatorInterface';

/**
 * Exhaustive semantic judgment for the operator kinds the Laravel PHP AST frontend can emit.
 * Unsupported operators are explicit unknown judgments; no runtime alias inference is performed.
 */
const resourceBinaryOperatorJudgments: Readonly<Record<ResourceBinaryOperatorSourceKind, SemanticOperator['value']>> = Object.freeze({
  addition: 'add',
  subtraction: 'subtract',
  multiplication: 'multiply',
  division: 'divide',
  modulo: 'modulo',
  equal: 'equal',
  not_equal: 'not_equal',
  identical: 'equal',
  not_identical: 'not_equal',
  less_than: 'less_than',
  greater_than: 'greater_than',
  less_or_equal: 'less_than_or_equal',
  greater_or_equal: 'greater_than_or_equal',
  logical_and: 'and',
  logical_or: 'or',
  bitwise_or: 'unknown',
  concat: 'concat',
});

export const resourceBinaryOperatorMapping: ResourceBinaryOperatorMappingOperationInterface = Object.freeze({
  map: (kind: ResourceBinaryOperatorSourceKind) => resourceBinaryOperatorJudgments[kind],
});
