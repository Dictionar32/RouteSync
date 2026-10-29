/**
 * Language-neutral token-structure algebra. Owns delimiter validation and
 * top-level token search; a scanner supplies only token observations.
 */


/** Scanner-owned cursor/navigation semantics; deliberately not a shared relation foundation. */
interface ScannerTokenNavigationInterface {
  readonly advance: (cursor: number, displacement: -1 | 1) => number;
  readonly select: <Result>(predicate: boolean, accepted: () => Result, rejected: () => Result) => Result;
}

const scannerTokenNavigation: ScannerTokenNavigationInterface = Object.freeze({
  advance: (cursor: number, displacement: -1 | 1): number => cursor + displacement,
  select: <Result>(predicate: boolean, accepted: () => Result, rejected: () => Result): Result =>
    predicate ? accepted() : rejected(),
});

type Delimiter = Readonly<{ readonly opener: string; readonly closer: string }>;
export type TokenStructureResolution =
  | Readonly<{ readonly kind: 'found'; readonly index: number }>
  | Readonly<{ readonly kind: 'not_found'; readonly index: number }>
  | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string }>;

export type TopLevelTokenSearch<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly target: string;
  readonly start?: number;
  readonly tokenValue: (token: Token) => string;
}>;
export type DelimiterMatchSearch<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly index: number;
  readonly tokenValue: (token: Token) => string;
}>;
export type TopLevelTokenCandidate = Readonly<{ readonly token: string; readonly index: number }>;
export type TopLevelTokenCandidatesInput<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly targets: readonly string[];
  readonly tokenValue: (token: Token) => string;
}>;
export type TopLevelTokenCandidatesResolution =
  | Readonly<{ readonly kind: 'complete'; readonly matches: readonly TopLevelTokenCandidate[] }>
  | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string }>;


import type {
  DelimitedTokenJudgment,
  ScannerTokenStructureInterface,
  ScannerTokenStructureQuery,
  TokenEvidenceLocation,
  TokenOccurrenceJudgment,
  TokenOccurrencesJudgment,
  TokenPartitionJudgment,
} from './scannerTokenStructureInterface';
import { scannerJudgmentOperations } from './scannerTokenStructureInterface';
export type {
  TokenOccurrenceEvidence,
  DelimitedTokenJudgment,
  ScannerTokenStructureInterface,
  ScannerTokenStructureQuery,
  TokenEvidenceLocation,
  TokenOccurrenceJudgment,
  TokenOccurrencesJudgment,
  TokenPartitionJudgment,
} from './scannerTokenStructureInterface';


export interface ScannerTokenStructureAlgebra {
  readonly findTopLevel: <Token>(input: TopLevelTokenSearch<Token>) => TokenStructureResolution;
  readonly findTopLevelCandidates: <Token>(input: TopLevelTokenCandidatesInput<Token>) => TopLevelTokenCandidatesResolution;
  readonly findMatchingClose: <Token>(input: DelimiterMatchSearch<Token>) => TokenStructureResolution;
  readonly findMatchingOpen: <Token>(input: DelimiterMatchSearch<Token>) => TokenStructureResolution;
}

const delimiters: readonly Delimiter[] = Object.freeze([
  { opener: '(', closer: ')' },
  { opener: '[', closer: ']' },
  { opener: '{', closer: '}' },
]);
const openerFor = (value: string): Delimiter | undefined => delimiters.find(entry => entry.opener === value);
const isCloser = (value: string): boolean => delimiters.some(entry => entry.closer === value);
const expectedCloser = (value: string): string | undefined => openerFor(value)?.closer;

