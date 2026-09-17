import { PrimitiveKind, type SemanticType } from "../../compiler/types/SemanticType";
import type { ModelBinding, Nullability } from './modelContracts';
import type { ModelName, PropertyName, ResourceName, ResponseFieldName, ResponseTypeName, MethodName, CastTypeName, SemanticOperator, VariableName } from './semanticValues';
import type { HttpMethod } from "./security";
import type { BoundSemanticNode } from "./boundAst";
import type { ResourceFieldSemantic } from './resourceFieldSemantic';

export interface ResourceFieldDescriptor {
  readonly name: ResponseFieldName;
  readonly propertyName: PropertyName;
  readonly expression: ResourceFieldExpression;
  readonly semantic: ResourceFieldSemantic;
}

/**
 * 
 * ResourceExpressionKind
 *
 * Canonical Domain Vocabulary for Resource Field AST Expressions.
 */
export const ResourceExpressionKind = Object.freeze({
  Primitive: 'primitive',
  Model: 'model',
  Resource: 'resource',
  Object: 'object',
  Array: 'array',
  PropertyAccess: 'property_access',
  NullsafePropertyAccess: 'nullsafe_property_access',
  Variable: 'variable',
  TypeCast: 'type_cast',
  BinaryExpression: 'binary_expression',
  MethodCall: 'method_call',
  NullsafeMethodCall: 'nullsafe_method_call',
  StaticMethodCall: 'static_method_call',
  ArrayAccess: 'array_access',
  FunctionCall: 'function_call',
  Ternary: 'ternary',
  ShortTernary: 'short_ternary',
  NullCoalesce: 'null_coalesce',
  Literal: 'literal',
  Unsupported: 'unsupported'
} as const);

export type ResourceExpressionKind = typeof ResourceExpressionKind[keyof typeof ResourceExpressionKind];

export interface BaseResourceFieldExpression<K extends ResourceExpressionKind = ResourceExpressionKind> {
  readonly kind: K;
}

export type ResourceExpressionCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export interface PrimitiveResourceExpression extends BaseResourceFieldExpression<'primitive'> {
  readonly kind: 'primitive';
  readonly type: PrimitiveKind;
}

export interface ModelResourceExpression extends BaseResourceFieldExpression<'model'> {
  readonly kind: 'model';
  readonly model: ModelName;
  readonly cardinality: ResourceExpressionCardinality;
}

export interface ResourceResourceExpression extends BaseResourceFieldExpression<'resource'> {
  readonly kind: 'resource';
  readonly resource: ResourceName;
  readonly cardinality: ResourceExpressionCardinality;
}

export interface ObjectResourceExpression extends BaseResourceFieldExpression<'object'> {
  readonly kind: 'object';
  readonly fields: readonly ResourceFieldDescriptor[];
}

export interface ArrayResourceExpression extends BaseResourceFieldExpression<'array'> {
  readonly kind: 'array';
  readonly element: ResourceFieldDescriptor;
}

export interface PropertyAccessResourceExpression extends BaseResourceFieldExpression<'property_access'> {
  readonly kind: 'property_access';
  readonly target: ResourceFieldExpression;
  readonly property: PropertyName;
}

export interface NullsafePropertyAccessResourceExpression extends BaseResourceFieldExpression<'nullsafe_property_access'> {
  readonly kind: 'nullsafe_property_access';
  readonly target: ResourceFieldExpression;
  readonly property: PropertyName;
}

export interface VariableResourceExpression extends BaseResourceFieldExpression<'variable'> {
  readonly kind: 'variable';
  readonly name: VariableName;
}

export interface TypeCastResourceExpression extends BaseResourceFieldExpression<'type_cast'> {
  readonly kind: 'type_cast';
  readonly type: CastTypeName;
  readonly expression: ResourceFieldExpression;
}

export interface BinaryResourceExpression extends BaseResourceFieldExpression<'binary_expression'> {
  readonly kind: 'binary_expression';
  readonly operator: SemanticOperator;
  readonly left: ResourceFieldExpression;
  readonly right: ResourceFieldExpression;
}

export interface MethodCallResourceExpression extends BaseResourceFieldExpression<'method_call'> {
  readonly kind: 'method_call';
  readonly target: ResourceFieldExpression;
  readonly method: MethodName;
  readonly arguments: readonly ResourceFieldExpression[];
}

