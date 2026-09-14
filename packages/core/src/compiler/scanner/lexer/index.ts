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