const scan = <Token>(
  input: TopLevelTokenSearch<Token>,
  index: number,
  stack: readonly string[],
  candidateIndex?: number,
): TokenStructureResolution => scannerTokenNavigation.select(index < input.tokens.length, () => {
  const value = input.tokenValue(input.tokens[index]);
  const top = stack[stack.length - 1];
  return scannerTokenNavigation.select(isCloser(value), () => scannerTokenNavigation.select(
    top === value,
    () => scan(input, scannerTokenNavigation.advance(index, 1), stack.slice(0, -1), candidateIndex),
    () => ({ kind: 'malformed' as const, index, expected: top, actual: value }),
  ), () => scannerTokenNavigation.select(openerFor(value) !== undefined, () => scan(
    input,
    scannerTokenNavigation.advance(index, 1),
    [...stack, expectedCloser(value) ?? ''],
    candidateIndex,
  ), () => scannerTokenNavigation.select(
    stack.length === 0 && value === input.target && candidateIndex === undefined,
    () => scan(input, scannerTokenNavigation.advance(index, 1), stack, index),
    () => scan(input, scannerTokenNavigation.advance(index, 1), stack, candidateIndex),
  )));
}, () => scannerTokenNavigation.select<TokenStructureResolution>(
  stack.length === 0,
  () => scannerTokenNavigation.select<TokenStructureResolution>(candidateIndex !== undefined,
    () => ({ kind: 'found' as const, index: candidateIndex ?? input.tokens.length }),
    () => ({ kind: 'not_found' as const, index: input.tokens.length })),
  () => ({ kind: 'malformed' as const, index: input.tokens.length, expected: stack[stack.length - 1], actual: '<end-of-input>' }),
));


const scanCandidates = <Token>(
  input: TopLevelTokenCandidatesInput<Token>,
  index: number,
  stack: readonly string[],
  matches: readonly TopLevelTokenCandidate[],
): TopLevelTokenCandidatesResolution => scannerTokenNavigation.select(index < input.tokens.length, () => {
  const value = input.tokenValue(input.tokens[index]);
  const top = stack[stack.length - 1];
  return scannerTokenNavigation.select(isCloser(value), () => scannerTokenNavigation.select(
    top === value,
    () => scanCandidates(input, scannerTokenNavigation.advance(index, 1), stack.slice(0, -1), matches),
    () => ({ kind: 'malformed' as const, index, expected: top, actual: value }),
  ), () => scannerTokenNavigation.select(openerFor(value) !== undefined, () => scanCandidates(
    input,
    scannerTokenNavigation.advance(index, 1),
    [...stack, expectedCloser(value) ?? ''],
    matches,
  ), () => {
    const matched = stack.length === 0 && input.targets.includes(value);
    return scanCandidates(
      input,
      scannerTokenNavigation.advance(index, 1),
      stack,
      matched ? [...matches, { token: value, index }] : matches,
    );
  }));
}, () => scannerTokenNavigation.select<TopLevelTokenCandidatesResolution>(
  stack.length === 0,
  () => ({ kind: 'complete' as const, matches }),
  () => ({ kind: 'malformed' as const, index: input.tokens.length, expected: stack[stack.length - 1], actual: '<end-of-input>' }),
));

const findMatchingClose = <Token>(input: DelimiterMatchSearch<Token>): TokenStructureResolution => {
  const opener = input.tokens[input.index] === undefined ? undefined : input.tokenValue(input.tokens[input.index]);
  const firstDelimiter = opener === undefined ? undefined : openerFor(opener);
  if (input.index < 0 || input.index >= input.tokens.length || firstDelimiter === undefined) {
    return { kind: 'malformed', index: input.index, expected: '<opening-delimiter>', actual: opener ?? '<out-of-range>' };
  }
  const scanClose = (index: number, stack: readonly string[]): TokenStructureResolution => scannerTokenNavigation.select(index < input.tokens.length, () => {
    const value = input.tokenValue(input.tokens[index]);
    const top = stack[stack.length - 1];
    return scannerTokenNavigation.select(isCloser(value), () => scannerTokenNavigation.select(closerMatches(value, top),
      () => scannerTokenNavigation.select(stack.length === 1,
        () => ({ kind: 'found' as const, index }),
        () => scanClose(scannerTokenNavigation.advance(index, 1), stack.slice(0, -1))),
      () => ({ kind: 'malformed' as const, index, expected: top, actual: value })),
    () => scannerTokenNavigation.select(openerFor(value) !== undefined, () => scanClose(
      scannerTokenNavigation.advance(index, 1),
      [...stack, expectedCloser(value) ?? ''],
    ), () => scanClose(scannerTokenNavigation.advance(index, 1), stack)));
  }, () => ({ kind: 'malformed' as const, index: input.tokens.length, expected: stack[stack.length - 1], actual: '<end-of-input>' }));
  return scanClose(scannerTokenNavigation.advance(input.index, 1), [firstDelimiter.closer]);
};