export interface NullsafeMethodCallResourceExpression extends BaseResourceFieldExpression<'nullsafe_method_call'> {
  readonly kind: 'nullsafe_method_call';
  readonly target: ResourceFieldExpression;
  readonly method: MethodName;
  readonly arguments: readonly ResourceFieldExpression[];
}

export interface StaticMethodCallResourceExpression extends BaseResourceFieldExpression<'static_method_call'> {
  readonly kind: 'static_method_call';
  readonly class: ModelName;
  readonly method: MethodName;
  readonly arguments: readonly ResourceFieldExpression[];
}

export interface ArrayAccessResourceExpression extends BaseResourceFieldExpression<'array_access'> {
  readonly kind: 'array_access';
  readonly target: ResourceFieldExpression;
  readonly index: ResourceFieldExpression;
}
export interface FunctionCallResourceExpression extends BaseResourceFieldExpression<'function_call'> {
  readonly kind: 'function_call';
  readonly functionName: import('./semanticValues').PhpFunctionName;
  readonly arguments: readonly ResourceFieldExpression[];
}
export interface TernaryResourceExpression extends BaseResourceFieldExpression<'ternary'> {
  readonly kind: 'ternary';
  readonly condition: ResourceFieldExpression;
  readonly trueBranch: ResourceFieldExpression;
  readonly falseBranch: ResourceFieldExpression;
}
export interface ShortTernaryResourceExpression extends BaseResourceFieldExpression<'short_ternary'> {
  readonly kind: 'short_ternary';
  readonly condition: ResourceFieldExpression;
  readonly falseBranch: ResourceFieldExpression;
}
export interface NullCoalesceResourceExpression extends BaseResourceFieldExpression<'null_coalesce'> {
  readonly kind: 'null_coalesce';
  readonly left: ResourceFieldExpression;
  readonly right: ResourceFieldExpression;
}

export type ResourceLiteralValue =
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'null'; readonly value: null };

export interface LiteralResourceExpression extends BaseResourceFieldExpression<'literal'> {
  readonly kind: 'literal';
  readonly value: ResourceLiteralValue;
}

export type UnsupportedResourceExpressionReason =
  | 'parser_gap'
  | 'unsupported_syntax'
  | 'invalid_boundary_input'
  | 'missing_expression';

export interface UnsupportedResourceExpression extends BaseResourceFieldExpression<'unsupported'> {
  readonly kind: 'unsupported';
  readonly reason: UnsupportedResourceExpressionReason;
}

export type ResourceFieldExpression =
  | PrimitiveResourceExpression
  | ModelResourceExpression
  | ResourceResourceExpression
  | ObjectResourceExpression
  | ArrayResourceExpression
  | PropertyAccessResourceExpression
  | NullsafePropertyAccessResourceExpression
  | VariableResourceExpression
  | TypeCastResourceExpression
  | BinaryResourceExpression
  | MethodCallResourceExpression
  | StaticMethodCallResourceExpression
  | NullsafeMethodCallResourceExpression
  | ArrayAccessResourceExpression
  | FunctionCallResourceExpression
  | TernaryResourceExpression
  | ShortTernaryResourceExpression
  | NullCoalesceResourceExpression
  | LiteralResourceExpression
  | UnsupportedResourceExpression;

export type AnyResourceFieldExpression = ResourceFieldExpression;

export type ResourceExpressionCategory =
  | 'primitive'
  | 'model_ref'
  | 'container'
  | 'traversal'
  | 'computation'
  | 'fallback';

export interface ResourceExpressionSpecification<K extends ResourceExpressionKind = ResourceExpressionKind> {
  readonly kind: K;
  readonly category: ResourceExpressionCategory;
  readonly isTerminal: boolean;
  readonly isResolvableToModel: boolean;
  readonly description: string;
}

export type ResourceExpressionRegistry = {
  readonly [K in ResourceExpressionKind]: ResourceExpressionSpecification<K>;
};

