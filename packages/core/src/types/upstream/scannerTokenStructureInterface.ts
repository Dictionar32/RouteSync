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

export interface TokenOccurrenceContinuationHandlers<Token, Result> {
  readonly found: (occurrence: TokenOccurrenceEvidence<Token>) => Result;
  readonly notFound: () => Result;
  readonly malformed: (failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => Result;
}

/** Each occurrence judgment owns the domain operation that acts on its result. */
export type TokenOccurrenceJudgment<Token> =
  | Readonly<{
      readonly kind: 'found';
      readonly occurrence: TokenOccurrenceEvidence<Token>;
      readonly continueWith: <Result>(handlers: TokenOccurrenceContinuationHandlers<Token, Result>) => Result;
    }>
  | Readonly<{
      readonly kind: 'not_found';
      readonly continueWith: <Result>(handlers: TokenOccurrenceContinuationHandlers<Token, Result>) => Result;
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly location: TokenEvidenceLocation<Token>;
      readonly expected?: string;
      readonly actual: string;
      readonly continueWith: <Result>(handlers: TokenOccurrenceContinuationHandlers<Token, Result>) => Result;
    }>;

export interface TokenOccurrencesContinuationHandlers<Token, Result> {
  readonly complete: (occurrences: readonly TokenOccurrenceEvidence<Token>[]) => Result;
  readonly malformed: (failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => Result;
}

export type TokenOccurrencesJudgment<Token> =
  | Readonly<{ readonly kind: 'complete'; readonly occurrences: readonly TokenOccurrenceEvidence<Token>[]; readonly continueWith: <Result>(handlers: TokenOccurrencesContinuationHandlers<Token, Result>) => Result }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string; readonly continueWith: <Result>(handlers: TokenOccurrencesContinuationHandlers<Token, Result>) => Result }>;

export interface TokenPartitionContinuationHandlers<Token, Result> {
  readonly partitioned: (parts: readonly (readonly Token[])[]) => Result;
  readonly malformed: (failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => Result;
}

/** A delimiter-validated partition that preserves empty leading/trailing segments. */
export type TokenPartitionJudgment<Token> =
  | Readonly<{ readonly kind: 'partitioned'; readonly parts: readonly (readonly Token[])[]; readonly continueWith: <Result>(handlers: TokenPartitionContinuationHandlers<Token, Result>) => Result }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string; readonly continueWith: <Result>(handlers: TokenPartitionContinuationHandlers<Token, Result>) => Result }>;

export type DelimitedTokenEvidence<Token> = Readonly<{
  readonly opening: Token;
  readonly contents: readonly Token[];
  readonly closing: Token;
  readonly prefix: readonly Token[];
  readonly suffix: readonly Token[];
}>;

export interface DelimitedTokenContinuationHandlers<Token, Result> {
  readonly matched: (evidence: DelimitedTokenEvidence<Token>) => Result;
  readonly notFound: () => Result;
  readonly malformed: (failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => Result;
}

export type DelimitedTokenJudgment<Token> =
  | Readonly<{ readonly kind: 'matched'; readonly evidence: DelimitedTokenEvidence<Token>; readonly continueWith: <Result>(handlers: DelimitedTokenContinuationHandlers<Token, Result>) => Result }>
  | Readonly<{ readonly kind: 'not_found'; readonly continueWith: <Result>(handlers: DelimitedTokenContinuationHandlers<Token, Result>) => Result }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string; readonly continueWith: <Result>(handlers: DelimitedTokenContinuationHandlers<Token, Result>) => Result }>;

export interface ScannerJudgmentOperationsInterface {
  readonly occurrenceFound: <Token>(occurrence: TokenOccurrenceEvidence<Token>) => TokenOccurrenceJudgment<Token>;
  readonly occurrenceNotFound: <Token>() => TokenOccurrenceJudgment<Token>;
  readonly occurrenceMalformed: <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => TokenOccurrenceJudgment<Token>;
  readonly occurrencesComplete: <Token>(occurrences: readonly TokenOccurrenceEvidence<Token>[]) => TokenOccurrencesJudgment<Token>;
  readonly occurrencesMalformed: <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => TokenOccurrencesJudgment<Token>;
  readonly partitioned: <Token>(parts: readonly (readonly Token[])[]) => TokenPartitionJudgment<Token>;
  readonly partitionMalformed: <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => TokenPartitionJudgment<Token>;
  readonly delimiterMatched: <Token>(evidence: DelimitedTokenEvidence<Token>) => DelimitedTokenJudgment<Token>;
  readonly delimiterNotFound: <Token>() => DelimitedTokenJudgment<Token>;
  readonly delimiterMalformed: <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>) => DelimitedTokenJudgment<Token>;
}

