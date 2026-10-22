/**
 * Typed semantic operator vocabulary and closed evidence judgment.
 * Lexemes are source observations; operator identity and judgment variants are unique symbols.
 */
import type { TokenOccurrenceEvidence, TokenEvidenceLocation } from './scannerTokenStructureAlgebra';

export const SCANNER_AST_OPERATOR_FAT_ARROW: unique symbol = Symbol('scanner.ast.operator.fat-arrow');
export const SCANNER_AST_OPERATOR_AS: unique symbol = Symbol('scanner.ast.operator.as');
export const SCANNER_AST_OPERATOR_INSTANCEOF: unique symbol = Symbol('scanner.ast.operator.instanceof');

export type ScannerAstOperatorIdentity =
  | typeof SCANNER_AST_OPERATOR_FAT_ARROW
  | typeof SCANNER_AST_OPERATOR_AS
  | typeof SCANNER_AST_OPERATOR_INSTANCEOF;

export type ScannerAstOperatorDescriptor<Identity extends ScannerAstOperatorIdentity = ScannerAstOperatorIdentity> = Readonly<{
  readonly identity: Identity;
  /** Lexical spelling from the source language, not the semantic identity. */
  readonly spelling: string;
}>;

export const SCANNER_AST_OPERATOR = Object.freeze({
  fatArrow: Object.freeze({ identity: SCANNER_AST_OPERATOR_FAT_ARROW, spelling: '=>' }),
  as: Object.freeze({ identity: SCANNER_AST_OPERATOR_AS, spelling: 'as' }),
  instanceof: Object.freeze({ identity: SCANNER_AST_OPERATOR_INSTANCEOF, spelling: 'instanceof' }),
});

export const SCANNER_AST_OPERATOR_EVIDENCE_FOUND: unique symbol = Symbol('scanner.ast.operator.evidence.found');
export const SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND: unique symbol = Symbol('scanner.ast.operator.evidence.not-found');
export const SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED: unique symbol = Symbol('scanner.ast.operator.evidence.malformed');
export const SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION: unique symbol = Symbol('scanner.ast.operator.evidence.contract-violation');

export type ScannerAstOperatorEvidenceJudgment<Token> =
  | Readonly<{ readonly kind: typeof SCANNER_AST_OPERATOR_EVIDENCE_FOUND; readonly operator: ScannerAstOperatorDescriptor; readonly occurrence: TokenOccurrenceEvidence<Token> }>
  | Readonly<{ readonly kind: typeof SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND; readonly operator: ScannerAstOperatorDescriptor }>
  | Readonly<{ readonly kind: typeof SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED; readonly operator: ScannerAstOperatorDescriptor; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: typeof SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION; readonly reason: typeof SCANNER_AST_OPERATOR_DUPLICATE_IDENTITY | typeof SCANNER_AST_OPERATOR_EMPTY_SPELLING }>;

export const SCANNER_AST_OPERATOR_DUPLICATE_IDENTITY: unique symbol = Symbol('scanner.ast.operator.duplicate-identity');
export const SCANNER_AST_OPERATOR_EMPTY_SPELLING: unique symbol = Symbol('scanner.ast.operator.empty-spelling');

export type ScannerAstOperatorEvidenceQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly operator: ScannerAstOperatorDescriptor;
  readonly tokenValue: (token: Token) => string;
}>;

export interface ScannerAstOperatorEvidenceInterface {
  readonly resolve: <Token>(query: ScannerAstOperatorEvidenceQuery<Token>) => ScannerAstOperatorEvidenceJudgment<Token>;
}
