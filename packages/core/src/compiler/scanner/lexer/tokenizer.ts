/**
 * tokenizer.ts
 *
 * Linear single-pass Atomic Lexer backed by SourceStream.
 * Tokenizes PHP source code into structured TokenDescriptor stream.
 *
 * @module core/compiler/scanner/lexer/tokenizer
 */

import type { TokenDescriptor } from './PhpAst';
import { createSourceLineNumber, createSourceOffset } from './PhpAst';
import { SourceStream } from './SourceStream';
import {
    isDigit,
    isIdentPart,
    scanSlash,
    scanQuestion,
    scanColon,
    scanEquals,
    scanMinus,
    scanDot,
    scanSimpleOperator,
    scanWordOrUnknown
} from './tokenize';

export {
    KEYWORDS,
    isDigit,
    isIdentStart,
    isIdentPart,
    resolveIdentifierType
} from './tokenize';

/**
 * Tokenizes PHP source code via a linear single-pass Atomic Lexer backed by SourceStream.
 */
export function tokenizePhpSource(source: string): readonly TokenDescriptor[] {
    const stream = new SourceStream(source);
    const tokens: TokenDescriptor[] = [];

    while (!stream.isEOF()) {
        const tokenMark = stream.mark();
        const char = stream.char();
        const nextChar = stream.peek(1);

        switch (char) {
            case '\n':
                stream.advanceLine();
                break;
            case ' ':
            case '\t':
            case '\r':
                stream.advance();
                break;

            case '#':
                if (nextChar === '[') {
                    stream.advance();
                    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                } else {
                    stream.skipLineComment();
                }
                break;

            case '/':
                scanSlash(stream, tokenMark, nextChar, tokens);
                break;

            case "'":
                tokens.push(stream.scanSingleQuoteString(tokenMark));
                break;

            case '"':
                tokens.push(stream.scanDoubleQuoteString(tokenMark));
                break;

            case '?':
                scanQuestion(stream, tokenMark, nextChar, tokens);
                break;

            case ':':
                scanColon(stream, tokenMark, nextChar, tokens);
                break;

            case '=':
                scanEquals(stream, tokenMark, nextChar, tokens);
                break;

            case '-':
                scanMinus(stream, tokenMark, nextChar, tokens);
                break;

            case '[':
            case ']':
            case '(':
            case ')':
            case '{':
            case '}':
            case ',':
            case ';':
            case '&':
            case '!':
            case '+':
            case '*':
            case '%':
            case '<':
            case '>':
            case '|':
                scanSimpleOperator(stream, tokenMark, nextChar, tokens);
                break;

            case '.':
                scanDot(stream, tokenMark, nextChar, tokens);
                break;

            case '$':
                stream.advance();
                stream.scanWhile(isIdentPart);
                tokens.push(stream.emitToken('VARIABLE', tokenMark));
                break;

            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                stream.scanWhile(c => isDigit(c) || c === '.');
                tokens.push(stream.emitToken('NUMBER', tokenMark));
                break;

            default:
                scanWordOrUnknown(stream, tokenMark, char, tokens);
                break;
        }
    }

    const finalMark = stream.mark();
    tokens.push({
        type: 'EOF',
        value: '',
        line: createSourceLineNumber(finalMark.line),
        startOffset: createSourceOffset(finalMark.offset),
        endOffset: createSourceOffset(finalMark.offset)
    });

    return Object.freeze(tokens);
}
