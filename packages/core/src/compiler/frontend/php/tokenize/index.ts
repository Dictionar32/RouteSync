/**
 * index.ts
 *
 * Sub-domain exports for PHP lexer tokenizer.
 *
 * @module core/compiler/frontend/php/tokenize
 */

export {
  KEYWORDS,
  isDigit,
  isIdentStart,
  isIdentPart,
  resolveIdentifierType
} from './characterPredicates';
export {
  scanSlash,
  scanQuestion,
  scanColon,
  scanEquals,
  scanMinus,
  scanDot,
  scanSimpleOperator,
  scanWordOrUnknown
} from './compoundScanners';
