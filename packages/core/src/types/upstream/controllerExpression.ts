/**
 * Canonical controller-expression ADT.
 *
 * Ownership rule:
 * - this file contains vocabulary only;
 * - no Laravel scanner / PHP lexer imports;
 * - no resolver or correlation logic;
 * - adapters may construct these values from source ASTs.
 *
 * The ADT is upstream so controller/request/route flows consume one semantic
 * vocabulary instead of maintaining scanner-local contracts.
 */
import type { ClassName, FunctionName, MethodName, PropertyName, ResourceName, VariableName } from './names';
import type { BinaryOperator, CastType, Expression, UnaryOperator, UnsupportedExpressionReason } from './expression';
import type { LiteralValue } from './primitiveVocabulary';

export type ControllerAccessMode =
    | { readonly kind: 'direct' }
    | { readonly kind: 'nullsafe' };

export type ControllerClosureCapture =
    | { readonly kind: 'by_value'; readonly variable: VariableName }
    | { readonly kind: 'by_reference'; readonly variable: VariableName };

export type ControllerExpression =
    | { readonly kind: 'literal'; readonly value: LiteralValue }
    | { readonly kind: 'variable'; readonly name: VariableName }
    | { readonly kind: 'class_reference'; readonly className: ClassName }
    | { readonly kind: 'property_access'; readonly target: ControllerPropertyPath; readonly receiver: ControllerExpression; readonly property: PropertyName; readonly access: ControllerAccessMode }
    | { readonly kind: 'method_call'; readonly target: ControllerPropertyPath; readonly receiver: ControllerExpression; readonly method: MethodName; readonly arguments: readonly ControllerArgument[]; readonly access: ControllerAccessMode }
    | { readonly kind: 'static_call'; readonly className: ClassName; readonly method: MethodName; readonly arguments: readonly ControllerArgument[] }
    | { readonly kind: 'construct'; readonly className: ClassName; readonly arguments: readonly ControllerArgument[] }
    | { readonly kind: 'instance_of'; readonly expression: ControllerExpression; readonly className: ClassName }
    | { readonly kind: 'function_call'; readonly functionName: FunctionName; readonly arguments: readonly ControllerArgument[] }
    | { readonly kind: 'array_access'; readonly target: ControllerExpression; readonly index: ControllerExpression }
    | { readonly kind: 'resource_single'; readonly resourceName: ResourceName; readonly argument: ControllerExpression }
    | { readonly kind: 'resource_collection'; readonly resourceName: ResourceName; readonly argument: ControllerExpression }
    | { readonly kind: 'array'; readonly entries: readonly ControllerArrayEntry[] }
    | { readonly kind: 'ternary'; readonly condition: ControllerExpression; readonly trueBranch: ControllerExpression; readonly falseBranch: ControllerExpression }
    | { readonly kind: 'short_ternary'; readonly condition: ControllerExpression; readonly falseBranch: ControllerExpression }
    | { readonly kind: 'null_coalesce'; readonly left: ControllerExpression; readonly right: ControllerExpression }
    | { readonly kind: 'binary'; readonly operator: BinaryOperator; readonly left: ControllerExpression; readonly right: ControllerExpression }
    | { readonly kind: 'unary'; readonly operator: UnaryOperator; readonly operand: ControllerExpression }
    | { readonly kind: 'cast'; readonly castType: CastType; readonly operand: ControllerExpression }
    | { readonly kind: 'match'; readonly subject: ControllerExpression; readonly arms: readonly ControllerMatchArm[] }
    | { readonly kind: 'closure'; readonly parameters: readonly VariableName[]; readonly captures: readonly ControllerClosureCapture[]; readonly body: readonly ControllerStatement[] }
    | { readonly kind: 'arrow_function'; readonly parameters: readonly VariableName[]; readonly body: ControllerExpression }
    | { readonly kind: 'unsupported'; readonly reason: UnsupportedExpressionReason };

export interface ControllerPropertyPath {
    readonly root: VariableName;
    readonly steps: readonly PropertyName[];
}

export type ControllerArgument =
    | { readonly kind: 'positional'; readonly value: ControllerExpression }
    | { readonly kind: 'named'; readonly name: PropertyName; readonly value: ControllerExpression }
    | { readonly kind: 'unpacked'; readonly value: ControllerExpression };

export type ControllerArrayKey =
    | { readonly kind: 'string'; readonly value: import('./valueObjects').StringValue }
    | { readonly kind: 'integer'; readonly value: import('./valueObjects').NumberValue }
    | { readonly kind: 'expression'; readonly value: ControllerExpression };

export type ControllerArrayEntry =
    | { readonly kind: 'keyed'; readonly key: ControllerArrayKey; readonly value: ControllerExpression }
    | { readonly kind: 'positional'; readonly value: ControllerExpression };

export type ControllerMatchArm =
    | { readonly kind: 'conditional'; readonly conditions: readonly ControllerExpression[]; readonly value: ControllerExpression }
    | { readonly kind: 'default'; readonly value: ControllerExpression };

export type ControllerStatement =
    | { readonly kind: 'expression_statement'; readonly expression: ControllerExpression }
    | { readonly kind: 'return_with_value'; readonly expression: ControllerExpression }
    | { readonly kind: 'return_void' };

export type ControllerRuntimeReturn =
    | { readonly kind: 'none' }
    | { readonly kind: 'expressions'; readonly expressions: readonly Expression[] };
