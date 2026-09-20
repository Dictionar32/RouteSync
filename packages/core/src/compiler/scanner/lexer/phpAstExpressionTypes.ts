import type { AstIdentifier, TokenDescriptor } from './phpAstCoreTypes';
import type { PhpBlock } from './phpAstStatementTypes';

export type PhpLiteralValue =
    | { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string }
    | { readonly kind: 'literal'; readonly literalType: 'number'; readonly value: number }
    | { readonly kind: 'literal'; readonly literalType: 'boolean'; readonly value: boolean }
    | { readonly kind: 'literal'; readonly literalType: 'null'; readonly value: null };
export type PhpPropertyPath =
    | { readonly kind: 'single'; readonly root: AstIdentifier; readonly steps: readonly []; }
    | { readonly kind: 'chain'; readonly root: AstIdentifier; readonly steps: readonly AstIdentifier[] };
export type PhpArgument =
    | { readonly kind: 'positional'; readonly value: PhpAstValue }
    | { readonly kind: 'named'; readonly name: AstIdentifier; readonly value: PhpAstValue }
    | { readonly kind: 'unpacked'; readonly value: PhpAstValue };
export interface PhpParameter { readonly variable: AstIdentifier; }
export type PhpClosureCapture =
    | { readonly kind: 'by_value'; readonly variable: AstIdentifier }
    | { readonly kind: 'by_reference'; readonly variable: AstIdentifier };
export type PhpArrayKey =
    | { readonly kind: 'string'; readonly value: string }
    | { readonly kind: 'integer'; readonly value: number }
    | { readonly kind: 'expression'; readonly value: PhpAstValue };
export type PhpArrayEntry =
    | { readonly kind: 'keyed'; readonly key: PhpArrayKey; readonly value: PhpAstValue }
    | { readonly kind: 'positional'; readonly value: PhpAstValue };
export type PhpBinaryOperator =
    | { readonly kind: 'identical' } | { readonly kind: 'not_identical' } | { readonly kind: 'equal' }
    | { readonly kind: 'not_equal' } | { readonly kind: 'greater_than' } | { readonly kind: 'less_than' }
    | { readonly kind: 'greater_or_equal' } | { readonly kind: 'less_or_equal' } | { readonly kind: 'addition' }
    | { readonly kind: 'subtraction' } | { readonly kind: 'multiplication' } | { readonly kind: 'division' }
    | { readonly kind: 'modulo' } | { readonly kind: 'logical_and' } | { readonly kind: 'logical_or' } | { readonly kind: 'concat' };
export type PhpUnaryOperator = { readonly kind: 'not' } | { readonly kind: 'negative' } | { readonly kind: 'positive' } | { readonly kind: 'bitwise_not' };
export type PhpCastType = { readonly kind: 'int' } | { readonly kind: 'float' } | { readonly kind: 'string' } | { readonly kind: 'bool' } | { readonly kind: 'array' } | { readonly kind: 'object' };
export type PhpAccessMode = { readonly kind: 'direct' } | { readonly kind: 'nullsafe' };
export type PhpAstValue =
    | PhpLiteralValue | { readonly kind: 'resource_single'; readonly resourceName: AstIdentifier; readonly argument: PhpAstValue }
    | { readonly kind: 'resource_collection'; readonly resourceName: AstIdentifier; readonly argument: PhpAstValue }
    | { readonly kind: 'method_chain'; readonly target: PhpPropertyPath; readonly receiver: PhpAstValue; readonly property: AstIdentifier; readonly arguments: readonly PhpArgument[]; readonly access: PhpAccessMode }
    | { readonly kind: 'property_access'; readonly target: PhpPropertyPath; readonly receiver: PhpAstValue; readonly property: AstIdentifier; readonly access: PhpAccessMode }
    | { readonly kind: 'array_access'; readonly target: PhpAstValue; readonly index: PhpAstValue }
    | { readonly kind: 'function_call'; readonly functionName: AstIdentifier; readonly arguments: readonly PhpArgument[] }
    | { readonly kind: 'variable_reference'; readonly name: AstIdentifier }
    | { readonly kind: 'ternary_expression'; readonly condition: PhpAstValue; readonly trueBranch: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'short_ternary'; readonly condition: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'null_coalesce'; readonly left: PhpAstValue; readonly right: PhpAstValue }
    | { readonly kind: 'binary_expression'; readonly operator: PhpBinaryOperator; readonly left: PhpAstValue; readonly right: PhpAstValue }
    | { readonly kind: 'unary_expression'; readonly operator: PhpUnaryOperator; readonly operand: PhpAstValue }
    | { readonly kind: 'cast_expression'; readonly castType: PhpCastType; readonly operand: PhpAstValue }
    | { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] }
    | { readonly kind: 'static_call'; readonly className: AstIdentifier; readonly method: AstIdentifier; readonly arguments: readonly PhpArgument[] }
    | { readonly kind: 'class_reference'; readonly className: AstIdentifier } | { readonly kind: 'construct'; readonly className: AstIdentifier; readonly arguments: readonly PhpArgument[] }
    | { readonly kind: 'instance_of'; readonly expression: PhpAstValue; readonly className: AstIdentifier }
    | { readonly kind: 'closure'; readonly parameters: readonly PhpParameter[]; readonly captures: readonly PhpClosureCapture[]; readonly body: PhpBlock }
    | { readonly kind: 'arrow_function'; readonly parameters: readonly PhpParameter[]; readonly body: PhpAstValue }
    | { readonly kind: 'match_expression'; readonly subject: PhpAstValue; readonly arms: readonly PhpMatchArm[] }
    | { readonly kind: 'unsupported'; readonly reason: PhpUnsupportedExpressionReason; readonly tokens: readonly TokenDescriptor[] };
export type PhpMatchArm = { readonly kind: 'conditional'; readonly conditions: readonly PhpAstValue[]; readonly value: PhpAstValue } | { readonly kind: 'default'; readonly value: PhpAstValue };
export type PhpUnsupportedExpressionReason = 'unclassified_expression' | 'dynamic_construct' | 'unsupported_statement';
