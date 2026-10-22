/**
 * Public, index-free contract for assignment decomposition.
 *
 * This file deliberately defines the boundary before the assignment algebra
 * and scanner wiring are migrated. Consumers exchange token evidence and
 * partitions; numeric cursor positions are not part of this contract.
 */
import type {
  TokenEvidenceLocation,
  TokenOccurrenceEvidence,
  TokenOccurrenceJudgment,
} from './scannerTokenStructureAlgebra';

export type AssignmentOperatorRule<OperatorKind extends string> = Readonly<{
  readonly token: string;
  readonly kind: OperatorKind;
}>;

export type AssignmentPartsComponentJudgment<Value> =
  | Readonly<{ readonly kind: 'resolved'; readonly value: Value }>
  | Readonly<{ readonly kind: 'unresolved'; readonly reason: 'not_recognized' }>;

export type AssignmentPartsValue<Target, Value, OperatorKind extends string, Token> = Readonly<{
  readonly target: Target;
  readonly operator: Readonly<{ readonly kind: OperatorKind }>;
  readonly reference: Readonly<{ readonly kind: 'by_reference' | 'by_value' }>;
  readonly value: Value;
  readonly evidence: TokenOccurrenceEvidence<Token>;
}>;

export type AssignmentPartsJudgment<Target, Value, OperatorKind extends string, Token> =
  | Readonly<{
      readonly kind: 'resolved';
      readonly value: AssignmentPartsValue<Target, Value, OperatorKind, Token>;
    }>
  | Readonly<{
      readonly kind: 'unresolved';
      readonly reason: 'no_assignment_operator' | 'invalid_operator_position' | 'invalid_target' | 'empty_value';
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly location: TokenEvidenceLocation<Token>;
      readonly expected?: string;
      readonly actual: string;
    }>
  | Readonly<{
      readonly kind: 'contract_violation';
      readonly reason: 'invalid_operator_rule' | 'missing_operator_evidence_provider';
    }>;

export type AssignmentPartsQuery<Token, Target, Value, OperatorKind extends string> = Readonly<{
  readonly tokens: readonly Token[];
  readonly operators: readonly AssignmentOperatorRule<OperatorKind>[];
  /** Existing source partitions take precedence over any fallback locator. */
  readonly operatorEvidence?: readonly TokenOccurrenceEvidence<Token>[];
  readonly tokenValue?: (token: Token) => string;
  readonly locateOperator?: (
    tokens: readonly Token[],
    token: string,
  ) => TokenOccurrenceJudgment<Token>;
  readonly classifyTarget: (tokens: readonly Token[]) => AssignmentPartsComponentJudgment<Target>;
  readonly classifyValue: (tokens: readonly Token[]) => AssignmentPartsComponentJudgment<Value>;
  readonly isReferenceMarker: (token: Token | undefined) => boolean;
}>;

/** The intended semantic API; implementations are supplied by the algebra. */
export interface ScannerAssignmentPartsInterface {
  readonly resolve: <Token, Target, Value, OperatorKind extends string>(
    query: AssignmentPartsQuery<Token, Target, Value, OperatorKind>,
  ) => AssignmentPartsJudgment<Target, Value, OperatorKind, Token>;
}
