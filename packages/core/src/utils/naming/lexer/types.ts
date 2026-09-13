/**
 * types.ts
 *
 * Enums and lookup table for character classification.
 *
 * @module core/utils/naming/lexer
 */

export enum CharKind {
    DELIM = 0,
    LOWER = 1,
    UPPER = 2,
    DIGIT = 3
}

export enum LexerState {
    START = 0,
    LOWERCASE_WORD = 1,
    UPPERCASE_WORD = 2,
    ACRONYM = 3
}

/**
 * 256-Byte Direct Character Classification Table (Extended ASCII 0..255).
 * Guaranteed O(1) direct memory lookup with 0 'if' and 0 '??'.
 */
export const CHAR_TABLE = new Uint8Array(256);
CHAR_TABLE.fill(CharKind.DIGIT, 48, 58);   // '0'..'9' (ASCII 48..57)
CHAR_TABLE.fill(CharKind.UPPER, 65, 91);   // 'A'..'Z' (ASCII 65..90)
CHAR_TABLE.fill(CharKind.LOWER, 97, 123);  // 'a'..'z' (ASCII 97..122)

export function classifyChar(code: number): CharKind {
    return CHAR_TABLE[code];
}
