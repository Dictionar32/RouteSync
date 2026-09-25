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
      tokens.push(stream.emitToken('DIVIDE', tokenMark));
      break;
  }
}

export function scanQuestion(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  if (nextChar === '-' && stream.peek(2) === '>') { stream.advanceBy(3); tokens.push(stream.emitToken('NULLSAFE_OPERATOR', tokenMark)); return; }
  if (nextChar === '?' && stream.peek(2) === '=') { stream.advanceBy(3); tokens.push(stream.emitToken('NULL_COALESCE_ASSIGN', tokenMark)); return; }
  if (nextChar === '?') { stream.advanceBy(2); tokens.push(stream.emitToken('NULL_COALESCE', tokenMark)); return; }
  if (nextChar === ':') { stream.advanceBy(2); tokens.push(stream.emitToken('SHORT_TERNARY', tokenMark)); return; }
  stream.advance();
  tokens.push(stream.emitToken('QUESTION', tokenMark));
}

export function scanColon(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  if (nextChar === ':') { stream.advanceBy(2); tokens.push(stream.emitToken('DOUBLE_COLON', tokenMark)); return; }
  stream.advance();
  tokens.push(stream.emitToken('COLON', tokenMark));
}

export function scanEquals(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  if (nextChar === '>') { stream.advanceBy(2); tokens.push(stream.emitToken('ARROW', tokenMark)); return; }
  if (nextChar === '=' && stream.peek(2) === '=') { stream.advanceBy(3); tokens.push(stream.emitToken('IDENTICAL', tokenMark)); return; }
  if (nextChar === '=') { stream.advanceBy(2); tokens.push(stream.emitToken('EQUAL', tokenMark)); return; }
  stream.advance();
  tokens.push(stream.emitToken('ASSIGN', tokenMark));
}

export function scanDot(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  if (nextChar === '.' && stream.peek(2) === '.') { stream.advanceBy(3); tokens.push(stream.emitToken('ELLIPSIS', tokenMark)); return; }
  stream.advance();
  tokens.push(stream.emitToken('CONCAT', tokenMark));
}

export function scanMinus(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  if (nextChar === '>') { stream.advanceBy(2); tokens.push(stream.emitToken('OBJECT_OPERATOR', tokenMark)); return; }
  stream.advance();
  tokens.push(stream.emitToken('MINUS', tokenMark));
}

export function scanSimpleOperator(stream: SourceStream, tokenMark: CursorMark, nextChar: string, tokens: TokenDescriptor[]): void {
  const char = stream.char();
  if (char === '!' && nextChar === '=') {
    if (stream.peek(2) === '=') { stream.advanceBy(3); tokens.push(stream.emitToken('NOT_IDENTICAL', tokenMark)); return; }
    stream.advanceBy(2); tokens.push(stream.emitToken('NOT_EQUAL', tokenMark)); return;
  }
  if (char === '<' && nextChar === '=') { stream.advanceBy(2); tokens.push(stream.emitToken('LESS_OR_EQUAL', tokenMark)); return; }
  if (char === '>' && nextChar === '=') { stream.advanceBy(2); tokens.push(stream.emitToken('GREATER_OR_EQUAL', tokenMark)); return; }
  if (char === '&' && nextChar === '&') { stream.advanceBy(2); tokens.push(stream.emitToken('LOGICAL_AND', tokenMark)); return; }
  if (char === '|' && nextChar === '|') { stream.advanceBy(2); tokens.push(stream.emitToken('LOGICAL_OR', tokenMark)); return; }
  const type = char === '!' ? 'NOT' : char === '<' ? 'LESS_THAN' : char === '>' ? 'GREATER_THAN' : char === '+' ? 'PLUS' : char === '*' ? 'MULTIPLY' : char === '%' ? 'MODULO' : char === '&' ? 'PUNCTUATION' : char === '|' ? 'PUNCTUATION' : 'PUNCTUATION';
  stream.advance();
  tokens.push(stream.emitToken(type, tokenMark));
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
