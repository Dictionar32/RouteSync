/** Exhaustive eliminator for scanner-level PHP syntax AST. */
import type { PhpAstValue, PhpPropertyPath } from './phpAstTypes';

export interface PhpAstValueVisitor<R> {
    readonly literal: (node: Extract<PhpAstValue, { kind: 'literal' }>) => R;
    readonly interpolatedString: (node: Extract<PhpAstValue, { kind: 'interpolated_string' }>) => R;
    readonly resourceSingle: (node: Extract<PhpAstValue, { kind: 'resource_single' }>) => R;
    readonly resourceCollection: (node: Extract<PhpAstValue, { kind: 'resource_collection' }>) => R;
    readonly methodChain: (node: Extract<PhpAstValue, { kind: 'method_chain' }>) => R;
    readonly propertyAccess: (node: Extract<PhpAstValue, { kind: 'property_access' }>) => R;
    readonly arrayAccess: (node: Extract<PhpAstValue, { kind: 'array_access' }>) => R;
    readonly functionCall: (node: Extract<PhpAstValue, { kind: 'function_call' }>) => R;
    readonly callableCall: (node: Extract<PhpAstValue, { kind: 'callable_call' }>) => R;
    readonly variableReference: (node: Extract<PhpAstValue, { kind: 'variable_reference' }>) => R;
    readonly magicConstant: (node: Extract<PhpAstValue, { kind: 'magic_constant' }>) => R;
    readonly constantReference: (node: Extract<PhpAstValue, { kind: 'constant_reference' }>) => R;
    readonly shortTernary: (node: Extract<PhpAstValue, { kind: 'short_ternary' }>) => R;
    readonly nullCoalesce: (node: Extract<PhpAstValue, { kind: 'null_coalesce' }>) => R;
    readonly binaryExpression: (node: Extract<PhpAstValue, { kind: 'binary_expression' }>) => R;
    readonly unaryExpression: (node: Extract<PhpAstValue, { kind: 'unary_expression' }>) => R;
    readonly castExpression: (node: Extract<PhpAstValue, { kind: 'cast_expression' }>) => R;
    readonly ternaryExpression: (node: Extract<PhpAstValue, { kind: 'ternary_expression' }>) => R;
    readonly nestedArray: (node: Extract<PhpAstValue, { kind: 'nested_array' }>) => R;
    readonly staticCall: (node: Extract<PhpAstValue, { kind: 'static_call' }>) => R;
    readonly classReference: (node: Extract<PhpAstValue, { kind: 'class_reference' }>) => R;
    readonly classConstant: (node: Extract<PhpAstValue, { kind: 'class_constant' }>) => R;
    readonly construct: (node: Extract<PhpAstValue, { kind: 'construct' }>) => R;
    readonly assignmentExpression: (node: Extract<PhpAstValue, { kind: 'assignment_expression' }>) => R;
    readonly dynamicConstruct: (node: Extract<PhpAstValue, { kind: 'dynamic_construct' }>) => R;
    readonly anonymousClassConstruct: (node: Extract<PhpAstValue, { kind: 'anonymous_class_construct' }>) => R;
    readonly instanceOf: (node: Extract<PhpAstValue, { kind: 'instance_of' }>) => R;
    readonly closure: (node: Extract<PhpAstValue, { kind: 'closure' }>) => R;
    readonly arrowFunction: (node: Extract<PhpAstValue, { kind: 'arrow_function' }>) => R;
    readonly matchExpression: (node: Extract<PhpAstValue, { kind: 'match_expression' }>) => R;
    readonly unsupported: (node: Extract<PhpAstValue, { kind: 'unsupported' }>) => R;
}
export type PhpMicroAstVisitor<R> = PhpAstValueVisitor<R>;

export interface PhpPropertyPathVisitor<R> {
    readonly single: (path: Extract<PhpPropertyPath, { readonly kind: 'single' }>) => R;
    readonly chain: (path: Extract<PhpPropertyPath, { readonly kind: 'chain' }>) => R;
}

export function matchPhpPropertyPath<R>(path: PhpPropertyPath, visitor: PhpPropertyPathVisitor<R>): R {
    switch (path.kind) {
        case 'single': return visitor.single(path);
        case 'chain': return visitor.chain(path);
    }
}