export const RESOURCE_EXPRESSION_REGISTRY: ResourceExpressionRegistry = Object.freeze({
  [ResourceExpressionKind.Primitive]: {
    kind: ResourceExpressionKind.Primitive,
    category: 'primitive',
    isTerminal: true,
    isResolvableToModel: false,
    description: 'Raw primitive PHP or scalar type'
  },
  [ResourceExpressionKind.Model]: {
    kind: ResourceExpressionKind.Model,
    category: 'model_ref',
    isTerminal: false,
    isResolvableToModel: true,
    description: 'Direct Eloquent model reference'
  },
  [ResourceExpressionKind.Resource]: {
    kind: ResourceExpressionKind.Resource,
    category: 'model_ref',
    isTerminal: false,
    isResolvableToModel: true,
    description: 'Nested Laravel JsonResource reference'
  },
  [ResourceExpressionKind.Object]: {
    kind: ResourceExpressionKind.Object,
    category: 'container',
    isTerminal: false,
    isResolvableToModel: false,
    description: 'Nested object fields container'
  },
  [ResourceExpressionKind.Array]: {
    kind: ResourceExpressionKind.Array,
    category: 'container',
    isTerminal: false,
    isResolvableToModel: false,
    description: 'Homogeneous array collection container'
  },
  [ResourceExpressionKind.PropertyAccess]: {
    kind: ResourceExpressionKind.PropertyAccess,
    category: 'traversal',
    isTerminal: false,
    isResolvableToModel: true,
    description: 'Direct model property or relation traversal ($this->user->name)'
  },
  [ResourceExpressionKind.NullsafePropertyAccess]: {
    kind: ResourceExpressionKind.NullsafePropertyAccess,
    category: 'traversal',
    isTerminal: false,
    isResolvableToModel: true,
    description: 'Nullsafe property traversal ($this->user?->name)'
  },
  [ResourceExpressionKind.Variable]: {
    kind: ResourceExpressionKind.Variable,
    category: 'traversal',
    isTerminal: true,
    isResolvableToModel: false,
    description: 'Local variable evaluation'
  },
  [ResourceExpressionKind.TypeCast]: {
    kind: ResourceExpressionKind.TypeCast,
    category: 'computation',
    isTerminal: false,
    isResolvableToModel: false,
    description: 'Explicit type cast expression ((int) $this->total)'
  },
  [ResourceExpressionKind.BinaryExpression]: {
    kind: ResourceExpressionKind.BinaryExpression,
    category: 'computation',
    isTerminal: false,
    isResolvableToModel: false,
    description: 'Binary operator expression ($a . $b, $x + $y)'
  },
  [ResourceExpressionKind.MethodCall]: {
    kind: ResourceExpressionKind.MethodCall,
    category: 'computation',
    isTerminal: false,
    isResolvableToModel: false,
    description: 'Method invocation on target'
  },
  [ResourceExpressionKind.StaticMethodCall]: {
    kind: ResourceExpressionKind.StaticMethodCall,
    category: 'computation',
    isTerminal: false,
    isResolvableToModel: false,
    description: 'Static helper or class invocation'
  },
  [ResourceExpressionKind.NullsafeMethodCall]: { kind: ResourceExpressionKind.NullsafeMethodCall, category: 'computation', isTerminal: false, isResolvableToModel: false, description: 'Nullsafe method invocation' },
  [ResourceExpressionKind.ArrayAccess]: { kind: ResourceExpressionKind.ArrayAccess, category: 'traversal', isTerminal: false, isResolvableToModel: false, description: 'Array offset access' },
  [ResourceExpressionKind.FunctionCall]: { kind: ResourceExpressionKind.FunctionCall, category: 'computation', isTerminal: false, isResolvableToModel: false, description: 'PHP function invocation' },
  [ResourceExpressionKind.Ternary]: { kind: ResourceExpressionKind.Ternary, category: 'computation', isTerminal: false, isResolvableToModel: false, description: 'Conditional expression' },
  [ResourceExpressionKind.ShortTernary]: { kind: ResourceExpressionKind.ShortTernary, category: 'computation', isTerminal: false, isResolvableToModel: false, description: 'Short conditional expression' },
  [ResourceExpressionKind.NullCoalesce]: { kind: ResourceExpressionKind.NullCoalesce, category: 'computation', isTerminal: false, isResolvableToModel: false, description: 'Null coalescing expression' },
  [ResourceExpressionKind.Literal]: {
    kind: ResourceExpressionKind.Literal,
    category: 'primitive',
    isTerminal: true,
    isResolvableToModel: false,
    description: 'Constant literal value (string, number, boolean, null)'
  },
  [ResourceExpressionKind.Unsupported]: {
    kind: ResourceExpressionKind.Unsupported,
    category: 'fallback',
    isTerminal: true,
    isResolvableToModel: false,
    description: 'Unresolved or dynamic expression fallback'
  }
});

