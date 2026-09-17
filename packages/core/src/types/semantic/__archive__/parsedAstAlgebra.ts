/**
 * parsedAstAlgebra.ts
 *
 * Catamorphic pattern matching algebra for ParsedASTNode.
 * 0 `if`, 0 `switch`, constant-time $O(1)$ table dispatch.
 *
 * @module core/types/semantic
 */

import type { RootASTNode } from './sourceProvenance';
import type {
  ParsedASTNode,
  VariableAST,
  PropertyAccessAST,
  MethodCallAST,
  BinaryExpressionAST,
  TypeCastAST,
  TernaryAST,
  LiteralAST,
  NullLiteralAST,
  NullsafeChainAST,
  UnknownAST,
  PrimitiveAST,
  ResourceAST,
  ModelAST,
  StaticMethodCallAST,
  NullsafePropertyAccessAST,
  NewInstanceAST
} from './parsedAstTypes';

export interface ParsedASTVisitor<R> {
  readonly root: (node: RootASTNode) => R;
  readonly variable: (node: VariableAST) => R;
  readonly property_access: (node: PropertyAccessAST) => R;
  readonly method_call: (node: MethodCallAST) => R;
  readonly binary_expression: (node: BinaryExpressionAST) => R;
  readonly type_cast: (node: TypeCastAST) => R;
  readonly ternary: (node: TernaryAST) => R;
  readonly literal: (node: LiteralAST) => R;
  readonly null_literal: (node: NullLiteralAST) => R;
  readonly nullsafe_chain: (node: NullsafeChainAST) => R;
  readonly unknown: (node: UnknownAST) => R;
  readonly primitive: (node: PrimitiveAST) => R;
  readonly resource: (node: ResourceAST) => R;
  readonly model: (node: ModelAST) => R;
  readonly static_method_call: (node: StaticMethodCallAST) => R;
  readonly nullsafe_property_access: (node: NullsafePropertyAccessAST) => R;
  readonly new_instance: (node: NewInstanceAST) => R;
}

/**
 * 0 `if`, 0 `switch` Catamorphic Eliminator for ParsedASTNode
 */
export function matchParsedAST<R>(
  node: ParsedASTNode,
  visitor: ParsedASTVisitor<R>
): R {
  const handler = visitor[node.kind] as (n: ParsedASTNode) => R;
  return handler(node);
}
