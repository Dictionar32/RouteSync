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
    PhpArgument,
    PhpParameter,
    PhpClosureCapture,
    PhpStatement,
    PhpBlock,
    ParsedPhpArrayResult,
    SourceStream
} from "./lexer";
import { tokenizePhpSource } from "./lexer/tokenizer";
import { parsePhpArray } from "./lexer/arrayParser";
import { classifyAstTokens, classifyAstValue, classifyPhpBlock } from "./lexer/astClassifier";
import { parseRouteDeclarations } from "./lexer/routeAst";
import type { RouteDeclarationAst } from "./lexer/routeAst";
import { parseControllerDeclaration } from "./lexer/controllerDeclarationParser";
import type { ControllerDeclarationAst } from "./lexer/controllerAstTypes";
import { parseResponseDtoDeclaration } from './lexer/responseDtoDeclarationParser';
import type { ResponseDtoDeclarationAst } from './lexer/responseDtoAstTypes';

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
    PhpArgument,
    PhpParameter,
    PhpClosureCapture,
    PhpStatement,
    PhpBlock,
    ParsedPhpArrayResult,
    RouteDeclarationAst,
    ControllerDeclarationAst,
    ResponseDtoDeclarationAst
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
    classifyAstValue,
    classifyPhpBlock,
    parseRouteDeclarations,
    parseControllerDeclaration,
    parseResponseDtoDeclaration
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

    static classifyAstTokens(exprTokens: readonly TokenDescriptor[]): PhpAstValue {
        return classifyAstTokens(exprTokens);
    }

    static classifyPhpBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
        return classifyPhpBlock(tokens);
    }

    static parseRouteDeclarations(tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] {
        return parseRouteDeclarations(tokens);
    }

    static parseControllerDeclaration(
        source: string,
        tokens: readonly TokenDescriptor[],
        className: AstIdentifier
    ): ControllerDeclarationAst {
        return parseControllerDeclaration(source, tokens, className);
    }

    static parseResponseDtoDeclaration(
        tokens: readonly TokenDescriptor[],
        className: AstIdentifier
    ): ResponseDtoDeclarationAst {
        return parseResponseDtoDeclaration(tokens, className);
    }

    static matchAstValue<R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
        return matchPhpAstValue(ast, visitor);
    }
}
