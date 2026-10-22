/**
 * Consumer-facing token-structure contract. This module contains only typed
 * evidence and judgments; cursor-based implementation stays in the algebra.
 */

/** Public semantic evidence returned to scanner consumers; cursor arithmetic stays internal. */
export type TokenOccurrenceEvidence<Token> = Readonly<{
  readonly before: readonly Token[];
  readonly token: Token;
  readonly after: readonly Token[];
}>;

export type TokenEvidenceLocation<Token> =
  | Readonly<{ readonly kind: 'token'; readonly evidence: Token }>
  | Readonly<{ readonly kind: 'end_of_source' }>;

export type TokenOccurrenceJudgment<Token> =
  | Readonly<{ readonly kind: 'found'; readonly occurrence: TokenOccurrenceEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_found' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>;

export type TokenOccurrencesJudgment<Token> =
  | Readonly<{ readonly kind: 'complete'; readonly occurrences: readonly TokenOccurrenceEvidence<Token>[] }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>;

/** A delimiter-validated partition that preserves empty leading/trailing segments. */
export type TokenPartitionJudgment<Token> =
  | Readonly<{ readonly kind: 'partitioned'; readonly parts: readonly (readonly Token[])[] }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>;

export type DelimitedTokenEvidence<Token> = Readonly<{
  readonly opening: Token;
  readonly contents: readonly Token[];
  readonly closing: Token;
  readonly prefix: readonly Token[];
  readonly suffix: readonly Token[];
}>;

export type DelimitedTokenJudgment<Token> =
  | Readonly<{ readonly kind: 'matched'; readonly evidence: DelimitedTokenEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_found' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>;

export type ScannerTokenStructureQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
}>;

export interface ScannerTokenStructureInterface {
  readonly locateTopLevel: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly target: string }>) => TokenOccurrenceJudgment<Token>;
  readonly locateTopLevelCandidates: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly targets: readonly string[] }>) => TokenOccurrencesJudgment<Token>;
  readonly partitionTopLevel: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly separator: string }>) => TokenPartitionJudgment<Token>;
  readonly matchLeadingDelimiter: <Token>(input: ScannerTokenStructureQuery<Token>) => DelimitedTokenJudgment<Token>;
  readonly matchTrailingDelimiter: <Token>(input: ScannerTokenStructureQuery<Token>) => DelimitedTokenJudgment<Token>;
}

