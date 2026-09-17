/**
 * Closed syntactic values owned by the PHP AST boundary.
 */

export interface PhpPropertyName { readonly kind: 'property_name'; readonly value: string; }
export interface PhpClassName { readonly kind: 'class_name'; readonly value: string; }
export interface PhpMethodName { readonly kind: 'method_name'; readonly value: string; }
export interface PhpFunctionName { readonly kind: 'function_name'; readonly value: string; }
export interface PhpVariableName { readonly kind: 'variable_name'; readonly value: string; }
export interface PhpConstantName { readonly kind: 'constant_name'; readonly value: string; }

export type PhpBinaryOperator =
    | { readonly kind: 'addition' }
    | { readonly kind: 'subtraction' }
    | { readonly kind: 'multiplication' }
    | { readonly kind: 'division' }
    | { readonly kind: 'modulo' }
    | { readonly kind: 'exponentiation' }
    | { readonly kind: 'equal' }
    | { readonly kind: 'not_equal' }
    | { readonly kind: 'identical' }
    | { readonly kind: 'not_identical' }
    | { readonly kind: 'less_than' }
    | { readonly kind: 'less_than_or_equal' }
    | { readonly kind: 'greater_than' }
    | { readonly kind: 'greater_than_or_equal' }
    | { readonly kind: 'logical_and' }
    | { readonly kind: 'logical_or' }
    | { readonly kind: 'logical_xor' }
    | { readonly kind: 'bitwise_and' }
    | { readonly kind: 'bitwise_or' }
    | { readonly kind: 'bitwise_xor' }
    | { readonly kind: 'left_shift' }
    | { readonly kind: 'right_shift' }
    | { readonly kind: 'concat' }
    | { readonly kind: 'null_coalesce' };

export type PhpUnaryOperator =
    | { readonly kind: 'not' }
    | { readonly kind: 'positive' }
    | { readonly kind: 'negative' }
    | { readonly kind: 'bitwise_not' }
    | { readonly kind: 'error_control' }
    | { readonly kind: 'pre_increment' }
    | { readonly kind: 'pre_decrement' }
    | { readonly kind: 'post_increment' }
    | { readonly kind: 'post_decrement' };

export type PhpCastType =
    | { readonly kind: 'int' }
    | { readonly kind: 'float' }
    | { readonly kind: 'string' }
    | { readonly kind: 'bool' };

export type ArrayKey =
    | { readonly kind: 'implicit' }
    | { readonly kind: 'explicit'; readonly expression: import('./nodes').PhpAstNode };

export type PhpAstSource =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly source: import('../../../types/semantic').SourceRef };


export type PhpArgument =
    | { readonly kind: 'positional'; readonly value: import('./nodes').PhpAstNode }
    | { readonly kind: 'named'; readonly name: PhpPropertyName; readonly value: import('./nodes').PhpAstNode }
    | { readonly kind: 'unpacked'; readonly value: import('./nodes').PhpAstNode };

export interface PhpParameter {
    readonly variable: PhpVariableName;
}

export interface PhpBlock {
    readonly kind: 'block';
    readonly statements: readonly PhpStatement[];
}

export type PhpReturnExpression =
    | { readonly kind: 'value'; readonly value: import('./nodes').PhpAstNode }
    | { readonly kind: 'void' };

export type PhpStatement =
    | { readonly kind: 'expression_statement'; readonly expression: import('./nodes').PhpAstNode }
    | { readonly kind: 'return_statement'; readonly expression: PhpReturnExpression };

export type PhpClosureCapture =
    | { readonly kind: 'by_value'; readonly variable: PhpVariableName }
    | { readonly kind: 'by_reference'; readonly variable: PhpVariableName };
