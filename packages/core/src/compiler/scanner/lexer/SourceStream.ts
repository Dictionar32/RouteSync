/**
 * SourceStream.ts
 *
 * Character stream reader with instant O(1) cursor navigation and atomic comment/string scanning.
 *
 * @module core/compiler/scanner/lexer/SourceStream
 */

import { TokenType, TokenDescriptor, createSourceLineNumber, createSourceOffset } from "./PhpAst";

export interface CursorMark {
    readonly offset: number;
    readonly line: number;
}

/**
 * Character stream reader with instant O(1) cursor navigation and zero redundant loops.
 */
export class SourceStream {
    private offset = 0;
    private line = 1;

    constructor(private readonly source: string) { }

    public mark(): CursorMark {
        return { offset: this.offset, line: this.line };
    }

    public char(): string {
        return this.source.charAt(this.offset);
    }

    public peek(lookahead = 1): string {
        return this.source.charAt(this.offset + lookahead);
    }

    public isEOF(): boolean {
        return this.offset >= this.source.length;
    }

    public advance(): void {
        this.offset++;
    }

    public advanceBy(count: number): void {
        this.offset += count;
    }

    public advanceLine(): void {
        this.line++;
        this.offset++;
    }

    public scanWhile(predicate: (char: string) => boolean): void {
        while (!this.isEOF() && predicate(this.char())) {
            this.advance();
        }
    }

    public skipLineComment(): void {
        this.scanWhile(c => c !== '\n');
    }

    public skipBlockComment(): void {
        this.advanceBy(2); // Skip /*
        while (!this.isEOF()) {
            if (this.char() === '\n') {
                this.advanceLine();
            } else if (this.char() === '*' && this.peek(1) === '/') {
                this.advanceBy(2); // Skip */
                break;
            } else {
                this.advance();
            }
        }
    }

    public scanSingleQuoteString(mark: CursorMark): TokenDescriptor {
        this.advance(); // Skip opening '
        let isEscaped = false;
        while (!this.isEOF()) {
            const char = this.char();
            if (char === '\n') {
                this.advanceLine();
                continue;
            }
            if (!isEscaped && char === "'") {
                this.advance(); // Skip closing '
                const raw = this.source.slice(mark.offset + 1, this.offset - 1);
                return { type: 'STRING', value: raw, line: createSourceLineNumber(mark.line), startOffset: createSourceOffset(mark.offset), endOffset: createSourceOffset(this.offset) };
            }
            isEscaped = (!isEscaped && char === '\\');
            this.advance();
        }
        return { type: 'STRING', value: this.source.slice(mark.offset + 1, this.offset), line: createSourceLineNumber(mark.line), startOffset: createSourceOffset(mark.offset), endOffset: createSourceOffset(this.offset) };
    }

    public scanDoubleQuoteString(mark: CursorMark): TokenDescriptor {
        this.advance(); // Skip opening "
        let isEscaped = false;
        while (!this.isEOF()) {
            const char = this.char();
            if (char === '\n') {
                this.advanceLine();
                continue;
            }
            if (!isEscaped && char === '"') {
                this.advance(); // Skip closing "
                const raw = this.source.slice(mark.offset + 1, this.offset - 1);
                return { type: 'STRING', value: raw, line: createSourceLineNumber(mark.line), startOffset: createSourceOffset(mark.offset), endOffset: createSourceOffset(this.offset) };
            }
            isEscaped = (!isEscaped && char === '\\');
            this.advance();
        }
        return { type: 'STRING', value: this.source.slice(mark.offset + 1, this.offset), line: createSourceLineNumber(mark.line), startOffset: createSourceOffset(mark.offset), endOffset: createSourceOffset(this.offset) };
    }

    public sliceFrom(mark: CursorMark): string {
        return this.source.slice(mark.offset, this.offset);
    }

    public emitToken(type: TokenType, mark: CursorMark): TokenDescriptor {
        return {
            type,
            value: this.sliceFrom(mark),
            line: createSourceLineNumber(mark.line),
            startOffset: createSourceOffset(mark.offset),
            endOffset: createSourceOffset(this.offset)
        };
    }
}
