/**
 * Language-neutral token-structure algebra. Owns delimiter validation and
 * top-level token search; a scanner supplies only token observations.
 */
import { relationAdvanceIndex, relationGate } from '../../semantic/relations/relationalSequence';

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
): TokenStructureResolution => relationGate(index < input.tokens.length, () => {
  const value = input.tokenValue(input.tokens[index]);
  const top = stack[stack.length - 1];
  return relationGate(isCloser(value), () => relationGate(
    top === value,
    () => scan(input, relationAdvanceIndex(index, 1), stack.slice(0, -1), candidateIndex),
    () => ({ kind: 'malformed' as const, index, expected: top, actual: value }),
  ), () => relationGate(openerFor(value) !== undefined, () => scan(
    input,
    relationAdvanceIndex(index, 1),
    [...stack, expectedCloser(value) ?? ''],
    candidateIndex,
  ), () => relationGate(
    stack.length === 0 && value === input.target && candidateIndex === undefined,
    () => scan(input, relationAdvanceIndex(index, 1), stack, index),
    () => scan(input, relationAdvanceIndex(index, 1), stack, candidateIndex),
  )));
}, () => relationGate(
  stack.length === 0,
  () => relationGate(candidateIndex !== undefined,
    () => ({ kind: 'found' as const, index: candidateIndex ?? input.tokens.length }),
    () => ({ kind: 'not_found' as const, index: input.tokens.length })),
  () => ({ kind: 'malformed' as const, index: input.tokens.length, expected: stack[stack.length - 1], actual: '<end-of-input>' }),
));


