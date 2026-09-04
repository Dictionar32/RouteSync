/**
 * LaravelSourceLexer.ts
 *
 * Zero-Dependency Pure TypeScript Finite State Machine (FSM) Lexer for Laravel PHP.
 * Implements deterministic character-by-character state transitions for strings, comments, operators, and AST parsing.
 *
 * @module core/compiler/scanner
 */

export type TokenType =
    | 'STRING'
    | 'NUMBER'
    | 'TRUE'
    | 'FALSE'
    | 'NULL'
    | 'IDENTIFIER'
    | 'VARIABLE'
    | 'ARROW'
    | 'DOUBLE_COLON'
    | 'OBJECT_OPERATOR'
    | 'NULLSAFE_OPERATOR'
    | 'PUNCTUATION'
    | 'EOF';

export interface TokenDescriptor {
    readonly type: TokenType;
    readonly value: string;
    readonly line: number;
    readonly startOffset: number;
    readonly endOffset: number;
}

export type PhpLiteralValue =
    | { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string }
    | { readonly kind: 'literal'; readonly literalType: 'number'; readonly value: number }
    | { readonly kind: 'literal'; readonly literalType: 'boolean'; readonly value: boolean }
    | { readonly kind: 'literal'; readonly literalType: 'null'; readonly value: null };

export type PhpAstValue =
    | PhpLiteralValue
    | { readonly kind: 'resource_single'; readonly resourceName: string; readonly argument: string }
    | { readonly kind: 'resource_collection'; readonly resourceName: string; readonly argument: string }
    | { readonly kind: 'method_chain'; readonly target: string; readonly property: string; readonly nullsafe: boolean }
    | { readonly kind: 'property_access'; readonly target: string; readonly property: string; readonly nullsafe: boolean }
    | { readonly kind: 'variable_reference'; readonly name: string }
    | { readonly kind: 'ternary_expression'; readonly condition: string; readonly trueBranch: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] }
    | { readonly kind: 'raw_expression'; readonly raw: string };

export class PhpAstFactory {
    static stringLiteral(value: string): PhpAstValue {
        return { kind: 'literal', literalType: 'string', value };
    }

    static numberLiteral(raw: string): PhpAstValue {
        return { kind: 'literal', literalType: 'number', value: +raw };
    }

    static booleanLiteral(value: boolean): PhpAstValue {
        return { kind: 'literal', literalType: 'boolean', value };
    }

    static nullLiteral(): PhpAstValue {
        return { kind: 'literal', literalType: 'null', value: null };
    }

    static resourceSingle(resourceName: string, argument: string): PhpAstValue {
        return { kind: 'resource_single', resourceName, argument };
    }

    static resourceCollection(resourceName: string, argument: string): PhpAstValue {
        return { kind: 'resource_collection', resourceName, argument };
    }

    static methodChain(target: string, property: string, nullsafe: boolean): PhpAstValue {
        return { kind: 'method_chain', target, property, nullsafe };
    }

    static propertyAccess(target: string, property: string, nullsafe: boolean): PhpAstValue {
        return { kind: 'property_access', target, property, nullsafe };
    }

    static variableReference(name: string): PhpAstValue {
        return { kind: 'variable_reference', name };
    }

    static ternaryExpression(condition: string, trueBranch: PhpAstValue, falseBranch: PhpAstValue): PhpAstValue {
        return { kind: 'ternary_expression', condition, trueBranch, falseBranch };
    }

    static nestedArray(entries: readonly PhpArrayEntry[]): PhpAstValue {
        return { kind: 'nested_array', entries };
    }

    static rawExpression(raw: string): PhpAstValue {
        return { kind: 'raw_expression', raw };
    }
}

export interface PhpArrayEntry {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly rawExpression: string;
}

