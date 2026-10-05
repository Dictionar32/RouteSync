/**
 * Declarative lexical character relations.
 */
import type { TokenType } from '../PhpAst';
import { relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationFirstOption, relationOptionFold, relationTextCharIn } from '../../../../semantic/foundation/relationalSequence';

export const KEYWORDS = {
  true: 'TRUE',
  false: 'FALSE',
  null: 'NULL'
} as const;

const lowerKeywordCatalog: readonly (readonly [string, TokenType])[] = Object.freeze([
  ['true', KEYWORDS.true],
  ['false', KEYWORDS.false],
  ['null', KEYWORDS.null],
]);

const DIGIT_CHARS = '0123456789';
const IDENT_START_CHARS = '_\\abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function isDigit(c: string): boolean {
  return relationTextCharIn(c, DIGIT_CHARS.split(''));
}

export function isIdentStart(c: string): boolean {
  return relationTextCharIn(c, IDENT_START_CHARS.split(''));
}

export function isIdentPart(c: string): boolean {
  return relationAny([isIdentStart(c), isDigit(c), relationEqual(c, '$')]);
}

export function resolveIdentifierType(val: string): TokenType {
  const lower = val.toLowerCase();
  return relationOptionFold(
    relationFirstOption(lowerKeywordCatalog, entry => relationEqual(entry[0], lower)),
    () => 'IDENTIFIER',
    entry => entry[1],
  );
}
