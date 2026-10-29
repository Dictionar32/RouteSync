/**
 * lexer/index.ts
 *
 * Explicit Sub-Domain Exports for PHP Lexer & Micro-AST.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/frontend/php
 */

export {
    type TokenType,
    type TokenDescriptor,
    type SourceOffset,
    type SourceLineNumber,
    type AstIdentifier,
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier,
    type PhpLiteralValue,
    type PhpAstValue,
    type PhpClassReferenceSourceEvidence,
    PhpAstFactory,
    type PhpAstValueVisitor,
    type PhpMicroAstVisitor,
    matchPhpAstValue,
    type PhpArrayEntry,
    type PhpArgument,
    type PhpParameter,
    type PhpClosureCapture,
    type PhpStatement,
    type PhpBlock,
    type ParsedPhpArrayResult
} from "./PhpAst";

export type { SourceStream } from "./SourceStream";

export { phpSourceTokenizer } from "./tokenizer";
export type { PhpSourceTokenizerInterface } from "./tokenizer";

export {
    classifyAstTokens,
    classifyAstValue
} from "./astClassifier";

export { phpArrayParser } from "./arrayParser";
export type { PhpArrayParserInterface } from "./arrayParser";

export { phpMethodParser } from './phpMethodParser';
export type { PhpMethodParserInterface } from './phpMethodParser';

export type { PhpClassPropertyAst, PhpPropertyVisibility, PhpPropertyStorage, PhpPropertyMutability, PhpPropertyTypeAst, PhpPropertyInitializationAst, PhpPropertyValueAst, PhpPropertyPromotionAst } from './phpAstDeclarationTypes';

export type {
    ControllerInheritanceAst,
    ControllerDeclarationAst,
    ControllerMethodAst,
    ControllerParameterAst,
    ResponseAttributeAst,
    ReturnStatementAst
} from './controllerAstTypes';

export { controllerDeclarationParser } from './controllerDeclarationParser';
export type { ControllerDeclarationParserInterface } from './controllerDeclarationParser';
export type { ControllerBodyAst, SyntaxOnlyControllerBodyAst, SemanticControllerBodyAst, InlineValidationAst, ControllerErrorAst, HttpErrorStatusAst, ValidationRuleLiteralAst, ControllerDataflowAst } from './controllerBodyAstTypes';
export { controllerBodyParser } from './controllerBodyParser';
export type { ControllerBodyParserInterface, ControllerBodyParserOperationInterface } from './controllerBodyParser';

export { controllerMethodParser } from './controllerMethodParser';
export type { ControllerMethodParserInterface, ControllerMethodParserOperationInterface } from './controllerMethodParser';
export { controllerReturnParser } from './controllerReturnParser';
export type { ControllerReturnParserInterface } from './controllerReturnParser';

export type { ResponseDtoDeclarationAst, ResponseDtoPropertyAst, ResponseDtoPropertyTypeEvidence } from './responseDtoAstTypes';
export { parseResponseDtoDeclaration } from './responseDtoDeclarationParser';

export type { ModelDeclarationAst, ModelDeclarationInheritanceAst, ModelMethodAst, ModelConstantAst } from './modelAstTypes';
export { parseModelDeclaration } from './modelDeclarationParser';

export {
    tokenAt,
    tokenValueAt,
    tokenKindAt,
    tokenValueEquals,
    tokenKindEquals,
    tokenEvidenceInterfaceAt,
    type TokenEvidence,
    type TokenEvidenceJudgment,
    type TokenEvidenceInterface
} from './tokenEvidence';

export { sourceAstSyntaxParser } from './sourceAstSyntaxParser';
export type { SourceAstParsedFile, SourceAstSyntaxParseContract, SourceAstSyntaxParserInterface } from '../../../types/upstream/sourceAstSyntaxParserInterface';