const occurrenceFound = <Token>(occurrence: TokenOccurrenceEvidence<Token>): TokenOccurrenceJudgment<Token> => Object.freeze({
  kind: 'found' as const, occurrence,
  continueWith: <Result>(handlers: TokenOccurrenceContinuationHandlers<Token, Result>): Result => handlers.found(occurrence),
});
const occurrenceNotFound = <Token>(): TokenOccurrenceJudgment<Token> => Object.freeze({
  kind: 'not_found' as const,
  continueWith: <Result>(handlers: TokenOccurrenceContinuationHandlers<Token, Result>): Result => handlers.notFound(),
});
const occurrenceMalformed = <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>): TokenOccurrenceJudgment<Token> => Object.freeze({
  kind: 'malformed' as const, ...failure,
  continueWith: <Result>(handlers: TokenOccurrenceContinuationHandlers<Token, Result>): Result => handlers.malformed(failure),
});
const occurrencesComplete = <Token>(occurrences: readonly TokenOccurrenceEvidence<Token>[]): TokenOccurrencesJudgment<Token> => Object.freeze({
  kind: 'complete' as const, occurrences,
  continueWith: <Result>(handlers: TokenOccurrencesContinuationHandlers<Token, Result>): Result => handlers.complete(occurrences),
});
const occurrencesMalformed = <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>): TokenOccurrencesJudgment<Token> => Object.freeze({
  kind: 'malformed' as const, ...failure,
  continueWith: <Result>(handlers: TokenOccurrencesContinuationHandlers<Token, Result>): Result => handlers.malformed(failure),
});
const partitioned = <Token>(parts: readonly (readonly Token[])[]): TokenPartitionJudgment<Token> => Object.freeze({
  kind: 'partitioned' as const, parts,
  continueWith: <Result>(handlers: TokenPartitionContinuationHandlers<Token, Result>): Result => handlers.partitioned(parts),
});
const partitionMalformed = <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>): TokenPartitionJudgment<Token> => Object.freeze({
  kind: 'malformed' as const, ...failure,
  continueWith: <Result>(handlers: TokenPartitionContinuationHandlers<Token, Result>): Result => handlers.malformed(failure),
});
const delimiterMatched = <Token>(evidence: DelimitedTokenEvidence<Token>): DelimitedTokenJudgment<Token> => Object.freeze({
  kind: 'matched' as const, evidence,
  continueWith: <Result>(handlers: DelimitedTokenContinuationHandlers<Token, Result>): Result => handlers.matched(evidence),
});
const delimiterNotFound = <Token>(): DelimitedTokenJudgment<Token> => Object.freeze({
  kind: 'not_found' as const,
  continueWith: <Result>(handlers: DelimitedTokenContinuationHandlers<Token, Result>): Result => handlers.notFound(),
});
const delimiterMalformed = <Token>(failure: Readonly<{ readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>): DelimitedTokenJudgment<Token> => Object.freeze({
  kind: 'malformed' as const, ...failure,
  continueWith: <Result>(handlers: DelimitedTokenContinuationHandlers<Token, Result>): Result => handlers.malformed(failure),
});

export const scannerJudgmentOperations: ScannerJudgmentOperationsInterface = Object.freeze({
  occurrenceFound, occurrenceNotFound, occurrenceMalformed,
  occurrencesComplete, occurrencesMalformed,
  partitioned, partitionMalformed,
  delimiterMatched, delimiterNotFound, delimiterMalformed,
});

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

