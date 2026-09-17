import type {
  FieldNode, PhpAstFolder, BinaryAstNode, UnaryAstNode,
  TypeCastAstNode, TernaryAstNode, ArrayAstNode, LiteralAstNode,
  StaticConstantAstNode, VariableAstNode, UnknownAstNode,
  FoldedArrayKey
} from '@routesync/core';
import { MEMBER_ALGEBRA_SLICE } from './memberAlgebra';

export const FIELD_NODE_ALGEBRA: PhpAstFolder<FieldNode> = Object.freeze({
  ...MEMBER_ALGEBRA_SLICE,
  binary: (node: BinaryAstNode, left: FieldNode, right: FieldNode): FieldNode => Object.freeze({ kind: 'binary_expression', originalCode: node.originalCode, source: node.source, operator: node.operator, left, right }),
  unary: (node: UnaryAstNode, what: FieldNode): FieldNode => Object.freeze({ kind: 'unary_expression', originalCode: node.originalCode, source: node.source, operator: node.operator, expression: what }),
  typeCast: (node: TypeCastAstNode, expression: FieldNode): FieldNode => Object.freeze({ kind: 'type_cast', originalCode: node.originalCode, source: node.source, castType: node.castType, expression }),
  ternary: (node: TernaryAstNode, condition: FieldNode, truthy: FieldNode, falsy: FieldNode): FieldNode => Object.freeze({ kind: 'ternary', originalCode: node.originalCode, source: node.source, condition, truthy, falsy }),
  array: (node: ArrayAstNode, items: readonly { readonly key: FoldedArrayKey<FieldNode>; readonly value: FieldNode }[]): FieldNode => {
    const entries = items.map(item => Object.freeze({
      key: item.key.kind === 'implicit'
        ? Object.freeze({ kind: 'implicit' as const })
        : Object.freeze({ kind: 'explicit' as const, expression: item.key.expression }),
      value: item.value
    }));
    return Object.freeze({
      kind: 'array' as const,
      originalCode: node.originalCode,
      source: node.source,
      entries
    });
  },
  literal: (node: LiteralAstNode): FieldNode => Object.freeze({ kind: 'literal', originalCode: node.originalCode, source: node.source, value: node.value }),
  staticConstant: (node: StaticConstantAstNode): FieldNode => Object.freeze({ kind: 'static_constant', originalCode: node.originalCode, source: node.source, className: node.className, constantName: node.constantName }),
  variable: (node: VariableAstNode): FieldNode => Object.freeze({ kind: 'variable', originalCode: node.originalCode, source: node.source, name: node.name }),
  unknown: (node: UnknownAstNode): FieldNode => Object.freeze({ kind: 'unknown', originalCode: node.originalCode, source: node.source, reason: node.reason })
});
