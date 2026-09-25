/**
 * index.ts
 *
 * Sub-domain exports for PHP lexer tokenizer.
 *
 * @module core/compiler/scanner/lexer/tokenize
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
