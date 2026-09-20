/**
 * Canonical controller expression vocabulary.
 * This belongs to the domain boundary so route contracts never depend on scanner internals.
 */

export type ControllerAccessMode =
    | { readonly kind: 'direct' }
    | { readonly kind: 'nullsafe' };

export type ControllerClosureCapture =
    | { readonly kind: 'by_value'; readonly variable: string }
    | { readonly kind: 'by_reference'; readonly variable: string };

export type ControllerExpression =
    | { readonly kind: 'literal'; readonly literalType: 'string' | 'number' | 'boolean' | 'null'; readonly value: string | number | boolean | null }
    | { readonly kind: 'variable'; readonly name: string }
    | { readonly kind: 'class_reference'; readonly className: string }
    | { readonly kind: 'property_access'; readonly target: ControllerPropertyPath; readonly receiver: ControllerExpression; readonly property: string; readonly access: ControllerAccessMode }
    | { readonly kind: 'method_call'; readonly target: ControllerPropertyPath; readonly receiver: ControllerExpression; readonly method: string; readonly arguments: readonly ControllerArgument[]; readonly access: ControllerAccessMode }
    | { readonly kind: 'static_call'; readonly className: string; readonly method: string; readonly arguments: readonly ControllerArgument[] }
    | { readonly kind: 'construct'; readonly className: string; readonly arguments: readonly ControllerArgument[] }
    | { readonly kind: 'instance_of'; readonly expression: ControllerExpression; readonly className: string }
    | { readonly kind: 'function_call'; readonly functionName: string; readonly arguments: readonly ControllerArgument[] }
    | { readonly kind: 'array_access'; readonly target: ControllerExpression; readonly index: ControllerExpression }
    | { readonly kind: 'resource_single'; readonly resourceName: string; readonly argument: ControllerExpression }
    | { readonly kind: 'resource_collection'; readonly resourceName: string; readonly argument: ControllerExpression }
    | { readonly kind: 'array'; readonly entries: readonly ControllerArrayEntry[] }
    | { readonly kind: 'ternary'; readonly condition: ControllerExpression; readonly trueBranch: ControllerExpression; readonly falseBranch: ControllerExpression }
    | { readonly kind: 'short_ternary'; readonly condition: ControllerExpression; readonly falseBranch: ControllerExpression }
    | { readonly kind: 'null_coalesce'; readonly left: ControllerExpression; readonly right: ControllerExpression }
    | { readonly kind: 'binary'; readonly operator: { readonly kind: string }; readonly left: ControllerExpression; readonly right: ControllerExpression }
    | { readonly kind: 'unary'; readonly operator: { readonly kind: string }; readonly operand: ControllerExpression }
    | { readonly kind: 'cast'; readonly castType: { readonly kind: string }; readonly operand: ControllerExpression }
    | { readonly kind: 'match'; readonly subject: ControllerExpression; readonly arms: readonly ControllerMatchArm[] }
    | { readonly kind: 'closure'; readonly parameters: readonly string[]; readonly captures: readonly ControllerClosureCapture[]; readonly body: readonly ControllerStatement[] }
    | { readonly kind: 'arrow_function'; readonly parameters: readonly string[]; readonly body: ControllerExpression }
    | { readonly kind: 'unsupported'; readonly reason: string };

export interface ControllerPropertyPath {
    readonly root: string;
    readonly steps: readonly string[];
}

export type ControllerArgument =
    | { readonly kind: 'positional'; readonly value: ControllerExpression }
    | { readonly kind: 'named'; readonly name: string; readonly value: ControllerExpression }
    | { readonly kind: 'unpacked'; readonly value: ControllerExpression };

export type ControllerArrayKey =
    | { readonly kind: 'string'; readonly value: string }
    | { readonly kind: 'integer'; readonly value: number }
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
    | { readonly kind: 'expressions'; readonly expressions: readonly ControllerExpression[] };