export interface ParsedPhpArrayResult {
    readonly entries: readonly PhpArrayEntry[];
    readonly endIndex: number;
}

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
                return { type: 'STRING', value: raw, line: mark.line, startOffset: mark.offset, endOffset: this.offset };
            }
            isEscaped = (!isEscaped && char === '\\');
            this.advance();
        }
        return { type: 'STRING', value: this.source.slice(mark.offset + 1, this.offset), line: mark.line, startOffset: mark.offset, endOffset: this.offset };
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
                return { type: 'STRING', value: raw, line: mark.line, startOffset: mark.offset, endOffset: this.offset };
            }
            isEscaped = (!isEscaped && char === '\\');
            this.advance();
        }
        return { type: 'STRING', value: this.source.slice(mark.offset + 1, this.offset), line: mark.line, startOffset: mark.offset, endOffset: this.offset };
    }

    public sliceFrom(mark: CursorMark): string {
        return this.source.slice(mark.offset, this.offset);
    }

    public emitToken(type: TokenType, mark: CursorMark): TokenDescriptor {
        return {
            type,
            value: this.sliceFrom(mark),
            line: mark.line,
            startOffset: mark.offset,
            endOffset: this.offset
        };
    }
}

export class LaravelSourceLexer {
    private static readonly KEYWORDS = {
        true: 'TRUE',
        false: 'FALSE',
        null: 'NULL',
    } as const;

    private static isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private static isIdentStart(c: string): boolean {
        return c === '_' || c === '\\' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    }

    private static isIdentPart(c: string): boolean {
        return LaravelSourceLexer.isIdentStart(c) || LaravelSourceLexer.isDigit(c) || c === '$';
    }

    /**
     * Tokenizes PHP source code via a linear single-pass Atomic Lexer backed by SourceStream.
     */
    static tokenize(source: string): readonly TokenDescriptor[] {
        const stream = new SourceStream(source);
        const tokens: TokenDescriptor[] = [];

        while (!stream.isEOF()) {
            const tokenMark = stream.mark();
            const char = stream.char();
            const nextChar = stream.peek(1);

            switch (char) {
                // Whitespace
                case '\n':
                    stream.advanceLine();
                    break;
                case ' ':
                case '\t':
                case '\r':
                    stream.advance();
                    break;

                // Comments (Atomic Skip)
                case '#':
                    stream.skipLineComment();
                    break;

                case '/':
                    switch (nextChar) {
                        case '/':
                            stream.skipLineComment();
                            break;
                        case '*':
                            stream.skipBlockComment();
                            break;
                        default:
                            stream.advance();
                            tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                            break;
                    }
                    break;

                // Strings (Atomic Scan)
                case "'":
                    tokens.push(stream.scanSingleQuoteString(tokenMark));
                    break;

                case '"':
                    tokens.push(stream.scanDoubleQuoteString(tokenMark));
                    break;

                // Operators & Punctuations with Lookahead
                case '?':
                    switch (nextChar) {
                        case '-':
                            switch (stream.peek(2)) {
                                case '>':
                                    stream.advanceBy(3);
                                    tokens.push(stream.emitToken('NULLSAFE_OPERATOR', tokenMark));
                                    break;
                                default:
                                    stream.advance();
                                    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                                    break;
                            }
                            break;
                        default:
                            stream.advance();
                            tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                            break;
                    }
                    break;

                case ':':
                    switch (nextChar) {
                        case ':':
                            stream.advanceBy(2);
                            tokens.push(stream.emitToken('DOUBLE_COLON', tokenMark));
                            break;
                        default:
                            stream.advance();
                            tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                            break;
                    }
                    break;

                case '=':
                    switch (nextChar) {
                        case '>':
                            stream.advanceBy(2);
                            tokens.push(stream.emitToken('ARROW', tokenMark));
                            break;
                        default:
                            stream.advance();
                            tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                            break;
                    }
                    break;

                case '-':
                    switch (nextChar) {
                        case '>':
                            stream.advanceBy(2);
                            tokens.push(stream.emitToken('OBJECT_OPERATOR', tokenMark));
                            break;
                        default:
                            stream.advance();
                            tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                            break;
                    }
                    break;

                // Single-character Punctuations
                case '[':
                case ']':
                case '(':
                case ')':
                case '{':
                case '}':
                case ',':
                case ';':
                    stream.advance();
                    tokens.push(stream.emitToken('PUNCTUATION', tokenMark));
                    break;

                // Variables ($this, $request, $user)
                case '$':
                    stream.advance();
                    stream.scanWhile(LaravelSourceLexer.isIdentPart);
                    tokens.push(stream.emitToken('VARIABLE', tokenMark));
                    break;

                // Numbers (0..9)
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
                    stream.scanWhile(c => LaravelSourceLexer.isDigit(c) || c === '.');
                    tokens.push(stream.emitToken('NUMBER', tokenMark));
                    break;

                default:
                    if (LaravelSourceLexer.isIdentStart(char)) {
                        stream.scanWhile(LaravelSourceLexer.isIdentPart);
                        const val = stream.sliceFrom(tokenMark);
                        const lower = val.toLowerCase();
                        const type: TokenType = (lower in LaravelSourceLexer.KEYWORDS)
                            ? LaravelSourceLexer.KEYWORDS[lower as keyof typeof LaravelSourceLexer.KEYWORDS]
                            : 'IDENTIFIER';

                        tokens.push(stream.emitToken(type, tokenMark));
                    } else {
                        stream.advance();
                    }
                    break;
            }
        }

        // Sentinel EOF Token
        const finalMark = stream.mark();
        tokens.push({
            type: 'EOF',
            value: '',
            line: finalMark.line,
            startOffset: finalMark.offset,
            endOffset: finalMark.offset
        });

        return Object.freeze(tokens);
    }

