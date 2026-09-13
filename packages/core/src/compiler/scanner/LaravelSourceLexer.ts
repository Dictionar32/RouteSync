/**
 * LaravelSourceLexer.ts
 *
 * Active Consumer Orchestrator for Zero-Dependency Pure TypeScript FSM Lexer.
 * Coordinates tokenization, micro-AST classification, and structured array parsing.
 *
 * @module core/compiler/scanner
 */

import {
    TokenType,
    TokenDescriptor,
    PhpLiteralValue,
    PhpAstValue,
    PhpAstFactory,
    PhpArrayEntry,
    ParsedPhpArrayResult,
    SourceStream
} from "./lexer";
import { tokenizePhpSource } from "./lexer/tokenizer";
import { parsePhpArray } from "./lexer/arrayParser";
import { classifyAstTokens, classifyAstValue } from "./lexer/astClassifier";

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type {
    TokenType,
    TokenDescriptor,
    PhpLiteralValue,
    PhpAstValue,
    PhpArrayEntry,
    ParsedPhpArrayResult
};
export {
    PhpAstFactory,
    SourceStream,
    tokenizePhpSource,
    parsePhpArray,
    classifyAstTokens,
    classifyAstValue
};

/**
 * Orchestrator class providing static entry points for PHP tokenization and AST parsing.
 */
export class LaravelSourceLexer {
    /**
     * Tokenizes PHP source code via a linear single-pass Atomic Lexer backed by SourceStream.
     */
    static tokenize(source: string): readonly TokenDescriptor[] {
        return tokenizePhpSource(source);
    }

    /**
     * Parses a PHP array declaration into structured key-value entries leveraging exact source slicing.
     */
    static parseArray(source: string, tokens: readonly TokenDescriptor[], startIndex: number = 0): ParsedPhpArrayResult {
        return parsePhpArray(source, tokens, startIndex);
    }

    /**
     * Classifies a raw PHP expression string into a structured PhpAstValue.
     */
    static classifyAstValue(raw: string): PhpAstValue {
        return classifyAstValue(raw);
    }

    /**
     * Classifies a sequence of token descriptors into a structured PhpAstValue.
     */
    static classifyAstTokens(exprTokens: readonly TokenDescriptor[], raw: string): PhpAstValue {
        return classifyAstTokens(exprTokens, raw);
    }
}
