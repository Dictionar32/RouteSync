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
    SourceOffset,
    SourceLineNumber,
    AstIdentifier,
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier,
    PhpLiteralValue,
    PhpAstValue,
    PhpAstFactory,
    PhpAstValueVisitor,
    PhpMicroAstVisitor,
    matchPhpAstValue,
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
    SourceOffset,
    SourceLineNumber,
    AstIdentifier,
    PhpLiteralValue,
    PhpAstValue,
    PhpAstValueVisitor,
    PhpMicroAstVisitor,
    PhpArrayEntry,
    ParsedPhpArrayResult
};
export {
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier,
    PhpAstFactory,
    matchPhpAstValue,
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
    static tokenize(source: string): readonly TokenDescriptor[] {
        return tokenizePhpSource(source);
    }

    static parseArray(source: string, tokens: readonly TokenDescriptor[], startIndex: number = 0): ParsedPhpArrayResult {
        return parsePhpArray(source, tokens, startIndex);
    }

    static classifyAstValue(raw: string): PhpAstValue {
        return classifyAstValue(raw);
    }

    static classifyAstTokens(exprTokens: readonly TokenDescriptor[], raw: string): PhpAstValue {
        return classifyAstTokens(exprTokens, raw);
    }

    static matchAstValue<R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
        return matchPhpAstValue(ast, visitor);
    }
}