    /**
     * Parses a PHP array declaration into structured key-value entries leveraging exact source slicing.
     */
    static parseArray(source: string, tokens: readonly TokenDescriptor[], startIndex: number = 0): ParsedPhpArrayResult {
        const entries: PhpArrayEntry[] = [];
        let endIndex = startIndex;

        // Skip to array start: '[' or 'array('
        while (endIndex < tokens.length) {
            if (tokens[endIndex].value === '[') {
                const prev = endIndex > startIndex ? tokens[endIndex - 1] : null;
                const isSubscript = prev && (
                    prev.type === 'VARIABLE' ||
                    (prev.type === 'IDENTIFIER' && prev.value !== 'return' && prev.value !== 'yield') ||
                    prev.value === ')' ||
                    prev.value === ']' ||
                    prev.value === '}'
                );
                if (isSubscript) {
                    let depth = 1;
                    endIndex++;
                    while (endIndex < tokens.length && depth > 0) {
                        if (tokens[endIndex].value === '[') depth++;
                        else if (tokens[endIndex].value === ']') depth--;
                        endIndex++;
                    }
                    continue;
                }
                endIndex++; // skip '['
                break;
            }
            if (tokens[endIndex].value === 'array' && tokens[endIndex + 1]?.value === '(') {
                endIndex += 2; // skip 'array' and '('
                break;
            }
            endIndex++;
        }
        if (endIndex >= tokens.length) return { entries: [], endIndex };

        let autoIndex = 0;

        while (endIndex < tokens.length) {
            const token = tokens[endIndex];
            if (token.value === ']' || token.value === ')') {
                endIndex++;
                break;
            }

            if (token.value === ',') {
                endIndex++;
                continue;
            }

            let key = String(autoIndex);

            // Check if key is explicitly declared: 'key' => value
            if (endIndex + 1 < tokens.length && tokens[endIndex + 1].value === '=>') {
                key = tokens[endIndex].value;
                endIndex += 2;
            } else {
                autoIndex++;
            }

            // Value parsing
            if (endIndex < tokens.length) {
                const valToken = tokens[endIndex];

                // Nested Array
                if (valToken.value === '[' || valToken.value === 'array') {
                    const nested = this.parseArray(source, tokens, endIndex);
                    entries.push({ key, value: { kind: 'nested_array', entries: nested.entries }, rawExpression: 'array' });
                    endIndex = nested.endIndex;
                    continue;
                }

                // Scalar value / Chained Expression extraction via source.slice()
                const valTokenIndex = endIndex;
                const exprStartOffset = valToken.startOffset;
                let exprEndOffset = valToken.endOffset;
                let depth = 0;

                while (endIndex < tokens.length) {
                    const nextToken = tokens[endIndex];

                    // Delimiter reached at top-level depth
                    if (depth === 0 && (nextToken.value === ',' || nextToken.value === ']' || nextToken.value === ')')) {
                        break;
                    }

                    // Track nested depth
                    if (nextToken.value === '(' || nextToken.value === '[') {
                        depth++;
                    } else if (nextToken.value === ')' || nextToken.value === ']') {
                        depth--;
                    }

                    exprEndOffset = nextToken.endOffset;
                    endIndex++;
                }

                const rawExpression = source.slice(exprStartOffset, exprEndOffset);
                const astValue = this.classifyAstTokens(tokens.slice(valTokenIndex, endIndex), rawExpression);
                entries.push({ key, value: astValue, rawExpression });
            }
        }

        return { entries, endIndex };
    }

