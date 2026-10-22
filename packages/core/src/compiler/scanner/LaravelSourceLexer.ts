/**
 * LaravelSourceLexer.ts
 *
 * Active Consumer Orchestrator for Zero-Dependency Pure TypeScript FSM Lexer.
 * Coordinates tokenization, micro-AST classification, and structured array parsing.
 *
 * @module core/compiler/scanner
 */

import {
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier,
    PhpAstFactory,
    matchPhpAstValue
} from "./lexer";
import type { TokenType, TokenDescriptor, SourceOffset, SourceLineNumber, AstIdentifier, PhpLiteralValue, PhpAstValue, PhpAstValueVisitor, PhpMicroAstVisitor, PhpArrayEntry, PhpArgument, PhpParameter, PhpClosureCapture, PhpStatement, PhpBlock, ParsedPhpArrayResult, SourceStream } from "./lexer";
import { phpSourceTokenizer } from "./lexer/tokenizer";
import type { PhpSourceTokenizerInterface } from "./lexer/tokenizer";
import { phpArrayParser } from "./lexer/arrayParser";
import type { PhpArrayParserInterface } from "./lexer/arrayParser";
import { classifyAstTokens, classifyAstValue, classifyPhpBlock } from "./lexer/astClassifier";
import { parseRouteDeclarations } from "./lexer/routeAst/routeDeclarationParser";
import type { RouteDeclarationAst } from "./lexer/routeAst/routeDeclarationAst";
import { parseControllerDeclaration, parseControllerDeclarationFromInvocationJudgment } from "./lexer/controllerDeclarationParser";
import type { LaravelControllerAstProjectionContext, LaravelControllerInvocationSemanticJudgmentInterface, LaravelControllerAstProjectionSemanticAuthorityInterface } from '../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
import { laravelControllerAstProjectionSemanticAuthority } from '../../types/upstream/laravelControllerAstProjectionSemanticAuthority';
import { phpClassNameResolutionAuthority } from '../../types/upstream/phpClassNameResolutionAuthority';
import type { PhpClassNameResolutionRuleInterface } from '../../types/upstream/phpClassNameResolutionInterface';
import type { ControllerDeclarationAst } from "./lexer/controllerAstTypes";
import { parseResponseDtoDeclaration } from './lexer/responseDtoDeclarationParser';
import type { ResponseDtoDeclarationAst } from './lexer/responseDtoAstTypes';

function parseControllerDeclarationFacade(
    source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier,
    context?: Extract<LaravelControllerAstProjectionContext, { readonly kind: 'syntax_only' }>,
    projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
    classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
): ControllerDeclarationAst<false>;
function parseControllerDeclarationFacade(
    source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier,
    context: Extract<LaravelControllerAstProjectionContext, { readonly kind: 'invocation_semantic_judgment' }>,
    projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
    classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
): ControllerDeclarationAst<true>;
function parseControllerDeclarationFacade(
    source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier, context: LaravelControllerAstProjectionContext = Object.freeze({ kind: 'syntax_only' }),
    projectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface = laravelControllerAstProjectionSemanticAuthority,
    classNameResolutionAuthority: PhpClassNameResolutionRuleInterface = phpClassNameResolutionAuthority,
): ControllerDeclarationAst<boolean> {
    return parseControllerDeclaration(source, tokens, className, context, projectionAuthority, classNameResolutionAuthority);
}

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
    SourceStream,
    PhpSourceTokenizerInterface,
    PhpArrayParserInterface,
    RouteDeclarationAst,
    ControllerDeclarationAst,
    ResponseDtoDeclarationAst,
    ResponseDtoPropertyTypeEvidence
};
export {
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier,
    PhpAstFactory,
    matchPhpAstValue,
    phpSourceTokenizer,
    phpArrayParser,
    classifyAstTokens,
    classifyAstValue,
    classifyPhpBlock,
    parseRouteDeclarations,
    parseControllerDeclaration,
    parseControllerDeclarationFromInvocationJudgment,
    parseResponseDtoDeclaration
};

/** Immutable scanner facade. Projection mode is explicit; invocation authority remains upstream. */
export const LaravelSourceLexer = Object.freeze({
    tokenize: (source: string): readonly TokenDescriptor[] => phpSourceTokenizer.tokenize(source),
    parseArray: (source: string, tokens: readonly TokenDescriptor[], startIndex: number = 0): ParsedPhpArrayResult => phpArrayParser.parse(source, tokens, startIndex),
    classifyAstValue: (raw: string): PhpAstValue => classifyAstValue(raw),
    classifyAstTokens: (exprTokens: readonly TokenDescriptor[]): PhpAstValue => classifyAstTokens(exprTokens),
    classifyPhpBlock: (tokens: readonly TokenDescriptor[]): PhpBlock => classifyPhpBlock(tokens),
    parseRouteDeclarations: (tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] => parseRouteDeclarations(tokens),
    parseControllerDeclaration: parseControllerDeclarationFacade,
    parseControllerDeclarationFromInvocationJudgment: (source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier, invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface, projectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface = laravelControllerAstProjectionSemanticAuthority, classNameResolutionAuthority: PhpClassNameResolutionRuleInterface = phpClassNameResolutionAuthority): ControllerDeclarationAst => parseControllerDeclarationFromInvocationJudgment(source, tokens, className, invocationJudgment, projectionAuthority, classNameResolutionAuthority),
    parseResponseDtoDeclaration: (tokens: readonly TokenDescriptor[], className: AstIdentifier): ResponseDtoDeclarationAst => parseResponseDtoDeclaration(tokens, className),
    matchAstValue: <R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R => matchPhpAstValue(ast, visitor),
});
