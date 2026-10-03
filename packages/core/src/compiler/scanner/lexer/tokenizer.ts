/**
 * tokenizer.ts
 *
 * Declarative lexical relation scanner.
 * Source characters are evidence; scanner dispatch is a relation catalog and
 * recursive closure; lexical evidence is selected through the relation catalog.
 */
import type { TokenDescriptor } from './PhpAst';
import { createSourceLineNumber, createSourceOffset } from './PhpAst';
import { createSourceStream, type SourceStream, type CursorMark } from './SourceStream';
import {
    isDigit,
    isIdentPart,
    isIdentStart,
    scanSlash,
    scanQuestion,
    scanColon,
    scanEquals,
    scanMinus,
    scanDot,
    scanSimpleOperator,
    scanWordOrUnknown,
} from './tokenize';
import { relationAny, relationEqual, relationGate, relationFirstOption, relationOptionFold } from '../../../semantic/kernel/semanticRelations';

export {
    KEYWORDS,
    isDigit,
    isIdentStart,
    isIdentPart,
    resolveIdentifierType
} from './tokenize';

type ScanAction = (stream: SourceStream, mark: CursorMark, nextChar: string, tokens: readonly TokenDescriptor[]) => readonly TokenDescriptor[];
type ScanRule = readonly [(char: string, nextChar: string) => boolean, ScanAction];

const emitEOF = (stream: SourceStream, tokens: readonly TokenDescriptor[]): readonly TokenDescriptor[] => {
    const finalMark = stream.mark();
    return Object.freeze([
        ...tokens,
        {
            type: 'EOF',
            value: '',
            line: createSourceLineNumber(finalMark.line),
            startOffset: createSourceOffset(finalMark.offset),
            endOffset: createSourceOffset(finalMark.offset),
        },
    ]);
};

const advance = (stream: SourceStream): void => { stream.advance(); };
const advanceLine = (stream: SourceStream): void => { stream.advanceLine(); };

const whitespaceAction: ScanAction = (stream, _mark, _nextChar, tokens) => { advance(stream); return tokens; };
const newlineAction: ScanAction = (stream, _mark, _nextChar, tokens) => { advanceLine(stream); return tokens; };

const hashAction: ScanAction = (stream, mark, nextChar, tokens) =>
    relationGate(
        relationEqual(nextChar, '['),
        () => {
            stream.advance();
            return Object.freeze([...tokens, stream.emitToken('PUNCTUATION', mark)]);
        },
        () => { stream.skipLineComment(); return tokens; },
    );

const slashAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanSlash(stream, mark, nextChar, produced); return Object.freeze(produced); };

const quoteAction = (quote: string): ScanAction => (stream, mark, _nextChar, tokens) => Object.freeze([
    ...tokens,
    relationGate(
        relationEqual(quote, "'"),
        () => stream.scanSingleQuoteString(mark),
        () => stream.scanDoubleQuoteString(mark),
    ),
]);

const questionAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanQuestion(stream, mark, nextChar, produced); return Object.freeze(produced); };
const colonAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanColon(stream, mark, nextChar, produced); return Object.freeze(produced); };
const equalsAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanEquals(stream, mark, nextChar, produced); return Object.freeze(produced); };
const minusAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanMinus(stream, mark, nextChar, produced); return Object.freeze(produced); };
const dotAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanDot(stream, mark, nextChar, produced); return Object.freeze(produced); };
const simpleOperatorAction: ScanAction = (stream, mark, nextChar, tokens) => { const produced = [...tokens]; scanSimpleOperator(stream, mark, nextChar, produced); return Object.freeze(produced); };

const variableAction: ScanAction = (stream, mark, _nextChar, tokens) => {
    stream.advance();
    stream.scanByPredicate(isIdentPart);
    return Object.freeze([...tokens, stream.emitToken('VARIABLE', mark)]);
};

const numberAction: ScanAction = (stream, mark, _nextChar, tokens) => {
    stream.scanByPredicate(char => relationAny([isDigit(char), relationEqual(char, '.')]));
    return Object.freeze([...tokens, stream.emitToken('NUMBER', mark)]);
};

const wordAction: ScanAction = (stream, mark, char, tokens) => {
    const produced = [...tokens];
    scanWordOrUnknown(stream, mark, char, produced);
    return Object.freeze(produced);
};

const punctuation = (char: string): boolean => relationAny([
    relationEqual(char, '['),
    relationEqual(char, ']'),
    relationEqual(char, '('),
    relationEqual(char, ')'),
    relationEqual(char, '{'),
    relationEqual(char, '}'),
    relationEqual(char, ','),
    relationEqual(char, ';'),
    relationEqual(char, '&'),
    relationEqual(char, '!'),
    relationEqual(char, '+'),
    relationEqual(char, '*'),
    relationEqual(char, '%'),
    relationEqual(char, '<'),
    relationEqual(char, '>'),
    relationEqual(char, '|'),
    relationEqual(char, '\\'),
]);

const rules: readonly ScanRule[] = Object.freeze([
    [char => relationEqual(char, '\n'), newlineAction],
    [char => relationAny([relationEqual(char, ' '), relationEqual(char, '\t'), relationEqual(char, '\r')]), whitespaceAction],
    [char => relationEqual(char, '#'), hashAction],
    [char => relationEqual(char, '/'), slashAction],
    [char => relationEqual(char, "'"), quoteAction("'")],
    [char => relationEqual(char, '"'), quoteAction('"')],
    [char => relationEqual(char, '?'), questionAction],
    [char => relationEqual(char, ':'), colonAction],
    [char => relationEqual(char, '='), equalsAction],
    [char => relationEqual(char, '-'), minusAction],
    [char => punctuation(char), simpleOperatorAction],
    [char => relationEqual(char, '.'), dotAction],
    [char => relationEqual(char, '$'), variableAction],
    [char => isDigit(char), numberAction],
    [char => relationAny([isIdentStart(char), relationEqual(char, '$')]), wordAction],
]);

const selectAction = (char: string, nextChar: string): ScanAction =>
    relationOptionFold(
        relationFirstOption(rules, rule => rule[0](char, nextChar)),
        () => wordAction,
        rule => rule[1],
    );

const scanClosure = (
    stream: SourceStream,
    tokens: readonly TokenDescriptor[],
): readonly TokenDescriptor[] =>
    relationGate(
        stream.isEOF(),
        () => emitEOF(stream, tokens),
        () => {
            const mark = stream.mark();
            const char = stream.char();
            const nextChar = stream.peek(1);
            const action = selectAction(char, nextChar);
            const nextTokens = action(stream, mark, nextChar, tokens);
            return scanClosure(stream, nextTokens);
        },
    );

export function tokenizePhpSource(source: string): readonly TokenDescriptor[] {
    return scanClosure(createSourceStream(source), []);
}
