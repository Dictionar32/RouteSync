/** Exhaustive relational eliminator of scanner-level PHP syntax AST. */
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
    const handlers: Record<string, (node: PhpPropertyPath) => R> = {
        single: node => visitor.single(node as Extract<PhpPropertyPath, { readonly kind: 'single' }>),
        chain: node => visitor.chain(node as Extract<PhpPropertyPath, { readonly kind: 'chain' }>),
    };
    return handlers[path.kind](path);
}

export function matchPhpAstValue<R>(ast: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
    const handlers: Record<string, (node: PhpAstValue) => R> = {
        literal: node => visitor.literal(node as Extract<PhpAstValue, { kind: 'literal' }>),
        interpolated_string: node => visitor.interpolatedString(node as Extract<PhpAstValue, { kind: 'interpolated_string' }>),
        resource_single: node => visitor.resourceSingle(node as Extract<PhpAstValue, { kind: 'resource_single' }>),
        resource_collection: node => visitor.resourceCollection(node as Extract<PhpAstValue, { kind: 'resource_collection' }>),
        method_chain: node => visitor.methodChain(node as Extract<PhpAstValue, { kind: 'method_chain' }>),
        property_access: node => visitor.propertyAccess(node as Extract<PhpAstValue, { kind: 'property_access' }>),
        array_access: node => visitor.arrayAccess(node as Extract<PhpAstValue, { kind: 'array_access' }>),
        function_call: node => visitor.functionCall(node as Extract<PhpAstValue, { kind: 'function_call' }>),
        callable_call: node => visitor.callableCall(node as Extract<PhpAstValue, { kind: 'callable_call' }>),
        variable_reference: node => visitor.variableReference(node as Extract<PhpAstValue, { kind: 'variable_reference' }>),
        magic_constant: node => visitor.magicConstant(node as Extract<PhpAstValue, { kind: 'magic_constant' }>),
        constant_reference: node => visitor.constantReference(node as Extract<PhpAstValue, { kind: 'constant_reference' }>),
        short_ternary: node => visitor.shortTernary(node as Extract<PhpAstValue, { kind: 'short_ternary' }>),
        null_coalesce: node => visitor.nullCoalesce(node as Extract<PhpAstValue, { kind: 'null_coalesce' }>),
        binary_expression: node => visitor.binaryExpression(node as Extract<PhpAstValue, { kind: 'binary_expression' }>),
        unary_expression: node => visitor.unaryExpression(node as Extract<PhpAstValue, { kind: 'unary_expression' }>),
        cast_expression: node => visitor.castExpression(node as Extract<PhpAstValue, { kind: 'cast_expression' }>),
        ternary_expression: node => visitor.ternaryExpression(node as Extract<PhpAstValue, { kind: 'ternary_expression' }>),
        nested_array: node => visitor.nestedArray(node as Extract<PhpAstValue, { kind: 'nested_array' }>),
        static_call: node => visitor.staticCall(node as Extract<PhpAstValue, { kind: 'static_call' }>),
        class_reference: node => visitor.classReference(node as Extract<PhpAstValue, { kind: 'class_reference' }>),
        class_constant: node => visitor.classConstant(node as Extract<PhpAstValue, { kind: 'class_constant' }>),
        construct: node => visitor.construct(node as Extract<PhpAstValue, { kind: 'construct' }>),
        assignment_expression: node => visitor.assignmentExpression(node as Extract<PhpAstValue, { kind: 'assignment_expression' }>),
        dynamic_construct: node => visitor.dynamicConstruct(node as Extract<PhpAstValue, { kind: 'dynamic_construct' }>),
        anonymous_class_construct: node => visitor.anonymousClassConstruct(node as Extract<PhpAstValue, { kind: 'anonymous_class_construct' }>),
        instance_of: node => visitor.instanceOf(node as Extract<PhpAstValue, { kind: 'instance_of' }>),
        closure: node => visitor.closure(node as Extract<PhpAstValue, { kind: 'closure' }>),
        arrow_function: node => visitor.arrowFunction(node as Extract<PhpAstValue, { kind: 'arrow_function' }>),
        match_expression: node => visitor.matchExpression(node as Extract<PhpAstValue, { kind: 'match_expression' }>),
        unsupported: node => visitor.unsupported(node as Extract<PhpAstValue, { kind: 'unsupported' }>),
    };
    return handlers[ast.kind](ast);
}

