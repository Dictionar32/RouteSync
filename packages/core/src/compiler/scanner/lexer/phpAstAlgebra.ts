/** Exhaustive eliminator for scanner-level PHP syntax AST. */
import type { PhpAstValue } from './phpAstTypes';

export interface PhpAstValueVisitor<R> {
    readonly literal: (node: Extract<PhpAstValue, { kind: 'literal' }>) => R;
    readonly resourceSingle: (node: Extract<PhpAstValue, { kind: 'resource_single' }>) => R;
    readonly resourceCollection: (node: Extract<PhpAstValue, { kind: 'resource_collection' }>) => R;
    readonly methodChain: (node: Extract<PhpAstValue, { kind: 'method_chain' }>) => R;
    readonly propertyAccess: (node: Extract<PhpAstValue, { kind: 'property_access' }>) => R;
    readonly arrayAccess: (node: Extract<PhpAstValue, { kind: 'array_access' }>) => R;
    readonly functionCall: (node: Extract<PhpAstValue, { kind: 'function_call' }>) => R;
    readonly variableReference: (node: Extract<PhpAstValue, { kind: 'variable_reference' }>) => R;
    readonly shortTernary: (node: Extract<PhpAstValue, { kind: 'short_ternary' }>) => R;
    readonly nullCoalesce: (node: Extract<PhpAstValue, { kind: 'null_coalesce' }>) => R;
    readonly binaryExpression: (node: Extract<PhpAstValue, { kind: 'binary_expression' }>) => R;
    readonly unaryExpression: (node: Extract<PhpAstValue, { kind: 'unary_expression' }>) => R;
    readonly castExpression: (node: Extract<PhpAstValue, { kind: 'cast_expression' }>) => R;
    readonly ternaryExpression: (node: Extract<PhpAstValue, { kind: 'ternary_expression' }>) => R;
    readonly nestedArray: (node: Extract<PhpAstValue, { kind: 'nested_array' }>) => R;
    readonly staticCall: (node: Extract<PhpAstValue, { kind: 'static_call' }>) => R;
    readonly classReference: (node: Extract<PhpAstValue, { kind: 'class_reference' }>) => R;
    readonly construct: (node: Extract<PhpAstValue, { kind: 'construct' }>) => R;
    readonly instanceOf: (node: Extract<PhpAstValue, { kind: 'instance_of' }>) => R;
    readonly closure: (node: Extract<PhpAstValue, { kind: 'closure' }>) => R;
    readonly arrowFunction: (node: Extract<PhpAstValue, { kind: 'arrow_function' }>) => R;
    readonly matchExpression: (node: Extract<PhpAstValue, { kind: 'match_expression' }>) => R;
    readonly unsupported: (node: Extract<PhpAstValue, { kind: 'unsupported' }>) => R;
}
export type PhpMicroAstVisitor<R> = PhpAstValueVisitor<R>;

export function matchPhpAstValue<R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
    switch (ast.kind) {
        case 'literal': return visitor.literal(ast);
        case 'resource_single': return visitor.resourceSingle(ast);
        case 'resource_collection': return visitor.resourceCollection(ast);
        case 'method_chain': return visitor.methodChain(ast);
        case 'property_access': return visitor.propertyAccess(ast);
        case 'array_access': return visitor.arrayAccess(ast);
        case 'function_call': return visitor.functionCall(ast);
        case 'variable_reference': return visitor.variableReference(ast);
        case 'short_ternary': return visitor.shortTernary(ast);
        case 'null_coalesce': return visitor.nullCoalesce(ast);
        case 'binary_expression': return visitor.binaryExpression(ast);
        case 'unary_expression': return visitor.unaryExpression(ast);
        case 'cast_expression': return visitor.castExpression(ast);
        case 'ternary_expression': return visitor.ternaryExpression(ast);
        case 'nested_array': return visitor.nestedArray(ast);
        case 'static_call': return visitor.staticCall(ast);
        case 'class_reference': return visitor.classReference(ast);
        case 'construct': return visitor.construct(ast);
        case 'instance_of': return visitor.instanceOf(ast);
        case 'closure': return visitor.closure(ast);
        case 'arrow_function': return visitor.arrowFunction(ast);
        case 'match_expression': return visitor.matchExpression(ast);
        case 'unsupported': return visitor.unsupported(ast);
    }
}
