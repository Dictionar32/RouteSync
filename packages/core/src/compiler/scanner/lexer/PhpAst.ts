/**
 * PhpAst.ts
 *
 * Active Consumer Orchestrator for PHP Micro-AST Types, Factory, and Catamorphism.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/compiler/scanner/lexer/PhpAst
 */

export type {
    SourceOffset,
    SourceLineNumber,
    AstIdentifier,
    TokenType,
    TokenDescriptor,
    PhpLiteralValue,
    PhpAstValue,
    PhpPropertyPath,
    PhpArrayEntry,
    PhpArrayKey,
    PhpArgument,
    PhpParameter,
    PhpClosureCapture,
    PhpAssignmentTarget,
    PhpMatchArm,
    PhpBinaryOperator,
    PhpUnaryOperator,
    PhpCastType,
    PhpAccessMode,
    PhpUnsupportedExpressionReason,
    PhpStatement,
    PhpIfAlternative,
    PhpForeachTarget,
    PhpForClause,
    PhpCatchClause,
    PhpFinallyClause,
    PhpBlock,
    ParsedPhpArrayResult
} from "./phpAstTypes";

export {
    createSourceOffset,
    createSourceLineNumber,
    createAstIdentifier
} from "./phpAstTypes";

export { PhpAstFactory } from "./phpAstFactory";

export {
    type PhpAstValueVisitor,
    type PhpMicroAstVisitor,
    matchPhpAstValue
} from "./phpAstAlgebra";
