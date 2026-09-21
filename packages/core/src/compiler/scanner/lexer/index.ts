/**
 * lexer/index.ts
 *
 * Explicit Sub-Domain Exports for PHP Lexer & Micro-AST.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/lexer
 */

export {
    TokenType,
    type TokenDescriptor,
    type SourceOffset,
    type SourceLineNumber,
    type AstIdentifier,
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier,
    type PhpLiteralValue,
    type PhpAstValue,
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

export {
    SourceStream
} from "./SourceStream";

export {
    tokenizePhpSource
} from "./tokenizer";

export {
    classifyAstTokens,
    classifyAstValue
} from "./astClassifier";

export {
    parsePhpArray
} from "./arrayParser";

export type { PhpClassPropertyAst, PhpPropertyVisibility } from './phpAstDeclarationTypes';

export type {
    ControllerDeclarationAst,
    ControllerMethodAst,
    ControllerParameterAst,
    ResponseAttributeAst,
    ReturnStatementAst
} from './controllerAstTypes';

export { parseControllerDeclaration } from './controllerDeclarationParser';
export type { ControllerBodyAst, InlineValidationAst, ControllerErrorAst, HttpErrorStatusAst, ValidationRuleLiteralAst, ControllerDataflowAst, ControllerVariableDefinition, ControllerVariableDefinitionOrigin, ControllerVariableReference, ControllerVariableOrigin, ControllerDefinitionAvailability } from './controllerBodyAstTypes';
export { parseControllerBody } from './controllerBodyParser';
export type { ControllerDataflowReference } from './controllerDataflowAnalyzer';

export type { ResponseDtoDeclarationAst, ResponseDtoPropertyAst, PhpPropertyTypeAst } from './responseDtoAstTypes';
export { parseResponseDtoDeclaration } from './responseDtoDeclarationParser';