export interface PhpAccessModeVisitor<R> {
    readonly direct: (mode: Extract<import('./phpAstExpressionTypes').PhpAccessMode, { kind: 'direct' }>) => R;
    readonly nullsafe: (mode: Extract<import('./phpAstExpressionTypes').PhpAccessMode, { kind: 'nullsafe' }>) => R;
}

export function matchPhpAccessMode<R>(mode: import('./phpAstExpressionTypes').PhpAccessMode, visitor: PhpAccessModeVisitor<R>): R {
    const handlers: Record<string, (node: import('./phpAstExpressionTypes').PhpAccessMode) => R> = {
        direct: node => visitor.direct(node as Extract<import('./phpAstExpressionTypes').PhpAccessMode, { kind: 'direct' }>),
        nullsafe: node => visitor.nullsafe(node as Extract<import('./phpAstExpressionTypes').PhpAccessMode, { kind: 'nullsafe' }>),
    };
    return handlers[mode.kind](mode);
}

export interface PhpMatchArmVisitor<R> {
    readonly conditional: (node: Extract<import('./phpAstExpressionTypes').PhpMatchArm, { kind: 'conditional' }>) => R;
    readonly default: (node: Extract<import('./phpAstExpressionTypes').PhpMatchArm, { kind: 'default' }>) => R;
}

export function matchPhpMatchArm<R>(arm: import('./phpAstExpressionTypes').PhpMatchArm, visitor: PhpMatchArmVisitor<R>): R {
    const handlers: Record<string, (node: import('./phpAstExpressionTypes').PhpMatchArm) => R> = {
        conditional: node => visitor.conditional(node as Extract<import('./phpAstExpressionTypes').PhpMatchArm, { kind: 'conditional' }>),
        default: node => visitor.default(node as Extract<import('./phpAstExpressionTypes').PhpMatchArm, { kind: 'default' }>),
    };
    return handlers[arm.kind](arm);
}

export interface PhpStatementVisitor<R> {
    readonly expression_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'expression_statement' }>) => R;
    readonly return_with_value: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'return_with_value' }>) => R;
    readonly return_void: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'return_void' }>) => R;
    readonly assignment: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'assignment' }>) => R;
    readonly if_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'if_statement' }>) => R;
    readonly foreach_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'foreach_statement' }>) => R;
    readonly while_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'while_statement' }>) => R;
    readonly switch_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'switch_statement' }>) => R;
    readonly for_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'for_statement' }>) => R;
    readonly try_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'try_statement' }>) => R;
    readonly throw_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'throw_statement' }>) => R;
    readonly unset_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'unset_statement' }>) => R;
    readonly include_statement: (node: Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'include_statement' }>) => R;
}

export function matchPhpStatement<R>(statement: import('./phpAstStatementTypes').PhpStatement, visitor: PhpStatementVisitor<R>): R {
    const handlers: Record<string, (node: import('./phpAstStatementTypes').PhpStatement) => R> = {
        expression_statement: node => visitor.expression_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'expression_statement' }>),
        return_with_value: node => visitor.return_with_value(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'return_with_value' }>),
        return_void: node => visitor.return_void(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'return_void' }>),
        assignment: node => visitor.assignment(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'assignment' }>),
        if_statement: node => visitor.if_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'if_statement' }>),
        foreach_statement: node => visitor.foreach_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'foreach_statement' }>),
        while_statement: node => visitor.while_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'while_statement' }>),
        switch_statement: node => visitor.switch_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'switch_statement' }>),
        for_statement: node => visitor.for_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'for_statement' }>),
        try_statement: node => visitor.try_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'try_statement' }>),
        throw_statement: node => visitor.throw_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'throw_statement' }>),
        unset_statement: node => visitor.unset_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'unset_statement' }>),
        include_statement: node => visitor.include_statement(node as Extract<import('./phpAstStatementTypes').PhpStatement, { kind: 'include_statement' }>),
    };
    return handlers[statement.kind](statement);
}