const findMatchingOpen = <Token>(input: DelimiterMatchSearch<Token>): TokenStructureResolution => {
  const closer = input.tokens[input.index] === undefined ? undefined : input.tokenValue(input.tokens[input.index]);
  const firstDelimiter = closer === undefined ? undefined : delimiters.find(entry => entry.closer === closer);
  if (input.index < 0 || input.index >= input.tokens.length || firstDelimiter === undefined) {
    return { kind: 'not_found', index: input.index };
  }
  const scanOpen = (index: number, stack: readonly string[]): TokenStructureResolution => scannerTokenNavigation.select(index >= 0, () => {
    const value = input.tokenValue(input.tokens[index]);
    const top = stack[stack.length - 1];
    const opener = openerFor(value);
    const matchingOpen = delimiters.find(entry => entry.closer === value)?.opener;
    return scannerTokenNavigation.select(opener !== undefined, () => scannerTokenNavigation.select(opener?.opener === top,
      () => scannerTokenNavigation.select(stack.length === 1,
        () => ({ kind: 'found' as const, index }),
        () => scanOpen(scannerTokenNavigation.advance(index, -1), stack.slice(0, -1))),
      () => ({ kind: 'malformed' as const, index, expected: top, actual: value })),
    () => scannerTokenNavigation.select(matchingOpen !== undefined, () => scanOpen(
      scannerTokenNavigation.advance(index, -1),
      [...stack, matchingOpen ?? ''],
    ), () => scanOpen(scannerTokenNavigation.advance(index, -1), stack)));
  }, () => ({ kind: 'malformed' as const, index: -1, expected: stack[stack.length - 1], actual: '<start-of-input>' }));
  return scanOpen(scannerTokenNavigation.advance(input.index, -1), [firstDelimiter.opener]);
};

const closerMatches = (value: string, expected: string | undefined): boolean => value === expected;

export const scannerTokenStructureAlgebra: ScannerTokenStructureAlgebra = Object.freeze({
  findTopLevel: <Token>(input: TopLevelTokenSearch<Token>): TokenStructureResolution => scannerTokenNavigation.select(
    (input.start ?? 0) >= 0 && (input.start ?? 0) <= input.tokens.length,
    () => scan(input, input.start ?? 0, []),
    () => ({ kind: 'malformed' as const, index: input.start ?? 0, expected: '<valid-index>', actual: String(input.start) }),
  ),
  findTopLevelCandidates: <Token>(input: TopLevelTokenCandidatesInput<Token>): TopLevelTokenCandidatesResolution => scanCandidates(input, 0, [], []),
  findMatchingClose,
  findMatchingOpen,
});


const tokenLocation = <Token>(tokens: readonly Token[], index: number): TokenEvidenceLocation<Token> => {
  const evidence = tokens[index];
  return evidence === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence };
};

/**
 * Consumer-facing interface. It returns source partitions and typed judgments,
 * never cursor numbers. Numeric offsets remain an implementation detail of the
 * underlying token-sequence algorithm.
 */