export function matchPhpAstValue<R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
    switch (ast.kind) {
        case 'literal': return visitor.literal(ast);
        case 'interpolated_string': return visitor.interpolatedString(ast);
        case 'resource_single': return visitor.resourceSingle(ast);
        case 'resource_collection': return visitor.resourceCollection(ast);
        case 'method_chain': return visitor.methodChain(ast);
        case 'property_access': return visitor.propertyAccess(ast);
        case 'array_access': return visitor.arrayAccess(ast);
        case 'function_call': return visitor.functionCall(ast);
        case 'callable_call': return visitor.callableCall(ast);
        case 'variable_reference': return visitor.variableReference(ast);
        case 'magic_constant': return visitor.magicConstant(ast);
        case 'constant_reference': return visitor.constantReference(ast);
        case 'short_ternary': return visitor.shortTernary(ast);
        case 'null_coalesce': return visitor.nullCoalesce(ast);
        case 'binary_expression': return visitor.binaryExpression(ast);
        case 'unary_expression': return visitor.unaryExpression(ast);
        case 'cast_expression': return visitor.castExpression(ast);
        case 'ternary_expression': return visitor.ternaryExpression(ast);
        case 'nested_array': return visitor.nestedArray(ast);
        case 'static_call': return visitor.staticCall(ast);
        case 'class_reference': return visitor.classReference(ast);
        case 'class_constant': return visitor.classConstant(ast);
        case 'construct': return visitor.construct(ast);
        case 'assignment_expression': return visitor.assignmentExpression(ast);
        case 'dynamic_construct': return visitor.dynamicConstruct(ast);
        case 'anonymous_class_construct': return visitor.anonymousClassConstruct(ast);
        case 'instance_of': return visitor.instanceOf(ast);
        case 'closure': return visitor.closure(ast);
        case 'arrow_function': return visitor.arrowFunction(ast);
        case 'match_expression': return visitor.matchExpression(ast);
        case 'unsupported': return visitor.unsupported(ast);
    }
}

export interface PhpAccessModeVisitor<R> {
    readonly direct: (mode: Extract<import('./phpAstExpressionTypes').PhpAccessMode, { kind: 'direct' }>) => R;
    readonly nullsafe: (mode: Extract<import('./phpAstExpressionTypes').PhpAccessMode, { kind: 'nullsafe' }>) => R;
}

export function matchPhpAccessMode<R>(mode: import('./phpAstExpressionTypes').PhpAccessMode, visitor: PhpAccessModeVisitor<R>): R {
    switch (mode.kind) {
        case 'direct': return visitor.direct(mode);
        case 'nullsafe': return visitor.nullsafe(mode);
    }
}

export interface PhpMatchArmVisitor<R> {
    readonly conditional: (node: Extract<import('./phpAstExpressionTypes').PhpMatchArm, { kind: 'conditional' }>) => R;
    readonly default: (node: Extract<import('./phpAstExpressionTypes').PhpMatchArm, { kind: 'default' }>) => R;
}

export function matchPhpMatchArm<R>(arm: import('./phpAstExpressionTypes').PhpMatchArm, visitor: PhpMatchArmVisitor<R>): R {
    switch (arm.kind) {
        case 'conditional': return visitor.conditional(arm);
        case 'default': return visitor.default(arm);
    }
}

export interface PhpStatementVisitor<R> {
    readonly expression_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'expression_statement' }>) => R;
    readonly return_with_value: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'return_with_value' }>) => R;
    readonly return_void: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'return_void' }>) => R;
    readonly assignment: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'assignment' }>) => R;
    readonly if_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'if_statement' }>) => R;
    readonly foreach_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'foreach_statement' }>) => R;
    readonly for_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'for_statement' }>) => R;
    readonly try_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'try_statement' }>) => R;
    readonly throw_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'throw_statement' }>) => R;
}

export function matchPhpStatement<R>(statement: import('./phpAstStatementTypes').PhpStatement, visitor: PhpStatementVisitor<R>): R {
    switch (statement.kind) {
        case 'expression_statement': return visitor.expression_statement(statement);
        case 'return_with_value': return visitor.return_with_value(statement);
        case 'return_void': return visitor.return_void(statement);
        case 'assignment': return visitor.assignment(statement);
        case 'if_statement': return visitor.if_statement(statement);
        case 'foreach_statement': return visitor.foreach_statement(statement);
        case 'for_statement': return visitor.for_statement(statement);
        case 'try_statement': return visitor.try_statement(statement);
        case 'throw_statement': return visitor.throw_statement(statement);
    }
}
