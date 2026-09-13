/**
 * tokenizer.ts
 *
 * Pure Zero-Regex Lexical Word Tokenizer (Formal Finite State Machine).
 *
 * @module core/utils/naming/lexer
 */

import { CharKind, LexerState, classifyChar } from './types';

export function tokenizeWords(str: string): readonly string[] {
    const words: string[] = [];
    let buffer = '';
    let state = LexerState.START;

    for (let i = 0; i < str.length; i++) {
        const kind = classifyChar(str.charCodeAt(i));
        const char = str[i];

        switch (state) {
            case LexerState.START:
                switch (kind) {
                    case CharKind.LOWER:
                        buffer = char;
                        state = LexerState.LOWERCASE_WORD;
                        break;
                    case CharKind.UPPER:
                        buffer = char;
                        state = LexerState.UPPERCASE_WORD;
                        break;
                    case CharKind.DIGIT:
                        buffer = char;
                        state = LexerState.LOWERCASE_WORD;
                        break;
                    case CharKind.DELIM:
                        break;
                }
                break;

            case LexerState.LOWERCASE_WORD:
                switch (kind) {
                    case CharKind.LOWER:
                    case CharKind.DIGIT:
                        buffer += char;
                        break;
                    case CharKind.UPPER:
                        words.push(buffer);
                        buffer = char;
                        state = LexerState.UPPERCASE_WORD;
                        break;
                    case CharKind.DELIM:
                        words.push(buffer);
                        buffer = '';
                        state = LexerState.START;
                        break;
                }
                break;

            case LexerState.UPPERCASE_WORD:
                switch (kind) {
                    case CharKind.LOWER:
                    case CharKind.DIGIT:
                        buffer += char;
                        state = LexerState.LOWERCASE_WORD;
                        break;
                    case CharKind.UPPER:
                        buffer += char;
                        state = LexerState.ACRONYM;
                        break;
                    case CharKind.DELIM:
                        words.push(buffer);
                        buffer = '';
                        state = LexerState.START;
                        break;
                }
                break;

            case LexerState.ACRONYM:
                switch (kind) {
                    case CharKind.UPPER:
                    case CharKind.DIGIT:
                        buffer += char;
                        break;
                    case CharKind.LOWER: {
                        const lastUpper = buffer.slice(-1);
                        words.push(buffer.slice(0, -1));
                        buffer = lastUpper + char;
                        state = LexerState.LOWERCASE_WORD;
                        break;
                    }
                    case CharKind.DELIM:
                        words.push(buffer);
                        buffer = '';
                        state = LexerState.START;
                        break;
                }
                break;
        }
    }

    buffer && words.push(buffer);

    return words;
}
