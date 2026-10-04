/** Canonical syntax navigation: relations, presence witnesses, and recursive closure. */
import type { TokenDescriptor } from '../../../compiler/scanner/lexer/phpAstTypes';
import { SYNTAX_KIND_GROUPS, tokenHasKind, tokenSyntaxFact, type SyntaxTokenFact } from '../../../compiler/scanner/lexer/routeAst/syntaxValue';
import {
  closesCurrentDelimiter,
  delimiterTransition,
  isTopLevelDelimiter,
  emptyDelimiterState,
} from '../../../compiler/scanner/lexer/routeAst/delimiterNavigation';
import { relationGate, relationFirstOption, relationOptionFold, relationSelect, relationResolve, relationRange, relationNone, relationSome, type RelationOption } from '../relationalSequence';
import { presenceOf, presenceFold, type Presence } from '../../../types/upstream/presence';
import { relationAll, relationAny } from '../semanticRelations';

export type CursorPresence<T> = Presence<T>;

const absent = <T>(): CursorPresence<T> => ({ kind: 'absent' });
const present = <T>(value: T): CursorPresence<T> => ({ kind: 'present', value });

const fromCursorValue = <T>(value: T | void): CursorPresence<T> => presenceOf(value);

const presenceValue = <T, R>(presence: CursorPresence<T>, absentBranch: () => R, presentBranch: (value: T) => R): R =>
  presenceFold(presence, absentBranch, presentBranch);

const tokenAt = (tokens: readonly TokenDescriptor[], position: number): TokenDescriptor | void => tokens[position];
const delimiterInput = (value: TokenDescriptor | void): RelationOption<string> =>
  presenceValue(fromCursorValue(value), () => relationNone<string>(), token => relationSome(token.value));

const tokenHasKindAt = (value: TokenDescriptor | void, kinds: readonly SyntaxTokenFact['kind'][]): boolean =>
  presenceValue(fromCursorValue(value), () => false, token => tokenHasKind(token, kinds));

const tokenSyntaxFactAt = (value: TokenDescriptor | void): RelationOption<SyntaxTokenFact> =>
  presenceValue(fromCursorValue(value), () => relationNone<SyntaxTokenFact>(), token => tokenSyntaxFact(token));

const predicateAt = (value: TokenDescriptor | void, cursor: TokenCursor, predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): boolean =>
  presenceValue(fromCursorValue(value), () => false, token => predicate(token, cursor));


const tokenPresence = (tokens: readonly TokenDescriptor[], position: number): CursorPresence<TokenDescriptor> =>
  fromCursorValue(tokenAt(tokens, position));

export interface TokenCursor {
  readonly tokens: readonly TokenDescriptor[];
  readonly position: number;
  readonly current: TokenDescriptor | void;
  readonly previous: TokenDescriptor | void;
  readonly next: TokenDescriptor | void;
  readonly afterNext: TokenDescriptor | void;
  readonly terminal: TokenDescriptor | void;
  readonly currentPresence: CursorPresence<TokenDescriptor>;
  readonly previousPresence: CursorPresence<TokenDescriptor>;
  readonly nextPresence: CursorPresence<TokenDescriptor>;
  readonly afterNextPresence: CursorPresence<TokenDescriptor>;
  readonly terminalPresence: CursorPresence<TokenDescriptor>;
  readonly atEnd: boolean;
  readonly nextCursor: TokenCursor;
  readonly afterNextCursor: TokenCursor;
  readonly callOpen: TokenDescriptor | void;
  readonly callArgument: TokenDescriptor | void;
  readonly callArgumentCursor: TokenCursor;
  readonly secondCallArgumentCursor: TokenCursor | void;
  readonly secondCallArgumentPresence: CursorPresence<TokenCursor>;
  readonly callClosePresence: CursorPresence<TokenCursor>;
  readonly callCloseCursor: TokenCursor | void;
  readonly afterCallPresence: CursorPresence<TokenCursor>;
  readonly afterCallCursor: TokenCursor | void;
  readonly firstCallArgumentSpan: RelationalTokenSpan | void;
  readonly callTrailingArgumentSpans: readonly RelationalTokenSpan[];
  readonly callArgumentSpansPresence: CursorPresence<readonly RelationalTokenSpan[]>;
  readonly statementEndCursor: TokenCursor;
  readonly statementContinuationCursor: TokenCursor;
  readonly delimitedElementSpans: readonly RelationalTokenSpan[];
  readonly firstDelimitedElementCursor: TokenCursor | void;
  readonly secondDelimitedElementCursor: TokenCursor | void;
  readonly stringArrowStringPairs: readonly { readonly key: string; readonly value: string }[];
  readonly classReference: boolean;
  readonly advance: () => TokenCursor;
  readonly findWitness: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => CursorPresence<TokenCursor>;
  readonly find: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => TokenCursor | void;
  readonly until: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => readonly TokenDescriptor[];
  readonly untilCursor: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => TokenCursor;
  readonly rangeTo: (end: TokenCursor) => RelationalTokenSpan;
  readonly tokensUntil: (end: TokenCursor) => readonly TokenDescriptor[];
  readonly delimitedElementCursor: (relation: 'first' | 'second') => TokenCursor | void;
  readonly isBefore: (other: TokenCursor) => boolean;
  readonly samePosition: (other: TokenCursor) => boolean;
}

