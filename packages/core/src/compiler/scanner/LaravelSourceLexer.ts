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

/** Immutable scanner facade. Semantic authority remains in lexer relations. */
export const LaravelSourceLexer = Object.freeze({
    tokenize: (source: string): readonly TokenDescriptor[] => tokenizePhpSource(source),
    parseArray: (source: string, tokens: readonly TokenDescriptor[], startIndex: number = 0): ParsedPhpArrayResult => parsePhpArray(source, tokens, startIndex),
    classifyAstValue: (raw: string): PhpAstValue => classifyAstValue(raw),
    classifyAstTokens: (exprTokens: readonly TokenDescriptor[]): PhpAstValue => classifyAstTokens(exprTokens),
    classifyPhpBlock: (tokens: readonly TokenDescriptor[]): PhpBlock => classifyPhpBlock(tokens),
    parseRouteDeclarations: (tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] => parseRouteDeclarations(tokens),
    parseControllerDeclaration: (source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier, filePath = '<php-source>'): ControllerDeclarationAst => parseControllerDeclaration(source, tokens, className, filePath),
    parseResponseDtoDeclaration: (tokens: readonly TokenDescriptor[], className: AstIdentifier): ResponseDtoDeclarationAst => parseResponseDtoDeclaration(tokens, className),
    matchAstValue: <R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R => matchPhpAstValue(ast, visitor),
});