export type ResourceFieldExpressionVisitor<R> = {
  readonly primitive: (expr: PrimitiveResourceExpression) => R;
  readonly model: (expr: ModelResourceExpression) => R;
  readonly resource: (expr: ResourceResourceExpression) => R;
  readonly object: (expr: ObjectResourceExpression) => R;
  readonly array: (expr: ArrayResourceExpression) => R;
  readonly property_access: (expr: PropertyAccessResourceExpression) => R;
  readonly nullsafe_property_access: (expr: NullsafePropertyAccessResourceExpression) => R;
  readonly variable: (expr: VariableResourceExpression) => R;
  readonly type_cast: (expr: TypeCastResourceExpression) => R;
  readonly binary_expression: (expr: BinaryResourceExpression) => R;
  readonly method_call: (expr: MethodCallResourceExpression) => R;
  readonly nullsafe_method_call: (expr: NullsafeMethodCallResourceExpression) => R;
  readonly static_method_call: (expr: StaticMethodCallResourceExpression) => R;
  readonly array_access: (expr: ArrayAccessResourceExpression) => R;
  readonly function_call: (expr: FunctionCallResourceExpression) => R;
  readonly ternary: (expr: TernaryResourceExpression) => R;
  readonly short_ternary: (expr: ShortTernaryResourceExpression) => R;
  readonly null_coalesce: (expr: NullCoalesceResourceExpression) => R;
  readonly literal: (expr: LiteralResourceExpression) => R;
  readonly unsupported: (expr: UnsupportedResourceExpression) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ResourceFieldExpression dengan exhaustive type safety
 */
export function matchResourceFieldExpression<R>(
  expression: ResourceFieldExpression,
  visitor: ResourceFieldExpressionVisitor<R>
): R {
  switch (expression.kind) {
    case 'primitive': return visitor.primitive(expression);
    case 'model': return visitor.model(expression);
    case 'resource': return visitor.resource(expression);
    case 'object': return visitor.object(expression);
    case 'array': return visitor.array(expression);
    case 'property_access': return visitor.property_access(expression);
    case 'nullsafe_property_access': return visitor.nullsafe_property_access(expression);
    case 'variable': return visitor.variable(expression);
    case 'type_cast': return visitor.type_cast(expression);
    case 'binary_expression': return visitor.binary_expression(expression);
    case 'method_call': return visitor.method_call(expression);
    case 'nullsafe_method_call': return visitor.nullsafe_method_call(expression);
    case 'static_method_call': return visitor.static_method_call(expression);
    case 'array_access': return visitor.array_access(expression);
    case 'function_call': return visitor.function_call(expression);
    case 'ternary': return visitor.ternary(expression);
    case 'short_ternary': return visitor.short_ternary(expression);
    case 'null_coalesce': return visitor.null_coalesce(expression);
    case 'literal': return visitor.literal(expression);
    case 'unsupported': return visitor.unsupported(expression);
  }
}

export const matchResourceExpression = matchResourceFieldExpression;

/**
 * ResourceFieldExpressionFactory
 *
 * Canonical Factory for Structured ResourceFieldExpression AST Nodes.
 */
export class ResourceFieldExpressionFactory {
  public static primitive(type: PrimitiveKind): PrimitiveResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Primitive, type });
  }
  public static model(model: ModelName, cardinality: ResourceExpressionCardinality = { kind: 'single' }): ModelResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Model, model, cardinality });
  }
  public static resource(resource: ResourceName, cardinality: ResourceExpressionCardinality = { kind: 'single' }): ResourceResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Resource, resource, cardinality });
  }
  public static object(fields: readonly ResourceFieldDescriptor[]): ObjectResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Object, fields: Object.freeze([...fields]) });
  }
  public static array(element: ResourceFieldDescriptor): ArrayResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Array, element });
  }
  public static propertyAccess(target: ResourceFieldExpression, property: PropertyName): PropertyAccessResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.PropertyAccess, target, property });
  }
  public static nullsafePropertyAccess(target: ResourceFieldExpression, property: PropertyName): NullsafePropertyAccessResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.NullsafePropertyAccess, target, property });
  }
  public static variable(name: VariableName): VariableResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Variable, name });
  }
  public static typeCast(type: CastTypeName, expression: ResourceFieldExpression): TypeCastResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.TypeCast, type, expression });
  }
  public static binary(operator: SemanticOperator, left: ResourceFieldExpression, right: ResourceFieldExpression): BinaryResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.BinaryExpression, operator, left, right });
  }
  public static methodCall(target: ResourceFieldExpression, method: MethodName, arguments_: readonly ResourceFieldExpression[] = []): MethodCallResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.MethodCall, target, method, arguments: Object.freeze([...arguments_]) });
  }
  public static nullsafeMethodCall(target: ResourceFieldExpression, method: MethodName, arguments_: readonly ResourceFieldExpression[] = []): NullsafeMethodCallResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.NullsafeMethodCall, target, method, arguments: Object.freeze([...arguments_]) });
  }
  public static staticMethodCall(className: ModelName, method: MethodName, arguments_: readonly ResourceFieldExpression[] = []): StaticMethodCallResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.StaticMethodCall, class: className, method, arguments: Object.freeze([...arguments_]) });
  }
  public static arrayAccess(target: ResourceFieldExpression, index: ResourceFieldExpression): ArrayAccessResourceExpression { return Object.freeze({ kind: ResourceExpressionKind.ArrayAccess, target, index }); }
  public static functionCall(functionName: import('./semanticValues').PhpFunctionName, arguments_: readonly ResourceFieldExpression[]): FunctionCallResourceExpression { return Object.freeze({ kind: ResourceExpressionKind.FunctionCall, functionName, arguments: Object.freeze([...arguments_]) }); }
  public static ternary(condition: ResourceFieldExpression, trueBranch: ResourceFieldExpression, falseBranch: ResourceFieldExpression): TernaryResourceExpression { return Object.freeze({ kind: ResourceExpressionKind.Ternary, condition, trueBranch, falseBranch }); }
  public static shortTernary(condition: ResourceFieldExpression, falseBranch: ResourceFieldExpression): ShortTernaryResourceExpression { return Object.freeze({ kind: ResourceExpressionKind.ShortTernary, condition, falseBranch }); }
  public static nullCoalesce(left: ResourceFieldExpression, right: ResourceFieldExpression): NullCoalesceResourceExpression { return Object.freeze({ kind: ResourceExpressionKind.NullCoalesce, left, right }); }
  public static literal(value: ResourceLiteralValue): LiteralResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Literal, value });
  }
  public static unsupported(reason: UnsupportedResourceExpressionReason): UnsupportedResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Unsupported, reason });
  }
}

/**
 * First-Class Variable Assignment Node (Ordered & Self-Contained).
 */
export interface ResourceAssignment {
  readonly name: PropertyName;
  readonly expression: ResourceFieldExpression;
  readonly nullability: Nullability;
}

export interface ParsedResource {
  readonly name: ResourceName;
  readonly baseName: ResourceName;
  readonly typeName: ResponseTypeName;
  readonly sanitizedName: PropertyName;
  readonly modelBinding: ModelBinding;
  readonly actions: readonly ActionDefinition[];
  readonly endpoints: readonly string[];
  /**
   * Guaranteed Ordered Resource Fields (0 Record, 0 Object.entries).
   */
  readonly fields: readonly ResourceFieldDescriptor[];
  /**
   * Local variable assignments tracked during semantic analysis (Ordered Array).
   */
  readonly assignments: readonly ResourceAssignment[];
  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly isSynthetic: boolean;
}

export interface ActionDefinition {
  readonly name: string;
  readonly method: HttpMethod;
  readonly hasBody: boolean;
  readonly hasResponse: boolean;
  readonly routes: readonly string[];
}


/**
 * Backward compatibility type aliases for legacy adapters.
 */
export type ResourceFieldKind = ResourceFieldDescriptor;
