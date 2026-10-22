import type { SemanticOperator } from '../domain/semanticValues';

/** Closed source-operator evidence currently emitted by the Laravel PHP AST frontend. */
export type ResourceBinaryOperatorSourceKind =
  | 'identical'
  | 'not_identical'
  | 'equal'
  | 'not_equal'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'modulo'
  | 'logical_and'
  | 'logical_or'
  | 'bitwise_or'
  | 'concat';

/** Canonical operation contract for projecting Laravel PHP AST operator evidence into semantic IR. */
export interface ResourceBinaryOperatorMappingOperationInterface {
  readonly map: (kind: ResourceBinaryOperatorSourceKind) => SemanticOperator['value'];
}
