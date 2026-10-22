/** Typed contract for expression-root selection. Lexical spellings remain source evidence;
 * precedence and associativity are represented by unique semantic identities and relations.
 */
import type { TokenEvidenceLocation, TokenOccurrenceEvidence, TokenOccurrencesJudgment } from './scannerTokenStructureAlgebra';

export const EXPRESSION_OPERATOR_RESOLVED: unique symbol = Symbol('expression.operator.resolved');
export const EXPRESSION_OPERATOR_NOT_FOUND: unique symbol = Symbol('expression.operator.not-found');
export const EXPRESSION_OPERATOR_MALFORMED: unique symbol = Symbol('expression.operator.malformed');
export const EXPRESSION_OPERATOR_CONTRACT_VIOLATION: unique symbol = Symbol('expression.operator.contract-violation');

export const EXPRESSION_ASSOCIATIVITY_LEFT: unique symbol = Symbol('expression.associativity.left');
export const EXPRESSION_ASSOCIATIVITY_RIGHT: unique symbol = Symbol('expression.associativity.right');
export const EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE: unique symbol = Symbol('expression.associativity.non-associative');
export type ExpressionAssociativity = typeof EXPRESSION_ASSOCIATIVITY_LEFT | typeof EXPRESSION_ASSOCIATIVITY_RIGHT | typeof EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE;

export const EXPRESSION_OPERATOR_EMPTY_SPELLING: unique symbol = Symbol('expression.operator.empty-spelling');
export const EXPRESSION_OPERATOR_DUPLICATE_SPELLING: unique symbol = Symbol('expression.operator.duplicate-spelling');
export const EXPRESSION_OPERATOR_UNKNOWN_PRECEDENCE_TIER: unique symbol = Symbol('expression.operator.unknown-precedence-tier');
export const EXPRESSION_OPERATOR_PRECEDENCE_CYCLE: unique symbol = Symbol('expression.operator.precedence-cycle');
export const EXPRESSION_OPERATOR_PRECEDENCE_INCOMPARABLE: unique symbol = Symbol('expression.operator.precedence-incomparable');
export const EXPRESSION_OPERATOR_CONFLICTING_ASSOCIATIVITY: unique symbol = Symbol('expression.operator.conflicting-associativity');
export type ExpressionOperatorContractViolation =
  | typeof EXPRESSION_OPERATOR_EMPTY_SPELLING
  | typeof EXPRESSION_OPERATOR_DUPLICATE_SPELLING
  | typeof EXPRESSION_OPERATOR_UNKNOWN_PRECEDENCE_TIER
  | typeof EXPRESSION_OPERATOR_PRECEDENCE_CYCLE
  | typeof EXPRESSION_OPERATOR_PRECEDENCE_INCOMPARABLE
  | typeof EXPRESSION_OPERATOR_CONFLICTING_ASSOCIATIVITY;

export type ExpressionPrecedenceRelation<Tier extends symbol> = Readonly<{ readonly weaker: Tier; readonly stronger: Tier }>;
export type ExpressionOperatorRule<Operator, Tier extends symbol> = Readonly<{
  /** Exact source-language spelling; not the semantic identity of the operator. */
  readonly token: string;
  readonly operator: Operator;
  readonly tier: Tier;
  readonly associativity: ExpressionAssociativity;
}>;

export type ExpressionOperatorResolution<Operator, Token = unknown, Tier extends symbol = symbol> =
  | Readonly<{ readonly kind: typeof EXPRESSION_OPERATOR_RESOLVED; readonly operator: Operator; readonly token: string; readonly before: readonly Token[]; readonly operatorEvidence: Token; readonly after: readonly Token[]; readonly tier: Tier; readonly associativity: ExpressionAssociativity }>
  | Readonly<{ readonly kind: typeof EXPRESSION_OPERATOR_NOT_FOUND }>
  | Readonly<{ readonly kind: typeof EXPRESSION_OPERATOR_MALFORMED; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: typeof EXPRESSION_OPERATOR_CONTRACT_VIOLATION; readonly reason: ExpressionOperatorContractViolation }>;

export type ExpressionOperatorContract<Token, Operator, Tier extends symbol> = Readonly<{
  readonly tokens: readonly Token[];
  readonly rules: readonly ExpressionOperatorRule<Operator, Tier>[];
  readonly precedence: readonly ExpressionPrecedenceRelation<Tier>[];
  readonly tokenValue: (token: Token) => string;
  readonly collectTopLevelCandidates: (tokens: readonly Token[], targets: readonly string[]) => TokenOccurrencesJudgment<Token>;
}>;

export interface ScannerExpressionOperatorInterface {
  readonly resolve: <Token, Operator, Tier extends symbol>(contract: ExpressionOperatorContract<Token, Operator, Tier>) => ExpressionOperatorResolution<Operator, Token, Tier>;
}
export interface ScannerExpressionOperatorAlgebra extends ScannerExpressionOperatorInterface {}
