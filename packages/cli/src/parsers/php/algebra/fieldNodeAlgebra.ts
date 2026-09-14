/**
 * fieldNodeAlgebra.ts
 *
 * Pure Bottom-Up F-Algebra: PhpAstNode → FieldNode.
 * Guaranteed deep immutability, zero if, zero switch.
 *
 * @module cli/parsers/php/algebra
 */

import type { FieldNode, PhpAstFolder, BinaryAstNode, UnaryAstNode, TypeCastAstNode, TernaryAstNode, ArrayAstNode, LiteralAstNode, StaticConstantAstNode, VariableAstNode, UnknownAstNode } from '@routesync/core';
import { MEMBER_ALGEBRA_SLICE } from './memberAlgebra';

export const FIELD_NODE_ALGEBRA: PhpAstFolder<FieldNode> = Object.freeze({
    ...MEMBER_ALGEBRA_SLICE,
    binary: (node: BinaryAstNode, left: FieldNode, right: FieldNode): FieldNode => Object.freeze({
        kind: 'binary_expression', originalCode: node.originalCode, operator: node.operator, left, right
    }),
    unary: (node: UnaryAstNode, what: FieldNode): FieldNode => (node.operator === '-' && what.kind === 'literal' && typeof what.value === 'number')
        ? Object.freeze({ kind: 'literal', originalCode: node.originalCode, value: -what.value })
        : Object.freeze({ kind: 'binary_expression', originalCode: node.originalCode, operator: node.operator, left: what, right: what }),
    typeCast: (node: TypeCastAstNode, expr: FieldNode): FieldNode => Object.freeze({
        kind: 'type_cast', originalCode: node.originalCode, castType: node.castType, expression: expr
    }),
    ternary: (node: TernaryAstNode, condition: FieldNode, truthy: FieldNode, falsy: FieldNode): FieldNode => Object.freeze({
        kind: 'ternary', originalCode: node.originalCode, condition, truthy, falsy
    }),
    array: (node: ArrayAstNode, items: readonly { readonly key: string | null; readonly value: FieldNode }[]): FieldNode => Object.freeze({
        kind: 'object',
        originalCode: node.originalCode,
        fields: Object.fromEntries(items.map((item, idx) => [item.key || String(idx), item.value])),
        entries: items.map((item, idx) => ({ key: item.key || String(idx), value: item.value }))
    }),
    literal: (node: LiteralAstNode): FieldNode => Object.freeze({
        kind: 'literal', originalCode: node.originalCode, value: node.value
    }),
    staticConstant: (node: StaticConstantAstNode): FieldNode => Object.freeze({
        kind: 'static_method_call', originalCode: node.originalCode, className: node.className, name: node.constantName, args: []
    }),
    variable: (node: VariableAstNode): FieldNode => Object.freeze({
        kind: 'variable', originalCode: node.originalCode, name: node.name
    }),
    unknown: (node: UnknownAstNode): FieldNode => Object.freeze({
        kind: 'unknown', originalCode: node.originalCode, code: node.code
    })
});