export const scannerTokenStructureInterface: ScannerTokenStructureInterface = Object.freeze({
  locateTopLevel: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly target: string }>): TokenOccurrenceJudgment<Token> => {
    const resolution = scannerTokenStructureAlgebra.findTopLevel({ ...input, target: input.target, tokenValue: input.tokenValue });
    switch (resolution.kind) {
      case 'not_found': return scannerJudgmentOperations.occurrenceNotFound<Token>();
      case 'malformed': return scannerJudgmentOperations.occurrenceMalformed({ location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual });
      case 'found': {
        const token = input.tokens[resolution.index];
        return token === undefined
          ? scannerJudgmentOperations.occurrenceMalformed({ location: { kind: 'end_of_source' }, expected: input.target, actual: '<end-of-source>' })
          : scannerJudgmentOperations.occurrenceFound({ before: input.tokens.slice(0, resolution.index), token, after: input.tokens.slice(resolution.index + 1) });
      }
    }
  },
  locateTopLevelCandidates: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly targets: readonly string[] }>): TokenOccurrencesJudgment<Token> => {
    const resolution = scannerTokenStructureAlgebra.findTopLevelCandidates({ ...input, targets: input.targets, tokenValue: input.tokenValue });
    if (resolution.kind === 'malformed') return scannerJudgmentOperations.occurrencesMalformed({ location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual });
    return scannerJudgmentOperations.occurrencesComplete(resolution.matches.flatMap(match => {
      const token = input.tokens[match.index];
      return token === undefined ? [] : [{ before: input.tokens.slice(0, match.index), token, after: input.tokens.slice(match.index + 1) }];
    }));
  },
  partitionTopLevel: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly separator: string }>): TokenPartitionJudgment<Token> => {
    const judgment = scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: input.tokens, targets: [input.separator], tokenValue: input.tokenValue });
    if (judgment.kind === 'malformed') return scannerJudgmentOperations.partitionMalformed({ location: judgment.location, expected: judgment.expected, actual: judgment.actual });
    const parts: (readonly Token[])[] = [];
    let start = 0;
    for (const occurrence of judgment.occurrences) {
      const boundary = occurrence.before.length;
      parts.push(input.tokens.slice(start, boundary));
      start = boundary + 1;
    }
    parts.push(input.tokens.slice(start));
    return scannerJudgmentOperations.partitioned(Object.freeze(parts));
  },
  matchLeadingDelimiter: <Token>(input: ScannerTokenStructureQuery<Token>): DelimitedTokenJudgment<Token> => {
    const opening = input.tokens[0];
    if (opening === undefined || openerFor(input.tokenValue(opening)) === undefined) return scannerJudgmentOperations.delimiterNotFound<Token>();
    const resolution = scannerTokenStructureAlgebra.findMatchingClose({ tokens: input.tokens, index: 0, tokenValue: input.tokenValue });
    switch (resolution.kind) {
      case 'not_found': return scannerJudgmentOperations.delimiterNotFound<Token>();
      case 'malformed': return scannerJudgmentOperations.delimiterMalformed({ location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual });
      case 'found': {
        const closing = input.tokens[resolution.index];
        return closing === undefined
          ? scannerJudgmentOperations.delimiterMalformed({ location: { kind: 'end_of_source' }, expected: expectedCloser(input.tokenValue(opening)), actual: '<end-of-source>' })
          : scannerJudgmentOperations.delimiterMatched({ opening, contents: input.tokens.slice(1, resolution.index), closing, prefix: [], suffix: input.tokens.slice(resolution.index + 1) });
      }
    }
  },
  matchTrailingDelimiter: <Token>(input: ScannerTokenStructureQuery<Token>): DelimitedTokenJudgment<Token> => {
    const closingIndex = input.tokens.length - 1;
    const closing = input.tokens[closingIndex];
    if (closing === undefined || !isCloser(input.tokenValue(closing))) return scannerJudgmentOperations.delimiterNotFound<Token>();
    const resolution = scannerTokenStructureAlgebra.findMatchingOpen({ tokens: input.tokens, index: closingIndex, tokenValue: input.tokenValue });
    switch (resolution.kind) {
      case 'not_found': return scannerJudgmentOperations.delimiterNotFound<Token>();
      case 'malformed': return scannerJudgmentOperations.delimiterMalformed({ location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual });
      case 'found': {
        const opening = input.tokens[resolution.index];
        return opening === undefined
          ? scannerJudgmentOperations.delimiterMalformed({ location: { kind: 'end_of_source' }, expected: '<opening-delimiter>', actual: '<out-of-source>' })
          : scannerJudgmentOperations.delimiterMatched({ opening, contents: input.tokens.slice(resolution.index + 1, closingIndex), closing, prefix: input.tokens.slice(0, resolution.index), suffix: [] });
      }
    }
  },
});
