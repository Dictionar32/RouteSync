import type {
  ExpressionCandidateAttempt,
  ExpressionCandidateContract,
  ExpressionCandidateResolution,
} from './scannerExpressionCandidateAlgebra';

/** Language-neutral expression shape selected by upstream reasoning. */
export type ExpressionStructure<Token, BinaryOperator, UnaryOperator> =
  | Readonly<{ readonly kind: 'short_ternary'; readonly condition: readonly Token[]; readonly fallback: readonly Token[] }>
  | Readonly<{ readonly kind: 'ternary'; readonly condition: readonly Token[]; readonly consequent: readonly Token[]; readonly alternative: readonly Token[] }>
  | Readonly<{ readonly kind: 'array_access'; readonly base: readonly Token[]; readonly index: readonly Token[] }>
  | Readonly<{ readonly kind: 'call'; readonly calleeKind: 'identifier' | 'callable'; readonly callee: readonly Token[]; readonly arguments: readonly Token[] }>
  | Readonly<{ readonly kind: 'binary'; readonly operator: BinaryOperator; readonly left: readonly Token[]; readonly right: readonly Token[] }>
  | Readonly<{ readonly kind: 'unary'; readonly operator: UnaryOperator; readonly operand: readonly Token[] }>;

/** A location refers to source evidence, not a scanner's numeric cursor. */
export type ExpressionEvidenceLocation<Token> =
  | Readonly<{ readonly kind: 'token'; readonly evidence: Token }>
  | Readonly<{ readonly kind: 'end_of_source' }>;

/** Closed judgment. Consumers cannot invent missing arbitration history. */
export type ExpressionStructureJudgment<Token, BinaryOperator, UnaryOperator> =
  | Readonly<{
      readonly kind: 'structured';
      readonly structure: ExpressionStructure<Token, BinaryOperator, UnaryOperator>;
      readonly provenance: Readonly<{ readonly ruleId: string; readonly candidatePriority: number; readonly sourceEvidence: readonly Token[]; readonly attempts: readonly ExpressionCandidateAttempt<string>[] }>;
      readonly attempts: readonly ExpressionCandidateAttempt<string>[];
    }>
  | Readonly<{ readonly kind: 'not_structured'; readonly rejectedRules: readonly string[]; readonly attempts: readonly ExpressionCandidateAttempt<string>[] }>
  | Readonly<{ readonly kind: 'malformed_source'; readonly ruleId: string; readonly location: ExpressionEvidenceLocation<Token>; readonly expected?: string; readonly actual: string; readonly attempts: readonly ExpressionCandidateAttempt<string>[] }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: ExpressionStructureContractViolationReason; readonly attempts?: readonly ExpressionCandidateAttempt<string>[] }>;

export type ExpressionStructureContractViolationReason =
  | 'duplicate_candidate_id'
  | 'invalid_priority'
  | 'duplicate_priority'
  | 'selected_candidate_without_structure'
  | 'terminal_candidate_without_judgment'
  | 'empty_operator_token'
  | 'duplicate_operator_token'
  | 'missing_operand';

/** Provider-supplied terminal evidence; only upstream may close it into a judgment. */
export type ExpressionStructureTerminalEvidence<Token> =
  | Readonly<{ readonly kind: 'malformed_source'; readonly location: ExpressionEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: ExpressionStructureContractViolationReason }>;

export type ExpressionStructureJudgmentRequest<Token, BinaryOperator, UnaryOperator, Id extends string, Value> = Readonly<{
  readonly contract: ExpressionCandidateContract<Id, Value>;
  readonly sourceEvidence: readonly Token[];
  readonly selectStructure: (value: Value) => ExpressionStructure<Token, BinaryOperator, UnaryOperator> | undefined;
  readonly selectTerminal?: (value: Value) => ExpressionStructureTerminalEvidence<Token> | undefined;
}>;

/** Public boundary between language evidence providers and upstream semantic judgment. */
export interface ExpressionStructureJudgmentInterface {
  readonly resolve: <Token, BinaryOperator, UnaryOperator, Id extends string, Value>(
    request: ExpressionStructureJudgmentRequest<Token, BinaryOperator, UnaryOperator, Id, Value>,
  ) => ExpressionStructureJudgment<Token, BinaryOperator, UnaryOperator>;
}

/** Keeps the algebra result explicit in the contract without exposing its implementation. */
export type ExpressionStructureResolution<Id extends string, Value> = ExpressionCandidateResolution<Id, Value>;
