/**
 * characterPredicates.ts
 *
 * Character classification predicates for PHP tokenizer.
 *
 * @module core/compiler/scanner/lexer/tokenize
 */

import type { TokenType } from '../PhpAst';

export const KEYWORDS = {
  true: 'TRUE',
  false: 'FALSE',
  null: 'NULL'
} as const;

export function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

export function isIdentStart(c: string): boolean {
  return c === '_' || c === '\\' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

export function isIdentPart(c: string): boolean {
  return isIdentStart(c) || isDigit(c) || c === '$';
}

export function resolveIdentifierType(val: string): TokenType {
  const lower = val.toLowerCase();
  return lower in KEYWORDS ? KEYWORDS[lower as keyof typeof KEYWORDS] : 'IDENTIFIER';
}
