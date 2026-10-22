import type { SemanticDecisionPrecedence } from './semanticDecisionInterface';

/** Closed source-evidence contract for selecting PHP expression candidates. */
import type { TokenOccurrenceEvidence } from './scannerTokenStructureAlgebra';

export const SCANNER_EXPRESSION_MATCH: unique symbol = Symbol('scanner.expression.match');
export const SCANNER_EXPRESSION_CLOSURE: unique symbol = Symbol('scanner.expression.closure');
export const SCANNER_EXPRESSION_ARROW: unique symbol = Symbol('scanner.expression.arrow');
export const SCANNER_EXPRESSION_INSTANCEOF: unique symbol = Symbol('scanner.expression.instanceof');
export const SCANNER_EXPRESSION_CAST: unique symbol = Symbol('scanner.expression.cast');
export const SCANNER_EXPRESSION_PARENTHESIZED: unique symbol = Symbol('scanner.expression.parenthesized');
export const SCANNER_EXPRESSION_ASSIGNMENT: unique symbol = Symbol('scanner.expression.assignment');
export const SCANNER_EXPRESSION_SINGLE: unique symbol = Symbol('scanner.expression.single');
export const SCANNER_EXPRESSION_COMPOUND: unique symbol = Symbol('scanner.expression.compound');
export const SCANNER_EXPRESSION_INLINE_ARRAY: unique symbol = Symbol('scanner.expression.inline-array');
export const SCANNER_EXPRESSION_CLASS_CONSTANT: unique symbol = Symbol('scanner.expression.class-constant');
export const SCANNER_EXPRESSION_CLASS_REFERENCE: unique symbol = Symbol('scanner.expression.class-reference');
export const SCANNER_EXPRESSION_CONSTRUCT: unique symbol = Symbol('scanner.expression.construct');
export const SCANNER_EXPRESSION_STATIC_CALL: unique symbol = Symbol('scanner.expression.static-call');
export const SCANNER_EXPRESSION_MEMBER: unique symbol = Symbol('scanner.expression.member');

export const SCANNER_EXPRESSION_CANDIDATE = Object.freeze({
  match: SCANNER_EXPRESSION_MATCH,
  closure: SCANNER_EXPRESSION_CLOSURE,
  arrow: SCANNER_EXPRESSION_ARROW,
  instanceof: SCANNER_EXPRESSION_INSTANCEOF,
  cast: SCANNER_EXPRESSION_CAST,
  parenthesized: SCANNER_EXPRESSION_PARENTHESIZED,
  assignment: SCANNER_EXPRESSION_ASSIGNMENT,
  single: SCANNER_EXPRESSION_SINGLE,
  compound: SCANNER_EXPRESSION_COMPOUND,
  inlineArray: SCANNER_EXPRESSION_INLINE_ARRAY,
  classConstant: SCANNER_EXPRESSION_CLASS_CONSTANT,
  classReference: SCANNER_EXPRESSION_CLASS_REFERENCE,
  construct: SCANNER_EXPRESSION_CONSTRUCT,
  staticCall: SCANNER_EXPRESSION_STATIC_CALL,
  member: SCANNER_EXPRESSION_MEMBER,
});
export type ScannerExpressionCandidateId = typeof SCANNER_EXPRESSION_CANDIDATE[keyof typeof SCANNER_EXPRESSION_CANDIDATE];

/** Canonical semantic precedence policy for PHP expression classification.
 * Owned upstream so scanner runtime supplies syntax handlers, not rule ordering.
 */
export const SCANNER_AST_EXPRESSION_PRECEDENCE: readonly SemanticDecisionPrecedence<ScannerExpressionCandidateId>[] = Object.freeze([
  { before: SCANNER_EXPRESSION_MATCH, after: SCANNER_EXPRESSION_CLOSURE },
  { before: SCANNER_EXPRESSION_CLOSURE, after: SCANNER_EXPRESSION_ARROW },
  { before: SCANNER_EXPRESSION_ARROW, after: SCANNER_EXPRESSION_INSTANCEOF },
  { before: SCANNER_EXPRESSION_INSTANCEOF, after: SCANNER_EXPRESSION_CAST },
  { before: SCANNER_EXPRESSION_CAST, after: SCANNER_EXPRESSION_PARENTHESIZED },
  { before: SCANNER_EXPRESSION_PARENTHESIZED, after: SCANNER_EXPRESSION_ASSIGNMENT },
  { before: SCANNER_EXPRESSION_ASSIGNMENT, after: SCANNER_EXPRESSION_SINGLE },
  { before: SCANNER_EXPRESSION_SINGLE, after: SCANNER_EXPRESSION_COMPOUND },
  { before: SCANNER_EXPRESSION_COMPOUND, after: SCANNER_EXPRESSION_INLINE_ARRAY },
  { before: SCANNER_EXPRESSION_INLINE_ARRAY, after: SCANNER_EXPRESSION_CLASS_CONSTANT },
  { before: SCANNER_EXPRESSION_CLASS_CONSTANT, after: SCANNER_EXPRESSION_CLASS_REFERENCE },
  { before: SCANNER_EXPRESSION_CLASS_REFERENCE, after: SCANNER_EXPRESSION_CONSTRUCT },
  { before: SCANNER_EXPRESSION_CONSTRUCT, after: SCANNER_EXPRESSION_STATIC_CALL },
  { before: SCANNER_EXPRESSION_STATIC_CALL, after: SCANNER_EXPRESSION_MEMBER },
]);

export type ScannerExpressionCandidateEvidence<Token> = Readonly<{
  readonly id: ScannerExpressionCandidateId;
  readonly evidence: readonly Token[];
  /** Structural evidence is forwarded to the consumer; it is not re-discovered there. */
  readonly operatorEvidence?: readonly TokenOccurrenceEvidence<Token>[];
}>;

export type ScannerExpressionCandidateQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  /** Lexical observation only; semantic identity is carried by ScannerExpressionCandidateId. */
  readonly tokenValue: (token: Token) => string;
  readonly tokenKind: (token: Token) => string;
}>;

export type ScannerExpressionCandidateJudgment<Token> =
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{
      readonly kind: 'resolved';
      readonly candidates: readonly ScannerExpressionCandidateEvidence<Token>[];
    }>;

export interface ScannerExpressionCandidateInterface {
  readonly resolve: <Token>(query: ScannerExpressionCandidateQuery<Token>) => ScannerExpressionCandidateJudgment<Token>;
}
