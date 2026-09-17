/**
 * index.ts
 *
 * Domain ADT #32: PHP AST Model, Specifications, Catamorphisms & F-Algebra.
 * Zero wildcard re-exports (0 `export * from`), conforms to Rule 14.
 *
 * @module core/types/domain/phpAst
 */

export {
    PhpAstKind,
    type PhpAstCategory,
    type PhpAstKindSpecification,
    type PhpAstKindRegistry,
    PHP_AST_KIND_REGISTRY,
    type PhpAstKindVisitor,
    matchPhpAstKind
} from './kinds';

export {
    type BasePhpAstNode,
    type PropertyLookupAstNode,
    type NullsafePropertyLookupAstNode,
    type OffsetLookupAstNode,
    type StaticPropertyLookupAstNode,
    type FunctionCallAstNode,
    type MethodCallAstNode,
    type NullsafeMethodCallAstNode,
    type StaticMethodCallAstNode,
    type VariableCallAstNode,
    type NewInstanceAstNode,
    type ClosureAstNode,
    type ArrowFuncAstNode,
    type BinaryAstNode,
    type UnaryAstNode,
    type TypeCastAstNode,
    type TernaryAstNode,
    type ArrayEntryAstNode,
    type ArrayAstNode,
    type LiteralAstNode,
    type StaticConstantAstNode,
    type VariableAstNode,
    type UnsupportedAstNode,
    type UnsupportedAstReason,
    type PhpAstNode,
    type PhpArgument,
    type PhpBlock,
    type PhpStatement
} from './nodes';

export {
    type PhpReturnExpression,
    type PhpAstVisitor,
    matchPhpAstNode,
    type PhpAstFolder,
    type FoldedPhpArgument,
    type FoldedPhpReturnExpression,
    type FoldedPhpStatement,
    foldPhpAstNode
} from './algebra';
