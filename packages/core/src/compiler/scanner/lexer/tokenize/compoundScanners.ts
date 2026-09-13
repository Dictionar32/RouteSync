/**
 * compoundScanners.ts
 *
 * Scanners for multi-character operators, comments, and identifiers.
 *
 * @module core/compiler/scanner/lexer/tokenize
 */

import type { TokenDescriptor } from '../PhpAst';
import type { SourceStream, CursorMark } from '../SourceStream';
import { isIdentStart, isIdentPart, resolveIdentifierType } from './characterPredicates';

export function scanSlash(
  stream: SourceStream,
  tokenMark: CursorMark,
  nextChar: string,
  tokens: TokenDescriptor[]
): void {
  switch (nextChar) {
    case '/':
      stream.skipLineComment();
      break;
    case '*':
      stream.skipBlockComment();
      break;
    default:
      stream.advance();
      tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
      break;
  }
}

export function scanQuestion(
  stream: SourceStream,
  tokenMark: CursorMark,
  nextChar: string,
  tokens: TokenDescriptor[]
): void {
  if (nextChar === '-' && stream.peek(2) === '>') {
    stream.advanceBy(3);
    tokens.push(stream.emitToken('NULLSAFE_OPERATOR', tokenMark));
  } else {
    stream.advance();
    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
  }
}

export function scanColon(
  stream: SourceStream,
  tokenMark: CursorMark,
  nextChar: string,
  tokens: TokenDescriptor[]
): void {
  if (nextChar === ':') {
    stream.advanceBy(2);
    tokens.push(stream.emitToken('DOUBLE_COLON', tokenMark));
  } else {
    stream.advance();
    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
  }
}

export function scanEquals(
  stream: SourceStream,
  tokenMark: CursorMark,
  nextChar: string,
  tokens: TokenDescriptor[]
): void {
  if (nextChar === '>') {
    stream.advanceBy(2);
    tokens.push(stream.emitToken('ARROW', tokenMark));
  } else {
    stream.advance();
    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
  }
}

export function scanMinus(
  stream: SourceStream,
  tokenMark: CursorMark,
  nextChar: string,
  tokens: TokenDescriptor[]
): void {
  if (nextChar === '>') {
    stream.advanceBy(2);
    tokens.push(stream.emitToken('OBJECT_OPERATOR', tokenMark));
  } else {
    stream.advance();
    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
  }
}

export function scanWordOrUnknown(
  stream: SourceStream,
  tokenMark: CursorMark,
  char: string,
  tokens: TokenDescriptor[]
): void {
  if (isIdentStart(char)) {
    stream.scanWhile(isIdentPart);
    const val = stream.sliceFrom(tokenMark);
    const type = resolveIdentifierType(val);
    tokens.push(stream.emitToken(type, tokenMark));
  } else {
    stream.advance();
  }
}
