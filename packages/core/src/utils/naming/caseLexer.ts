/**
 * Identifier Case Lexer and Tokenizer.
 * Active Consumer: Coordinates lexical word tokenization and casing formatters.
 *
 * @module core/utils/naming/caseLexer
 */

import {
    CharKind,
    LexerState,
    tokenizeWords,
    toPascal,
    toCamel,
    toSnake,
    toKebab
} from './lexer';

export { CharKind, LexerState };

/**
 * Canonical Identifier Lexical Scanner & Formatter.
 */
export class IdentifierCase {
    /**
     * Pure Zero-Regex Lexical Word Tokenizer (Formal Finite State Machine).
     */
    static words(str: string): readonly string[] {
        return tokenizeWords(str);
    }

    /**
     * Convert identifier to PascalCase (e.g. 'order_item' -> 'OrderItem')
     */
    static toPascal(str: string): string {
        return toPascal(str);
    }

    /**
     * Convert identifier to camelCase (e.g. 'order_item' -> 'orderItem')
     */
    static toCamel(str: string): string {
        return toCamel(str);
    }

    /**
     * Convert identifier to snake_case (e.g. 'OrderItem' -> 'order_item')
     */
    static toSnake(str: string): string {
        return toSnake(str);
    }

    /**
     * Convert identifier to kebab-case (e.g. 'OrderItem' -> 'order-item')
     */
    static toKebab(str: string): string {
        return toKebab(str);
    }
}
