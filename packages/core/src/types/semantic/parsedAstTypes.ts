/**
 * parsedAstTypes.ts
 *
 * Micro-AST nodes for expressions parsed from PHP Laravel sources.
 *
 * @module core/types/semantic
 */

import type { AccessKind } from '../contract';
import type { RootASTNode } from './sourceProvenance';

export interface VariableAST { readonly kind: "variable"; readonly name: string; }
export interface PropertyAccessAST {
  readonly kind: "property_access";
  readonly target: ParsedASTNode;
  readonly property: string;
  readonly accessKind: AccessKind;
}
export interface MethodCallAST {
  readonly kind: "method_call";
  readonly target: ParsedASTNode;
  readonly name: string;
  readonly args: readonly ParsedASTNode[];
  readonly resource?: string;
  readonly collection?: boolean;
}
export interface BinaryExpressionAST {
  readonly kind: "binary_expression";
  readonly operator: string;
  readonly left: ParsedASTNode;
  readonly right: ParsedASTNode;
}
export interface TypeCastAST {
  readonly kind: "type_cast";
  readonly castType: "int" | "float" | "string" | "bool";
  readonly expression: ParsedASTNode;
}
export interface TernaryAST {
  readonly kind: "ternary";
  readonly condition: ParsedASTNode;
  readonly truthy: ParsedASTNode;
  readonly falsy: ParsedASTNode;
}
export interface ScalarLiteralAST { readonly kind: "literal"; readonly value: string | number | boolean; }
export interface NullLiteralAST { readonly kind: "null_literal"; }
export type LiteralAST = ScalarLiteralAST;
export type ParsedLiteralAST = ScalarLiteralAST | NullLiteralAST;
export interface NullsafeChainAST { readonly kind: "nullsafe_chain"; readonly chain: readonly ParsedASTNode[]; }
export interface UnknownAST { readonly kind: "unknown"; readonly code: string; }
export interface PrimitiveAST { readonly kind: "primitive"; readonly type: string; }
export interface ResourceAST { readonly kind: "resource"; readonly resource: string; readonly collection?: boolean; }
export interface ModelAST { readonly kind: "model"; readonly model: string; }
export interface StaticMethodCallAST { readonly kind: "static_method_call"; readonly target: ParsedASTNode; readonly name: string; }
export interface NullsafePropertyAccessAST { readonly kind: "nullsafe_property_access"; readonly target: ParsedASTNode; readonly property: string; }
export interface NewInstanceAST {
  readonly kind: "new_instance";
  readonly target: ParsedASTNode;
  readonly resource?: string;
  readonly collection?: boolean;
}

export type ParsedASTNode =
  | RootASTNode
  | PropertyAccessAST
  | MethodCallAST
  | BinaryExpressionAST
  | TypeCastAST
  | TernaryAST
  | LiteralAST
  | NullLiteralAST
  | NullsafeChainAST
  | UnknownAST
  | VariableAST
  | PrimitiveAST
  | ResourceAST
  | ModelAST
  | StaticMethodCallAST
  | NullsafePropertyAccessAST
  | NewInstanceAST;