    public static classifyAstValue(raw: string): PhpAstValue {
        const tokens = this.tokenize(raw);
        const exprTokens = tokens.filter(t => t.type !== 'EOF');
        return this.classifyAstTokens(exprTokens, raw);
    }

    public static classifyAstTokens(exprTokens: readonly TokenDescriptor[], raw: string): PhpAstValue {
        switch (exprTokens.length) {
            case 0:
                return PhpAstFactory.rawExpression(raw);

            // 1. Literal Scalars & Variables
            case 1: {
                const first = exprTokens[0];
                switch (first.type) {
                    case 'STRING': return PhpAstFactory.stringLiteral(first.value);
                    case 'NUMBER': return PhpAstFactory.numberLiteral(first.value);
                    case 'TRUE': return PhpAstFactory.booleanLiteral(true);
                    case 'FALSE': return PhpAstFactory.booleanLiteral(false);
                    case 'NULL': return PhpAstFactory.nullLiteral();
                    case 'VARIABLE': return PhpAstFactory.variableReference(first.value);
                    default: return PhpAstFactory.rawExpression(raw);
                }
            }

            // 2. Multi-token Expressions
            default: {
                const first = exprTokens[0];
                switch (first.value) {
                    // new UserResource(...)
                    case 'new':
                        return exprTokens[1]?.type === 'IDENTIFIER'
                            ? PhpAstFactory.resourceSingle(exprTokens[1].value, raw)
                            : PhpAstFactory.rawExpression(raw);

                    default: {
                        // $this->prop or $this->user->name or $user?->prop
                        if (first.type === 'VARIABLE') {
                            const lastArrowIndex = exprTokens.map((t, idx) => ({ t, idx }))
                                .filter(item => item.t.value === '->' || item.t.value === '?->')
                                .pop()?.idx;

                            if (lastArrowIndex !== undefined && lastArrowIndex > 0) {
                                const arrowToken = exprTokens[lastArrowIndex];
                                const isNullsafe = arrowToken.value === '?->';
                                const target = exprTokens.slice(0, lastArrowIndex).map(t => t.value).join('');
                                const property = exprTokens[lastArrowIndex + 1]?.value || '';
                                const isMethod = exprTokens[lastArrowIndex + 2]?.value === '(';

                                return isMethod
                                    ? PhpAstFactory.methodChain(target, property, isNullsafe)
                                    : PhpAstFactory.propertyAccess(target, property, isNullsafe);
                            }

                            return PhpAstFactory.rawExpression(raw);
                        }

                        // UserResource::collection(...) or UserResource::make(...)
                        switch (exprTokens[1]?.value) {
                            case '::': {
                                const method = exprTokens[2]?.value;
                                const openParenIndex = exprTokens.findIndex(t => t.value === '(');
                                const closeParenIndex = exprTokens.length > 0 && exprTokens[exprTokens.length - 1].value === ')'
                                    ? exprTokens.length - 1
                                    : exprTokens.length;
                                const argument = openParenIndex >= 0 && closeParenIndex > openParenIndex
                                    ? exprTokens.slice(openParenIndex + 1, closeParenIndex).map(t => t.value).join('')
                                    : raw;

                                if (method === 'collection') {
                                    return PhpAstFactory.resourceCollection(first.value, argument);
                                }
                                if (method === 'make') {
                                    return PhpAstFactory.resourceSingle(first.value, argument);
                                }
                                return PhpAstFactory.rawExpression(raw);
                            }
                            default:
                                return PhpAstFactory.rawExpression(raw);
                        }
                    }
                }
            }
        }
    }
}