export interface RelationalTokenSpan {
  readonly start: TokenCursor;
  readonly end: TokenCursor;
}

const createTokenCursor = (tokens: readonly TokenDescriptor[], position: number): TokenCursor => {
  const current = (): TokenDescriptor | void => tokenAt(tokens, position);
  const previous = (): TokenDescriptor | void => tokenAt(tokens, position - 1);
  const next = (): TokenDescriptor | void => tokenAt(tokens, position + 1);
  const afterNext = (): TokenDescriptor | void => tokenAt(tokens, position + 2);
  const terminal = (): TokenDescriptor | void => tokenAt(tokens, tokens.length - 1);
  const advance = (): TokenCursor => createTokenCursor(tokens, position + 1);
  const nextCursor = (): TokenCursor => advance();
  const afterNextCursor = (): TokenCursor => advance().advance();
  const currentPresence = (): CursorPresence<TokenDescriptor> => tokenPresence(tokens, position);
  const previousPresence = (): CursorPresence<TokenDescriptor> => tokenPresence(tokens, position - 1);
  const nextPresence = (): CursorPresence<TokenDescriptor> => tokenPresence(tokens, position + 1);
  const afterNextPresence = (): CursorPresence<TokenDescriptor> => tokenPresence(tokens, position + 2);
  const terminalPresence = (): CursorPresence<TokenDescriptor> => tokenPresence(tokens, tokens.length - 1);
  const atEnd = (): boolean => position >= tokens.length;
  const callOpen = (): TokenDescriptor | void => presenceValue(nextPresence(), () => {}, token => relationGate(tokenHasKind(token, SYNTAX_KIND_GROUPS.openParens), () => token, () => {}));
  const callArgument = (): TokenDescriptor | void => presenceValue(fromCursorValue(callOpen()), () => {}, () => afterNext());
  const callArgumentCursor = (): TokenCursor => afterNextCursor();
  const secondCallArgumentCursor = (): TokenCursor | void => {
    const visit = (cursor: TokenCursor, state: ReturnType<typeof emptyDelimiterState>): TokenCursor | void => {
      const value = cursor.current;
      const close = relationAll([closesCurrentDelimiter(state, delimiterInput(value)), tokenHasKindAt(value, SYNTAX_KIND_GROUPS.closeParens)]);
      const comma = relationAll([tokenHasKindAt(value, SYNTAX_KIND_GROUPS.commas), isTopLevelDelimiter(state)]);
      return relationGate(cursor.atEnd, () => {}, () => relationGate(close, () => cursor, () => relationGate(comma, () => cursor.advance(), () => visit(cursor.advance(), delimiterTransition(state, delimiterInput(value))))));
    };
    return visit(callArgumentCursor(), emptyDelimiterState());
  };
  const secondCallArgumentPresence = (): CursorPresence<TokenCursor> => fromCursorValue(secondCallArgumentCursor());
  const callClosePresence = (): CursorPresence<TokenCursor> => {
    const open = callOpen();
    const visit = (cursor: TokenCursor, state: ReturnType<typeof emptyDelimiterState>): CursorPresence<TokenCursor> => {
      const value = cursor.current;
      const close = relationAll([closesCurrentDelimiter(state, delimiterInput(value)), tokenHasKindAt(value, SYNTAX_KIND_GROUPS.closeParens)]);
      return relationGate(cursor.atEnd, () => absent<TokenCursor>(), () => relationGate(close, () => present(cursor), () => visit(cursor.advance(), delimiterTransition(state, delimiterInput(value)))));
    };
    return presenceValue(fromCursorValue(open), () => absent<TokenCursor>(), () => visit(nextCursor(), emptyDelimiterState()));
  };
  const callCloseCursor = (): TokenCursor | void => presenceValue(callClosePresence(), () => {}, value => value);
  const afterCallPresence = (): CursorPresence<TokenCursor> => presenceValue(callClosePresence(), absent<TokenCursor>, value => present(value.advance()));
  const afterCallCursor = (): TokenCursor | void => presenceValue(afterCallPresence(), () => {}, value => value);
  const callArgumentSpans = (): readonly RelationalTokenSpan[] => presenceValue(callArgumentSpansPresence(), () => Object.freeze([]), value => value);
  const collectArgumentSpans = (end: TokenCursor): readonly RelationalTokenSpan[] => {
    const visit = (cursor: TokenCursor, start: TokenCursor, state: ReturnType<typeof emptyDelimiterState>, output: readonly RelationalTokenSpan[]): readonly RelationalTokenSpan[] => {
      const terminal = !cursor.isBefore(end);
      const value = cursor.current;
      const comma = relationAll([tokenHasKindAt(value, SYNTAX_KIND_GROUPS.commas), isTopLevelDelimiter(state)]);
      const nextOutput = relationGate(relationAll([comma, start.isBefore(cursor)]), () => Object.freeze([...output, Object.freeze({ start, end: cursor })]), () => output);
      const nextStart = relationGate(comma, () => cursor.advance(), () => start);
      const nextState = delimiterTransition(state, delimiterInput(value));
      return relationGate(terminal, () => relationGate(start.isBefore(end), () => Object.freeze([...nextOutput, Object.freeze({ start, end })]), () => nextOutput), () => visit(cursor.advance(), nextStart, nextState, nextOutput));
    };
    return Object.freeze(visit(callArgumentCursor(), callArgumentCursor(), emptyDelimiterState(), Object.freeze([])));
  };
  const callArgumentSpansPresence = (): CursorPresence<readonly RelationalTokenSpan[]> => presenceValue(callClosePresence(), absent<readonly RelationalTokenSpan[]>, close => present(collectArgumentSpans(close)));
  const firstCallArgumentSpan = (): RelationalTokenSpan | void => callArgumentSpans()[0];
  const callTrailingArgumentSpans = (): readonly RelationalTokenSpan[] => {
    const spans = callArgumentSpans();
    return relationRange(spans, 1, spans.length);
  };
  const statementEndCursor = (): TokenCursor => {
    const visit = (cursor: TokenCursor, state: ReturnType<typeof emptyDelimiterState>): TokenCursor => {
      const value = cursor.current;
      const boundary = relationAll([tokenHasKindAt(value, SYNTAX_KIND_GROUPS.statementEnds), isTopLevelDelimiter(state)]);
      return relationGate(relationAny([cursor.atEnd, boundary]), () => cursor, () => visit(cursor.advance(), delimiterTransition(state, delimiterInput(value))));
    };
    return visit(cursor, emptyDelimiterState());
  };
  const statementContinuationCursor = (): TokenCursor => relationGate(statementEndCursor().atEnd, () => statementEndCursor(), () => statementEndCursor().advance());
  const delimitedElementSpans = (): readonly RelationalTokenSpan[] => {
    const opening = tokenSyntaxFactAt(current());
    const closingKind = relationOptionFold(relationFirstOption([opening], entry => relationAny([Object.is(entry.kind, 'open_bracket'), Object.is(entry.kind, 'open_brace')])), () => '', entry => relationResolve(Object.is(entry.kind, 'open_bracket'), () => ']', () => '}'));
    const visit = (cursor: TokenCursor, start: TokenCursor, state: ReturnType<typeof emptyDelimiterState>, output: readonly RelationalTokenSpan[]): readonly RelationalTokenSpan[] => {
      const value = cursor.current;
      const closing = tokenSyntaxFactAt(value);
      const boundary = relationAll([relationOptionFold(closing, () => false, fact => Object.is(fact.value, closingKind)), isTopLevelDelimiter(state)]);
      const comma = relationAll([tokenHasKindAt(value, SYNTAX_KIND_GROUPS.commas), isTopLevelDelimiter(state)]);
      const completed = relationGate(relationAll([comma, start.isBefore(cursor)]), () => Object.freeze([...output, Object.freeze({ start, end: cursor })]), () => output);
      const nextStart = relationGate(comma, () => cursor.advance(), () => start);
      const nextState = delimiterTransition(state, delimiterInput(value));
      return relationGate(relationAny([cursor.atEnd, boundary]), () => relationGate(boundary, () => completed, () => relationGate(start.isBefore(cursor), () => Object.freeze([...completed, Object.freeze({ start, end: cursor })]), () => completed)), () => visit(cursor.advance(), nextStart, nextState, completed));
    };
    return relationGate(Object.is(closingKind.length, 0), () => Object.freeze([]), () => Object.freeze(visit(advance(), advance(), emptyDelimiterState(), Object.freeze([]))));
  };
  const delimitedElementCursor = (relation: 'first' | 'second'): TokenCursor | void => {
    const spans = delimitedElementSpans();
    const index = relationResolve(Object.is(relation, 'first'), () => 0, () => 1);
    return relationOptionFold(relationFirstOption(spans, (_value, i) => Object.is(i, index)), () => {}, value => value.start);
  };
  const firstDelimitedElementCursor = (): TokenCursor | void => delimitedElementCursor('first');
  const secondDelimitedElementCursor = (): TokenCursor | void => delimitedElementCursor('second');
  const stringArrowStringPairs = (): readonly { readonly key: string; readonly value: string }[] => {
    const visit = (cursor: TokenCursor, output: readonly { readonly key: string; readonly value: string }[]): readonly { readonly key: string; readonly value: string }[] => {
      const tokens = [cursor.current, cursor.next, cursor.afterNext];
      const presentTokens = relationSelect(tokens, (entry): entry is TokenDescriptor => Boolean(entry));
      const matches = relationAll([Object.is(presentTokens.length, 3), tokenHasKind(presentTokens[0], SYNTAX_KIND_GROUPS.strings), tokenHasKind(presentTokens[1], SYNTAX_KIND_GROUPS.arrows), tokenHasKind(presentTokens[2], SYNTAX_KIND_GROUPS.strings)]);
      return relationGate(cursor.atEnd, () => output, () => relationGate(matches, () => visit(cursor.afterNextCursor.nextCursor, Object.freeze([...output, Object.freeze({ key: presentTokens[0].value, value: presentTokens[2].value })])), () => visit(cursor.nextCursor, output)));
    };
    return Object.freeze(visit(cursor, Object.freeze([])));
  };
  const rangeTo = (end: TokenCursor): RelationalTokenSpan => Object.freeze({ start: cursor, end });
  const tokensUntil = (end: TokenCursor): readonly TokenDescriptor[] => {
    const collect = (entryCursor: TokenCursor, output: readonly TokenDescriptor[]): readonly TokenDescriptor[] => {
      const value = entryCursor.current;
      const terminal = relationAny([!entryCursor.isBefore(end), presenceValue(fromCursorValue(value), () => true, () => false)]);
      return relationGate(terminal, () => output, () => collect(entryCursor.advance(), Object.freeze([...output, cursorValue(value)])));
    };
    return Object.freeze(collect(cursor, Object.freeze([])));
  };
  const classReference = (): boolean => relationAll([tokenHasKindAt(next(), SYNTAX_KIND_GROUPS.separators), tokenHasKindAt(afterNext(), SYNTAX_KIND_GROUPS.classKeywords)]);
  const find = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): TokenCursor | void => {
    const visit = (entryCursor: TokenCursor): TokenCursor | void => {
      const value = entryCursor.current;
      return relationGate(entryCursor.atEnd, () => {}, () => relationGate(presenceValue(fromCursorValue(value), () => true, () => false), () => visit(entryCursor.advance()), () => relationGate(predicateAt(value, entryCursor, predicate), () => entryCursor, () => visit(entryCursor.advance()))));
    };
    return visit(cursor);
  };
  const findWitness = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): CursorPresence<TokenCursor> => fromCursorValue(find(predicate));
  const until = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): readonly TokenDescriptor[] => {
    const collect = (entryCursor: TokenCursor, output: readonly TokenDescriptor[]): readonly TokenDescriptor[] => {
      const value = entryCursor.current;
      const terminal = relationAny([entryCursor.atEnd, presenceValue(fromCursorValue(value), () => true, () => false), predicate(cursorValue(value), entryCursor)]);
      return relationGate(terminal, () => output, () => collect(entryCursor.advance(), Object.freeze([...output, cursorValue(value)])));
    };
    return Object.freeze(collect(cursor, Object.freeze([])));
  };
  const untilCursor = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): TokenCursor => presenceValue(fromCursorValue(find(predicate)), () => cursor, value => value);
  const cursor: TokenCursor = Object.freeze({
    tokens, position,
    get current() { return current(); }, get previous() { return previous(); }, get next() { return next(); }, get afterNext() { return afterNext(); }, get terminal() { return terminal(); },
    get currentPresence() { return currentPresence(); }, get previousPresence() { return previousPresence(); }, get nextPresence() { return nextPresence(); }, get afterNextPresence() { return afterNextPresence(); }, get terminalPresence() { return terminalPresence(); },
    get atEnd() { return atEnd(); }, get nextCursor() { return nextCursor(); }, get afterNextCursor() { return afterNextCursor(); },
    get callOpen() { return callOpen(); }, get callArgument() { return callArgument(); }, get callArgumentCursor() { return callArgumentCursor(); }, get secondCallArgumentCursor() { return secondCallArgumentCursor(); }, get secondCallArgumentPresence() { return secondCallArgumentPresence(); },
    get callClosePresence() { return callClosePresence(); }, get callCloseCursor() { return callCloseCursor(); }, get afterCallPresence() { return afterCallPresence(); }, get afterCallCursor() { return afterCallCursor(); },
    get firstCallArgumentSpan() { return firstCallArgumentSpan(); }, get callTrailingArgumentSpans() { return callTrailingArgumentSpans(); }, get callArgumentSpansPresence() { return callArgumentSpansPresence(); },
    get statementEndCursor() { return statementEndCursor(); }, get statementContinuationCursor() { return statementContinuationCursor(); }, get delimitedElementSpans() { return delimitedElementSpans(); }, get firstDelimitedElementCursor() { return firstDelimitedElementCursor(); }, get secondDelimitedElementCursor() { return secondDelimitedElementCursor(); },
    get stringArrowStringPairs() { return stringArrowStringPairs(); }, get classReference() { return classReference(); },
    advance, findWitness, find, until, untilCursor, rangeTo, tokensUntil, delimitedElementCursor,
    isBefore: (other: TokenCursor): boolean => position < other.position,
    samePosition: (other: TokenCursor): boolean => Object.is(position, other.position),
  });
  return cursor;
};

export const TokenCursor = Object.freeze({ start: (tokens: readonly TokenDescriptor[]): TokenCursor => createTokenCursor(tokens, 0) });

const cursorValue = (value: TokenDescriptor | void): TokenDescriptor =>
  presenceValue(fromCursorValue(value), () => { throw Error('token cursor value is absent'); }, entry => entry);
