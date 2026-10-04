/** Declarative operator scanner: evidence is resolved through a transition catalog. */
import type { TokenDescriptor } from '../PhpAst';
import type { SourceStream, CursorMark } from '../SourceStream';
import { isIdentStart, isIdentPart, resolveIdentifierType } from './characterPredicates';
import { relationFirstOption, relationOptionFold, relationTextSlice } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual, relationGate } from '../../../../semantic/kernel/semanticRelations';

type ScanAction = (stream: SourceStream, mark: CursorMark, tokens: TokenDescriptor[]) => void;
type Transition = readonly [string, string, ScanAction];

const emit = (stream: SourceStream, mark: CursorMark, tokens: TokenDescriptor[], width: number, type: TokenDescriptor['type']): void => {
  stream.advanceBy(width);
  tokens.push(stream.emitToken(type, mark));
};

const action = (width: number, type: TokenDescriptor['type']): ScanAction => (stream, mark, tokens) => emit(stream, mark, tokens, width, type);

const slashTransitions: readonly Transition[] = Object.freeze([
  ['/', '', (stream, mark, tokens) => stream.skipLineComment()],
  ['*', '', (stream, mark, tokens) => stream.skipBlockComment()],
  ['', '', action(1, 'DIVIDE')],
]);

const dispatch = (transitions: readonly Transition[], next: string, peek: string, fallback: ScanAction): ScanAction =>
  relationOptionFold(
    relationFirstOption(transitions, entry => relationAll([relationEqual(entry[0], next), relationAny([relationEqual(entry[1], ''), relationEqual(entry[1], peek)])])),
    () => fallback,
    entry => entry[2],
  );

export function scanSlash(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  dispatch(slashTransitions, nextChar, stream.peek(2), action(1, 'DIVIDE'))(stream, tokenMark, tokens);
}

const questionTransitions: readonly Transition[] = Object.freeze([
  ['-', '>', action(3, 'NULLSAFE_OPERATOR')],
  ['?', '=', action(3, 'NULL_COALESCE_ASSIGN')],
  ['?', '', action(2, 'NULL_COALESCE')],
  [':', '', action(2, 'SHORT_TERNARY')],
  ['', '', action(1, 'QUESTION')],
]);

export function scanQuestion(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  dispatch(questionTransitions, nextChar, stream.peek(2), action(1, 'QUESTION'))(stream, tokenMark, tokens);
}

const colonTransitions: readonly Transition[] = [[':', '', action(2, 'DOUBLE_COLON')], ['', '', action(1, 'COLON')]];
export function scanColon(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  dispatch(colonTransitions, nextChar, stream.peek(2), action(1, 'COLON'))(stream, tokenMark, tokens);
}

const equalsTransitions: readonly Transition[] = Object.freeze([
  ['>', '', action(2, 'ARROW')],
  ['=', '=', action(3, 'IDENTICAL')],
  ['=', '', action(2, 'EQUAL')],
  ['', '', action(1, 'ASSIGN')],
]);
export function scanEquals(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  dispatch(equalsTransitions, nextChar, stream.peek(2), action(1, 'ASSIGN'))(stream, tokenMark, tokens);
}

const dotTransitions: readonly Transition[] = [
  ['.', '.', action(3, 'ELLIPSIS')],
  ['', '', action(1, 'CONCAT')],
];
export function scanDot(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  dispatch(dotTransitions, nextChar, stream.peek(2), action(1, 'CONCAT'))(stream, tokenMark, tokens);
}

const minusTransitions: readonly Transition[] = [
  ['>', '', action(2, 'OBJECT_OPERATOR')],
  ['', '', action(1, 'MINUS')],
];
export function scanMinus(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  dispatch(minusTransitions, nextChar, stream.peek(2), action(1, 'MINUS'))(stream, tokenMark, tokens);
}

const simpleOperators: readonly (readonly [string, TokenDescriptor['type']])[] = Object.freeze([
  ['!:', 'NOT'], ['<:', 'LESS_THAN'], ['>:', 'GREATER_THAN'], ['+:', 'PLUS'], ['*:', 'MULTIPLY'], ['%:', 'MODULO'], ['&:', 'PUNCTUATION'], ['|:', 'PUNCTUATION'],
  ['&', 'PUNCTUATION'], ['|', 'PUNCTUATION'],
]);

export function scanSimpleOperator(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  const char = stream.char();
  const exact = `${char}${nextChar}${stream.peek(2)}`;
  const compound: readonly Transition[] = [
    ['!=', '=', action(3, 'NOT_IDENTICAL')],
    ['!=', '', action(2, 'NOT_EQUAL')],
    ['<=', '', action(2, 'LESS_OR_EQUAL')],
    ['>=', '', action(2, 'GREATER_OR_EQUAL')],
    ['&&', '', action(2, 'LOGICAL_AND')],
    ['||', '', action(2, 'LOGICAL_OR')],
  ];
  const direct: TokenDescriptor['type'] = relationOptionFold(
    relationFirstOption(simpleOperators, entry => relationAny([
      relationEqual(entry[0], `${char}:`),
      relationEqual(entry[0], char),
    ])),
    () => 'PUNCTUATION',
    entry => entry[1],
  );
  const fallback = action(1, direct);
  const selected = relationOptionFold(
    relationFirstOption(compound, entry => relationEqual(`${entry[0]}${entry[1]}`, relationTextSlice(exact, 0, entry[0].length + entry[1].length))),
    () => fallback,
    entry => entry[2],
  );
  selected(stream, tokenMark, tokens);
}

export function scanWordOrUnknown(stream: SourceStream, tokenMark: CursorMark, char: string, tokens: TokenDescriptor[]): void {
  relationOptionFold(
    relationFirstOption([char], isIdentStart),
    () => stream.advance(),
    () => {
      stream.scanByPredicate(isIdentPart);
      const value = stream.sliceFrom(tokenMark);
      tokens.push(stream.emitToken(resolveIdentifierType(value), tokenMark));
    },
  );
}
