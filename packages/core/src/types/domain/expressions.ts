import { PrimitiveKind } from "../../compiler/types/SemanticType";
import type { HttpMethod } from "./security";
import type { BoundSemanticNode } from "./boundAst";

export interface ResourceFieldDescriptor {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('productId')
  readonly expression: ResourceFieldExpression;
  readonly semanticType: PrimitiveKind; // ✅ Guaranteed Domain Primitive
  readonly nullable: boolean; // ✅ 100% Guaranteed boolean (true | false, 0 undefined)
  readonly boundAst?: BoundSemanticNode;
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
  StaticMethodCall: 'static_method_call',
  Literal: 'literal',
  Unknown: 'unknown'
} as const);

export type ResourceExpressionKind = typeof ResourceExpressionKind[keyof typeof ResourceExpressionKind];

export interface BaseResourceFieldExpression<K extends ResourceExpressionKind = ResourceExpressionKind> {
  readonly kind: K;
}

export interface PrimitiveResourceExpression extends BaseResourceFieldExpression<'primitive'> {
  readonly kind: 'primitive';
  readonly type: string;
}

export interface ModelResourceExpression extends BaseResourceFieldExpression<'model'> {
  readonly kind: 'model';
  readonly model: string;
  readonly collection: boolean;
}

export interface ResourceResourceExpression extends BaseResourceFieldExpression<'resource'> {
  readonly kind: 'resource';
  readonly resource: string;
  readonly model: string | null;
  readonly collection: boolean;
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
  readonly target: string;
  readonly property: string;
}

export interface NullsafePropertyAccessResourceExpression extends BaseResourceFieldExpression<'nullsafe_property_access'> {
  readonly kind: 'nullsafe_property_access';
  readonly target: string;
  readonly property: string;
}

export interface VariableResourceExpression extends BaseResourceFieldExpression<'variable'> {
  readonly kind: 'variable';
  readonly name: string;
}

export interface TypeCastResourceExpression extends BaseResourceFieldExpression<'type_cast'> {
  readonly kind: 'type_cast';
  readonly type: string;
  readonly expression: ResourceFieldDescriptor;
}

export interface BinaryResourceExpression extends BaseResourceFieldExpression<'binary_expression'> {
  readonly kind: 'binary_expression';
  readonly operator: string;
  readonly left: ResourceFieldDescriptor;
  readonly right: ResourceFieldDescriptor;
}

export interface MethodCallResourceExpression extends BaseResourceFieldExpression<'method_call'> {
  readonly kind: 'method_call';
  readonly method: string;
}

export interface StaticMethodCallResourceExpression extends BaseResourceFieldExpression<'static_method_call'> {
  readonly kind: 'static_method_call';
  readonly class: string;
  readonly method: string;
}

export interface LiteralResourceExpression extends BaseResourceFieldExpression<'literal'> {
  readonly kind: 'literal';
  readonly value: unknown;
}

export interface UnknownResourceExpression extends BaseResourceFieldExpression<'unknown'> {
  readonly kind: 'unknown';
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
  | LiteralResourceExpression
  | UnknownResourceExpression;

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
  [ResourceExpressionKind.Literal]: {
    kind: ResourceExpressionKind.Literal,
    category: 'primitive',
    isTerminal: true,
    isResolvableToModel: false,
    description: 'Constant literal value (string, number, boolean, null)'
  },
  [ResourceExpressionKind.Unknown]: {
    kind: ResourceExpressionKind.Unknown,
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
  readonly static_method_call: (expr: StaticMethodCallResourceExpression) => R;
  readonly literal: (expr: LiteralResourceExpression) => R;
  readonly unknown: (expr: UnknownResourceExpression) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ResourceFieldExpression dengan exhaustive type safety
 */
export function matchResourceFieldExpression<R>(
  expression: ResourceFieldExpression,
  visitor: ResourceFieldExpressionVisitor<R>
): R {
  return visitor[expression.kind](expression as any);
}

export const matchResourceExpression = matchResourceFieldExpression;

/**
 * ResourceFieldExpressionFactory
 *
 * Canonical Factory for Structured ResourceFieldExpression AST Nodes.
 */
export class ResourceFieldExpressionFactory {
  public static primitive(type: string = 'string'): PrimitiveResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Primitive, type });
  }
  public static model(model: string, collection: boolean = false): ModelResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Model, model, collection });
  }
  public static resource(resource: string, collection: boolean = false, model: string | null = null): ResourceResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Resource, resource, model, collection });
  }
  public static object(fields: readonly ResourceFieldDescriptor[]): ObjectResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Object, fields: Object.freeze([...fields]) });
  }
  public static array(element: ResourceFieldDescriptor): ArrayResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Array, element });
  }
  public static propertyAccess(target: string, property: string): PropertyAccessResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.PropertyAccess, target, property });
  }
  public static nullsafePropertyAccess(target: string, property: string): NullsafePropertyAccessResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.NullsafePropertyAccess, target, property });
  }
  public static variable(name: string): VariableResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Variable, name });
  }
  public static typeCast(type: string, expression: ResourceFieldDescriptor): TypeCastResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.TypeCast, type, expression });
  }
  public static binary(operator: string, left: ResourceFieldDescriptor, right: ResourceFieldDescriptor): BinaryResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.BinaryExpression, operator, left, right });
  }
  public static methodCall(method: string): MethodCallResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.MethodCall, method });
  }
  public static staticMethodCall(className: string, method: string): StaticMethodCallResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.StaticMethodCall, class: className, method });
  }
  public static literal(value: unknown): LiteralResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Literal, value });
  }
  public static unknown(): UnknownResourceExpression {
    return Object.freeze({ kind: ResourceExpressionKind.Unknown });
  }
}

/**
 * First-Class Variable Assignment Node (Ordered & Self-Contained).
 */
export interface ResourceAssignment {
  readonly name: string;
  readonly expression: ResourceFieldExpression;
  readonly nullable: boolean;
}

export interface ParsedResource {
  readonly name: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly sanitizedName: string;
  readonly baseModel: string | null;
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
