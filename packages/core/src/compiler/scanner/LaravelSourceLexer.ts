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
} from "../frontend/php";
import type { TokenType, TokenDescriptor, SourceOffset, SourceLineNumber, AstIdentifier, PhpLiteralValue, PhpAstValue, PhpAstValueVisitor, PhpMicroAstVisitor, PhpArrayEntry, PhpArgument, PhpParameter, PhpClosureCapture, PhpStatement, PhpBlock, ParsedPhpArrayResult, SourceStream } from "../frontend/php";
import { phpSourceTokenizer } from "../frontend/php/tokenizer";
import type { PhpSourceTokenizerInterface } from "../frontend/php/tokenizer";
import { phpArrayParser } from "../frontend/php/arrayParser";
import type { PhpArrayParserInterface } from "../frontend/php/arrayParser";
import { classifyAstTokens, classifyAstValue, classifyPhpBlock } from "../frontend/php/astClassifier";
import { routeDeclarationParser } from "../frontend/php/routeAst/routeDeclarationParser";
import type { RouteDeclarationAst } from "../frontend/php/routeAst/routeDeclarationAst";
import { controllerDeclarationParser } from "../frontend/php/controllerDeclarationParser";
import type { LaravelControllerAstProjectionContext, LaravelControllerInvocationSemanticJudgmentInterface, LaravelControllerAstProjectionSemanticAuthorityInterface } from '../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
import { laravelControllerAstProjectionSemanticAuthority } from '../../types/upstream/laravelControllerAstProjectionSemanticAuthority';
import { phpClassNameResolutionAuthority } from '../../types/upstream/phpClassNameResolutionAuthority';
import type { PhpClassNameResolutionRuleInterface } from '../../types/upstream/phpClassNameResolutionInterface';
import type { ControllerDeclarationAst } from "../frontend/php/controllerAstTypes";
import { parseResponseDtoDeclaration } from '../frontend/php/responseDtoDeclarationParser';
import type { ResponseDtoDeclarationAst } from '../frontend/php/responseDtoAstTypes';

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
    return context.kind === 'syntax_only'
        ? controllerDeclarationParser.parseSyntaxOnly(source, tokens, className, context, projectionAuthority, classNameResolutionAuthority)
        : controllerDeclarationParser.parseWithInvocationJudgment(source, tokens, className, context.judgment, projectionAuthority, classNameResolutionAuthority);
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
    routeDeclarationParser,
    controllerDeclarationParser,
    parseResponseDtoDeclaration
};

/** Immutable scanner facade. Projection mode is explicit; invocation authority remains upstream. */
export const LaravelSourceLexer = Object.freeze({
    tokenize: (source: string): readonly TokenDescriptor[] => phpSourceTokenizer.tokenize(source),
    parseArray: (source: string, tokens: readonly TokenDescriptor[], startIndex: number = 0): ParsedPhpArrayResult => phpArrayParser.parse(source, tokens, startIndex),
    classifyAstValue: (raw: string): PhpAstValue => classifyAstValue(raw),
    classifyAstTokens: (exprTokens: readonly TokenDescriptor[]): PhpAstValue => classifyAstTokens(exprTokens),
    classifyPhpBlock: (tokens: readonly TokenDescriptor[]): PhpBlock => classifyPhpBlock(tokens),
    parseRouteDeclarations: (tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] => routeDeclarationParser.parse(tokens),
    parseControllerDeclaration: parseControllerDeclarationFacade,
    parseControllerDeclarationFromInvocationJudgment: (source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier, invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface, projectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface = laravelControllerAstProjectionSemanticAuthority, classNameResolutionAuthority: PhpClassNameResolutionRuleInterface = phpClassNameResolutionAuthority): ControllerDeclarationAst => controllerDeclarationParser.parseWithInvocationJudgment(source, tokens, className, invocationJudgment, projectionAuthority, classNameResolutionAuthority),
    parseResponseDtoDeclaration: (tokens: readonly TokenDescriptor[], className: AstIdentifier): ResponseDtoDeclarationAst => parseResponseDtoDeclaration(tokens, className),
    matchAstValue: <R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R => matchPhpAstValue(ast, visitor),
});
