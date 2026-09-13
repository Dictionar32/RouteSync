/**
 * index.ts
 *
 * Lexer module exports.
 *
 * @module core/utils/naming/lexer
 */

export {
    CharKind,
    LexerState,
    CHAR_TABLE,
    classifyChar
} from './types';

export { tokenizeWords } from './tokenizer';

export {
    toPascal,
    toCamel,
    toSnake,
    toKebab
} from './formatters';
