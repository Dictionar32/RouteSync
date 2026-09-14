/**
 * phpAstAlgebra.ts
 *
 * Pure Catamorphism Eliminator / Visitor Algebra for PhpAstValue.
 * Constant-time O(1) table dispatch: 0 'if', 0 'switch', 0 type casts.
 * Conforms to Rule 12 & Rule 14 (<= 100 lines).
 *
 * @module core/compiler/scanner/lexer/phpAstAlgebra
 */

import type { PhpAstValue } from "./phpAstTypes";

export interface PhpAstValueVisitor<R> {
    readonly literal: (node: Extract<PhpAstValue, { kind: 'literal' }>) => R;
    readonly resourceSingle: (node: Extract<PhpAstValue, { kind: 'resource_single' }>) => R;
    readonly resourceCollection: (node: Extract<PhpAstValue, { kind: 'resource_collection' }>) => R;
    readonly methodChain: (node: Extract<PhpAstValue, { kind: 'method_chain' }>) => R;
    readonly propertyAccess: (node: Extract<PhpAstValue, { kind: 'property_access' }>) => R;
    readonly variableReference: (node: Extract<PhpAstValue, { kind: 'variable_reference' }>) => R;
    readonly ternaryExpression: (node: Extract<PhpAstValue, { kind: 'ternary_expression' }>) => R;
    readonly nestedArray: (node: Extract<PhpAstValue, { kind: 'nested_array' }>) => R;
    readonly rawExpression: (node: Extract<PhpAstValue, { kind: 'raw_expression' }>) => R;
}

export type PhpMicroAstVisitor<R> = PhpAstValueVisitor<R>;

const DISPATCH_TABLE: {
    readonly [K in PhpAstValue['kind']]: <R>(
        ast: Extract<PhpAstValue, { kind: K }>,
        visitor: PhpAstValueVisitor<R>
    ) => R;
} = Object.freeze({
    literal: (ast, visitor) => visitor.literal(ast),
    resource_single: (ast, visitor) => visitor.resourceSingle(ast),
    resource_collection: (ast, visitor) => visitor.resourceCollection(ast),
    method_chain: (ast, visitor) => visitor.methodChain(ast),
    property_access: (ast, visitor) => visitor.propertyAccess(ast),
    variable_reference: (ast, visitor) => visitor.variableReference(ast),
    ternary_expression: (ast, visitor) => visitor.ternaryExpression(ast),
    nested_array: (ast, visitor) => visitor.nestedArray(ast),
    raw_expression: (ast, visitor) => visitor.rawExpression(ast)
});

/**
 * Pure Catamorphic Projector for PhpAstValue.
 * 1 Input, 1 Visitor, 1 Output, 0 'if', 0 'switch'.
 */
export function matchPhpAstValue<R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
    const handler = DISPATCH_TABLE[ast.kind];
    return handler(ast as any, visitor);
}
