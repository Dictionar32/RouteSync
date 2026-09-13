/**
 * formatters.ts
 *
 * Case converters using tokenized words.
 *
 * @module core/utils/naming/lexer
 */

import { tokenizeWords } from './tokenizer';

/**
 * Convert identifier to PascalCase (e.g. 'order_item' -> 'OrderItem')
 */
export function toPascal(str: string): string {
    return tokenizeWords(str)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

/**
 * Convert identifier to camelCase (e.g. 'order_item' -> 'orderItem')
 */
export function toCamel(str: string): string {
    return tokenizeWords(str)
        .map((w, index) => index === 0 
            ? w.toLowerCase() 
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
}

/**
 * Convert identifier to snake_case (e.g. 'OrderItem' -> 'order_item')
 */
export function toSnake(str: string): string {
    return tokenizeWords(str)
        .map(w => w.toLowerCase())
        .join('_');
}

/**
 * Convert identifier to kebab-case (e.g. 'OrderItem' -> 'order-item')
 */
export function toKebab(str: string): string {
    return tokenizeWords(str)
        .map(w => w.toLowerCase())
        .join('-');
}