const scanCandidates = <Token>(
  input: TopLevelTokenCandidatesInput<Token>,
  index: number,
  stack: readonly string[],
  matches: readonly TopLevelTokenCandidate[],
): TopLevelTokenCandidatesResolution => relationGate(index < input.tokens.length, () => {
  const value = input.tokenValue(input.tokens[index]);
  const top = stack[stack.length - 1];
  return relationGate(isCloser(value), () => relationGate(
    top === value,
    () => scanCandidates(input, relationAdvanceIndex(index, 1), stack.slice(0, -1), matches),
    () => ({ kind: 'malformed' as const, index, expected: top, actual: value }),
  ), () => relationGate(openerFor(value) !== undefined, () => scanCandidates(
    input,
    relationAdvanceIndex(index, 1),
    [...stack, expectedCloser(value) ?? ''],
    matches,
  ), () => {
    const matched = stack.length === 0 && input.targets.includes(value);
    return scanCandidates(
      input,
      relationAdvanceIndex(index, 1),
      stack,
      matched ? [...matches, { token: value, index }] : matches,
    );
  }));
}, () => relationGate(
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
  const scanClose = (index: number, stack: readonly string[]): TokenStructureResolution => relationGate(index < input.tokens.length, () => {
    const value = input.tokenValue(input.tokens[index]);
    const top = stack[stack.length - 1];
    return relationGate(isCloser(value), () => relationGate(closerMatches(value, top),
      () => relationGate(stack.length === 1,
        () => ({ kind: 'found' as const, index }),
        () => scanClose(relationAdvanceIndex(index, 1), stack.slice(0, -1))),
      () => ({ kind: 'malformed' as const, index, expected: top, actual: value })),
    () => relationGate(openerFor(value) !== undefined, () => scanClose(
      relationAdvanceIndex(index, 1),
      [...stack, expectedCloser(value) ?? ''],
    ), () => scanClose(relationAdvanceIndex(index, 1), stack)));
  }, () => ({ kind: 'malformed' as const, index: input.tokens.length, expected: stack[stack.length - 1], actual: '<end-of-input>' }));
  return scanClose(relationAdvanceIndex(input.index, 1), [firstDelimiter.closer]);
};

const findMatchingOpen = <Token>(input: DelimiterMatchSearch<Token>): TokenStructureResolution => {
  const closer = input.tokens[input.index] === undefined ? undefined : input.tokenValue(input.tokens[input.index]);
  const firstDelimiter = closer === undefined ? undefined : delimiters.find(entry => entry.closer === closer);
  if (input.index < 0 || input.index >= input.tokens.length || firstDelimiter === undefined) {
    return { kind: 'not_found', index: input.index };
  }
  const scanOpen = (index: number, stack: readonly string[]): TokenStructureResolution => relationGate(index >= 0, () => {
    const value = input.tokenValue(input.tokens[index]);
    const top = stack[stack.length - 1];
    const opener = openerFor(value);
    const matchingOpen = delimiters.find(entry => entry.closer === value)?.opener;
    return relationGate(opener !== undefined, () => relationGate(opener?.opener === top,
      () => relationGate(stack.length === 1,
        () => ({ kind: 'found' as const, index }),
        () => scanOpen(relationAdvanceIndex(index, -1), stack.slice(0, -1))),
      () => ({ kind: 'malformed' as const, index, expected: top, actual: value })),
    () => relationGate(matchingOpen !== undefined, () => scanOpen(
      relationAdvanceIndex(index, -1),
      [...stack, matchingOpen ?? ''],
    ), () => scanOpen(relationAdvanceIndex(index, -1), stack)));
  }, () => ({ kind: 'malformed' as const, index: -1, expected: stack[stack.length - 1], actual: '<start-of-input>' }));
  return scanOpen(relationAdvanceIndex(input.index, -1), [firstDelimiter.opener]);
};

const closerMatches = (value: string, expected: string | undefined): boolean => value === expected;

export const scannerTokenStructureAlgebra: ScannerTokenStructureAlgebra = Object.freeze({
  findTopLevel: <Token>(input: TopLevelTokenSearch<Token>): TokenStructureResolution => relationGate(
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
      case 'not_found': return { kind: 'not_found' };
      case 'malformed': return { kind: 'malformed', location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual };
      case 'found': {
        const token = input.tokens[resolution.index];
        return token === undefined
          ? { kind: 'malformed', location: { kind: 'end_of_source' }, expected: input.target, actual: '<end-of-source>' }
          : { kind: 'found', occurrence: { before: input.tokens.slice(0, resolution.index), token, after: input.tokens.slice(resolution.index + 1) } };
      }
    }
  },
  locateTopLevelCandidates: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly targets: readonly string[] }>): TokenOccurrencesJudgment<Token> => {
    const resolution = scannerTokenStructureAlgebra.findTopLevelCandidates({ ...input, targets: input.targets, tokenValue: input.tokenValue });
    if (resolution.kind === 'malformed') return { kind: 'malformed', location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual };
    return {
      kind: 'complete',
      occurrences: resolution.matches.flatMap(match => {
        const token = input.tokens[match.index];
        return token === undefined ? [] : [{ before: input.tokens.slice(0, match.index), token, after: input.tokens.slice(match.index + 1) }];
      }),
    };
  },
  partitionTopLevel: <Token>(input: ScannerTokenStructureQuery<Token> & Readonly<{ readonly separator: string }>): TokenPartitionJudgment<Token> => {
    const judgment = scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: input.tokens, targets: [input.separator], tokenValue: input.tokenValue });
    if (judgment.kind === 'malformed') return judgment;
    const parts: (readonly Token[])[] = [];
    let start = 0;
    for (const occurrence of judgment.occurrences) {
      const boundary = occurrence.before.length;
      parts.push(input.tokens.slice(start, boundary));
      start = boundary + 1;
    }
    parts.push(input.tokens.slice(start));
    return { kind: 'partitioned', parts: Object.freeze(parts) };
  },
  matchLeadingDelimiter: <Token>(input: ScannerTokenStructureQuery<Token>): DelimitedTokenJudgment<Token> => {
    const opening = input.tokens[0];
    if (opening === undefined || openerFor(input.tokenValue(opening)) === undefined) return { kind: 'not_found' };
    const resolution = scannerTokenStructureAlgebra.findMatchingClose({ tokens: input.tokens, index: 0, tokenValue: input.tokenValue });
    switch (resolution.kind) {
      case 'not_found': return { kind: 'not_found' };
      case 'malformed': return { kind: 'malformed', location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual };
      case 'found': {
        const closing = input.tokens[resolution.index];
        return closing === undefined
          ? { kind: 'malformed', location: { kind: 'end_of_source' }, expected: expectedCloser(input.tokenValue(opening)), actual: '<end-of-source>' }
          : { kind: 'matched', evidence: { opening, contents: input.tokens.slice(1, resolution.index), closing, prefix: [], suffix: input.tokens.slice(resolution.index + 1) } };
      }
    }
  },
  matchTrailingDelimiter: <Token>(input: ScannerTokenStructureQuery<Token>): DelimitedTokenJudgment<Token> => {
    const closingIndex = input.tokens.length - 1;
    const closing = input.tokens[closingIndex];
    if (closing === undefined || !isCloser(input.tokenValue(closing))) return { kind: 'not_found' };
    const resolution = scannerTokenStructureAlgebra.findMatchingOpen({ tokens: input.tokens, index: closingIndex, tokenValue: input.tokenValue });
    switch (resolution.kind) {
      case 'not_found': return { kind: 'not_found' };
      case 'malformed': return { kind: 'malformed', location: tokenLocation(input.tokens, resolution.index), expected: resolution.expected, actual: resolution.actual };
      case 'found': {
        const opening = input.tokens[resolution.index];
        return opening === undefined
          ? { kind: 'malformed', location: { kind: 'end_of_source' }, expected: '<opening-delimiter>', actual: '<out-of-source>' }
          : { kind: 'matched', evidence: { opening, contents: input.tokens.slice(resolution.index + 1, closingIndex), closing, prefix: input.tokens.slice(0, resolution.index), suffix: [] } };
      }
    }
  },
});
