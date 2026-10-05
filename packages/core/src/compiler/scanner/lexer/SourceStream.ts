/** Declarative scanner cursor backed by relation-driven transitions. */
import { TokenType, TokenDescriptor, createSourceLineNumber, createSourceOffset } from './PhpAst';
import { relationAll, relationAny, relationEqual, relationGate } from '../../../semantic/foundation/semanticRelations';
import { relationTextSlice } from '../../../semantic/foundation/relationalSequence';

export interface CursorMark { readonly offset: number; readonly line: number; }
export interface SourceStream {
    readonly mark: () => CursorMark;
    readonly char: () => string;
    readonly peek: (lookahead?: number) => string;
    readonly isEOF: () => boolean;
    readonly advance: () => void;
    readonly advanceBy: (count: number) => void;
    readonly advanceLine: () => void;
    readonly scanByPredicate: (predicate: (char: string) => boolean) => void;
    readonly skipLineComment: () => void;
    readonly skipBlockComment: () => void;
    readonly scanSingleQuoteString: (mark: CursorMark) => TokenDescriptor;
    readonly scanDoubleQuoteString: (mark: CursorMark) => TokenDescriptor;
    readonly sliceFrom: (mark: CursorMark) => string;
    readonly emitToken: (type: TokenType, mark: CursorMark) => TokenDescriptor;
}

export const createSourceStream = (source: string): SourceStream => {
    let offset = 0;
    let line = 1;
    const mark = (): CursorMark => ({ offset, line });
    const char = (): string => source.charAt(offset);
    const peek = (lookahead = 1): string => source.charAt(offset + lookahead);
    const isEOF = (): boolean => offset >= source.length;
    const advance = (): void => { offset += 1; };
    const advanceBy = (count: number): void => { offset += count; };
    const advanceLine = (): void => { line += 1; offset += 1; };
    const scanByPredicate = (predicate: (value: string) => boolean): void => relationGate(relationAny([isEOF(), !predicate(char())]), () => {}, () => { advance(); scanByPredicate(predicate); });
    const skipLineComment = (): void => scanByPredicate(value => !relationEqual(value, '\n'));
    const skipBlockComment = (): void => {
        advanceBy(2);
        const close = (): void => relationGate(isEOF(), () => {}, () => {
            const atLine = relationEqual(char(), '\n');
            const atClose = relationAll([relationEqual(char(), '*'), relationEqual(peek(1), '/')]);
            relationGate(atLine, () => { advanceLine(); close(); }, () => relationGate(atClose, () => advanceBy(2), () => { advance(); close(); }));
        });
        close();
    };
    const emitStringToken = (start: CursorMark, closed: boolean): TokenDescriptor => {
        const endOffset = relationGate(closed, () => offset - 1, () => offset);
        return { type: 'STRING', value: relationTextSlice(source, start.offset + 1, endOffset), line: createSourceLineNumber(start.line), startOffset: createSourceOffset(start.offset), endOffset: createSourceOffset(offset) };
    };
    const scanQuotedString = (start: CursorMark, quote: string): TokenDescriptor => {
        const body = (escaped: boolean): TokenDescriptor => relationGate(isEOF(), () => emitStringToken(start, false), () => relationGate(relationEqual(char(), '\n'), () => { advanceLine(); return body(false); }, () => relationGate(relationAll([!escaped, relationEqual(char(), quote)]), () => { advance(); return emitStringToken(start, true); }, () => { const nextEscaped = relationAll([!escaped, relationEqual(char(), '\\')]); advance(); return body(nextEscaped); })));
        return body(false);
    };
    return Object.freeze({
        mark, char, peek, isEOF, advance, advanceBy, advanceLine, scanByPredicate,
        skipLineComment, skipBlockComment,
        scanSingleQuoteString: (start: CursorMark) => { advance(); return scanQuotedString(start, "'"); },
        scanDoubleQuoteString: (start: CursorMark) => { advance(); return scanQuotedString(start, '"'); },
        sliceFrom: (start: CursorMark) => relationTextSlice(source, start.offset, offset),
        emitToken: (type: TokenType, start: CursorMark) => ({ type, value: relationTextSlice(source, start.offset, offset), line: createSourceLineNumber(start.line), startOffset: createSourceOffset(start.offset), endOffset: createSourceOffset(offset) }),
    });
};
