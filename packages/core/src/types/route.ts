import { SemanticResolution } from './contract';
import { ManifestMetadata } from './ir';
import { SemanticType } from './semantic';
import type { ResponseBody } from '../compiler/ir/ResponseArtifact';
import type { FormAction, RequestType } from '../compiler/artifacts/RequestTypesArtifact';
import type { ObjectType } from '../compiler/types/SemanticType';
import { PrimitiveKind } from '../compiler/types/SemanticType';
import { toPascalCase } from '../utils/resource-naming';

/**
 * First-Class Domain Operation Entry (Ordered).
 */
export interface DomainOperationEntry {
  readonly name: string;
  readonly operation: string;
}

/**
 * First-Class Domain Config Key-Value Entry (Ordered).
 */
export interface DomainConfigEntry {
  readonly key: string;
  readonly value: string;
}

/**
 * Resolved domain intent config (Ordered).
 */
export interface DomainIntentConfig {
  readonly type: string;
  readonly operations: readonly DomainOperationEntry[];
  readonly config: readonly DomainConfigEntry[];
}

/**
 * First-Class Route Group Alias Entry (Ordered).
 */
export interface GroupAliasEntry {
  readonly alias: string;
  readonly targetGroup: string;
}

/**
 * First-Class Domain Definition Entry (Ordered).
 */
export interface DomainDefinitionEntry {
  readonly name: string;
  readonly intent: string | DomainIntentConfig;
}

/**
 * First-Class Frontend Configuration (0 Record).
 */
export interface FrontendConfig {
  readonly router: string;
  readonly groupAliases: readonly GroupAliasEntry[];
  readonly domains: readonly DomainDefinitionEntry[];
}

/**
 * First-Class Page Property Definition (Ordered).
 */
export interface PagePropEntry {
  readonly key: string;
  readonly value: unknown;
}

/**
 * First-Class Page Metadata Entry (Ordered).
 */
export interface PageMetaEntry {
  readonly key: string;
  readonly value: unknown;
}

/**
 * Pure Ordered Page Configuration (0 Record, 0 Object.entries).
 */
export interface PageConfig {
  readonly pageName: string;
  readonly component: string;
  readonly layout: string;
  readonly props: readonly PagePropEntry[];
  readonly meta: readonly PageMetaEntry[];
}

/**
 * ResourceRouteGroup: Kelompok rute yang terikat pada satu nama resource kanonikal.
 */
export interface ResourceRouteGroup {
  readonly resourceName: string;
  readonly formTypeName: string;
  readonly routes: readonly ParsedRoute[];
  readonly formActions: readonly FormAction[]; // ✅ Guaranteed directly from Upstream PHP Scanner
}

export interface RouteManifest {
  readonly version: string;
  readonly baseURL: string;
  readonly routes: readonly ParsedRoute[];
  readonly contracts: readonly EndpointContract[];           // ✅ Pure CDA Top-Level Manifest Contracts SSOT
  readonly resources: readonly ParsedResource[];
  readonly models: readonly ParsedModel[];
  readonly routeGroups: readonly ResourceRouteGroup[];       // ✅ Murni native readonly array (0 wrapper class)
  readonly requestTypes: readonly RequestType[];              // ✅ 100% Guaranteed directly from Upstream Scanner!
  readonly semanticTypes: readonly ObjectType[];              // ✅ SATU ALIRAN UTUH (0 Fragmentasi, 0 Penyambungan Manual)!
  readonly generatedAt: string;
  readonly channels: readonly BroadcastChannelDescriptor[];
  readonly frontend: FrontendConfig | null;
  readonly pages: readonly PageConfig[];
}

/**
 * ParsedChannel
 *
 * Canonical Alias to BroadcastChannelDescriptor SSOT.
 */
export type ParsedChannel = BroadcastChannelDescriptor;

export interface ResourceFieldDescriptor {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('productId')
  readonly expression: ResourceFieldExpression;
  readonly semanticType: PrimitiveKind; // ✅ Guaranteed Domain Primitive
  readonly nullable: boolean; // ✅ 100% Guaranteed boolean (true | false, 0 undefined)
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
 * DatabaseColumnKind
 *
 * Canonical Domain Vocabulary for Database Column Engine Types.
 */
export const DatabaseColumnKind = Object.freeze({
  BigInt: 'bigint',
  Integer: 'integer',
  SmallInt: 'smallint',
  TinyInt: 'tinyint',
  Float: 'float',
  Double: 'double',
  Decimal: 'decimal',
  Boolean: 'boolean',
  String: 'string',
  Text: 'text',
  MediumText: 'mediumtext',
  LongText: 'longtext',
  Date: 'date',
  DateTime: 'datetime',
  Timestamp: 'timestamp',
  Time: 'time',
  Json: 'json',
  Enum: 'enum',
  Binary: 'binary',
  Uuid: 'uuid',
  Ulid: 'ulid',
  Unknown: 'unknown'
} as const);

export type DatabaseColumnKind = typeof DatabaseColumnKind[keyof typeof DatabaseColumnKind];

export type SqlTypeFamily =
  | 'numeric'
  | 'text'
  | 'datetime'
  | 'boolean'
  | 'json'
  | 'enum'
  | 'binary'
  | 'identifier'
  | 'unknown';

export interface DatabaseColumnKindSpecification<K extends DatabaseColumnKind = DatabaseColumnKind> {
  readonly kind: K;
  readonly tsType: string;
  readonly semanticType: PrimitiveKind;
  readonly sqlFamily: SqlTypeFamily;
  readonly isNumeric: boolean;
  readonly isDateTime: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key DatabaseColumnKind.
 */
export type DatabaseColumnKindRegistry = {
  readonly [K in DatabaseColumnKind]: DatabaseColumnKindSpecification<K>;
};

export const DATABASE_COLUMN_KIND_REGISTRY: DatabaseColumnKindRegistry = Object.freeze({
  [DatabaseColumnKind.BigInt]: {
    kind: DatabaseColumnKind.BigInt,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Integer]: {
    kind: DatabaseColumnKind.Integer,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.SmallInt]: {
    kind: DatabaseColumnKind.SmallInt,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.TinyInt]: {
    kind: DatabaseColumnKind.TinyInt,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Float]: {
    kind: DatabaseColumnKind.Float,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Double]: {
    kind: DatabaseColumnKind.Double,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Decimal]: {
    kind: DatabaseColumnKind.Decimal,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Boolean]: {
    kind: DatabaseColumnKind.Boolean,
    tsType: 'boolean',
    semanticType: PrimitiveKind.BOOLEAN,
    sqlFamily: 'boolean',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.String]: {
    kind: DatabaseColumnKind.String,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Text]: {
    kind: DatabaseColumnKind.Text,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.MediumText]: {
    kind: DatabaseColumnKind.MediumText,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.LongText]: {
    kind: DatabaseColumnKind.LongText,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Date]: {
    kind: DatabaseColumnKind.Date,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: true
  },
  [DatabaseColumnKind.DateTime]: {
    kind: DatabaseColumnKind.DateTime,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: true
  },
  [DatabaseColumnKind.Timestamp]: {
    kind: DatabaseColumnKind.Timestamp,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: true
  },
  [DatabaseColumnKind.Time]: {
    kind: DatabaseColumnKind.Time,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Json]: {
    kind: DatabaseColumnKind.Json,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'json',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Enum]: {
    kind: DatabaseColumnKind.Enum,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'enum',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Binary]: {
    kind: DatabaseColumnKind.Binary,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'binary',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Uuid]: {
    kind: DatabaseColumnKind.Uuid,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'identifier',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Ulid]: {
    kind: DatabaseColumnKind.Ulid,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'identifier',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Unknown]: {
    kind: DatabaseColumnKind.Unknown,
    tsType: 'unknown',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'unknown',
    isNumeric: false,
    isDateTime: false
  }
});

export type DatabaseColumnKindVisitor<R> = {
  readonly [K in DatabaseColumnKind]: (spec: DatabaseColumnKindSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian DatabaseColumnKind dengan exhaustive type safety
 */
export function matchDatabaseColumnKind<R>(
  kind: DatabaseColumnKind,
  visitor: DatabaseColumnKindVisitor<R>
): R {
  const spec = DATABASE_COLUMN_KIND_REGISTRY[kind] ?? DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Unknown];
  return visitor[kind](spec as any);
}

/**
 * Canonical Mapping of Database & Migration Column Types to PrimitiveKind and DatabaseColumnKind.
 * Pure Zero-Regex, Direct O(1) Dictionary Lookup (0 .includes string searching, 0 switch).
 */
export class DatabaseColumnTypeMapper {
  private static readonly TYPE_MAP: Readonly<Record<string, PrimitiveKind>> = Object.freeze({
    'int': PrimitiveKind.NUMBER,
    'integer': PrimitiveKind.NUMBER,
    'tinyint': PrimitiveKind.NUMBER,
    'smallint': PrimitiveKind.NUMBER,
    'mediumint': PrimitiveKind.NUMBER,
    'bigint': PrimitiveKind.NUMBER,
    'unsignedbigint': PrimitiveKind.NUMBER,
    'unsignedinteger': PrimitiveKind.NUMBER,
    'unsignedmediumint': PrimitiveKind.NUMBER,
    'unsignedsmallint': PrimitiveKind.NUMBER,
    'unsignedtinyint': PrimitiveKind.NUMBER,
    'decimal': PrimitiveKind.NUMBER,
    'float': PrimitiveKind.NUMBER,
    'double': PrimitiveKind.NUMBER,
    'numeric': PrimitiveKind.NUMBER,
    'real': PrimitiveKind.NUMBER,
    'number': PrimitiveKind.NUMBER,
    'bool': PrimitiveKind.BOOLEAN,
    'boolean': PrimitiveKind.BOOLEAN,
    'datetime': PrimitiveKind.DATETIME,
    'date': PrimitiveKind.DATETIME,
    'timestamp': PrimitiveKind.DATETIME,
    'time': PrimitiveKind.STRING,
    'file': PrimitiveKind.FILE,
    'image': PrimitiveKind.FILE,
    'string': PrimitiveKind.STRING,
    'varchar': PrimitiveKind.STRING,
    'char': PrimitiveKind.STRING,
    'text': PrimitiveKind.STRING,
    'mediumtext': PrimitiveKind.STRING,
    'longtext': PrimitiveKind.STRING,
    'tinytext': PrimitiveKind.STRING,
    'json': PrimitiveKind.STRING,
    'jsonb': PrimitiveKind.STRING,
    'uuid': PrimitiveKind.STRING,
    'ulid': PrimitiveKind.STRING
  });

  private static readonly COLUMN_KIND_MAP: Readonly<Record<string, DatabaseColumnKind>> = Object.freeze({
    'bigint': DatabaseColumnKind.BigInt,
    'int': DatabaseColumnKind.Integer,
    'integer': DatabaseColumnKind.Integer,
    'smallint': DatabaseColumnKind.SmallInt,
    'tinyint': DatabaseColumnKind.TinyInt,
    'float': DatabaseColumnKind.Float,
    'double': DatabaseColumnKind.Double,
    'decimal': DatabaseColumnKind.Decimal,
    'numeric': DatabaseColumnKind.Decimal,
    'real': DatabaseColumnKind.Float,
    'bool': DatabaseColumnKind.Boolean,
    'boolean': DatabaseColumnKind.Boolean,
    'varchar': DatabaseColumnKind.String,
    'char': DatabaseColumnKind.String,
    'string': DatabaseColumnKind.String,
    'text': DatabaseColumnKind.Text,
    'mediumtext': DatabaseColumnKind.MediumText,
    'longtext': DatabaseColumnKind.LongText,
    'tinytext': DatabaseColumnKind.Text,
    'date': DatabaseColumnKind.Date,
    'datetime': DatabaseColumnKind.DateTime,
    'timestamp': DatabaseColumnKind.Timestamp,
    'time': DatabaseColumnKind.Time,
    'json': DatabaseColumnKind.Json,
    'jsonb': DatabaseColumnKind.Json,
    'enum': DatabaseColumnKind.Enum,
    'blob': DatabaseColumnKind.Binary,
    'binary': DatabaseColumnKind.Binary,
    'uuid': DatabaseColumnKind.Uuid,
    'ulid': DatabaseColumnKind.Ulid
  });

  /**
   * Resolves raw database/migration column type into PrimitiveKind.
   * Guaranteed O(1) direct dictionary resolution.
   */
  public static toPrimitiveKind(rawType: string): PrimitiveKind {
    const rawLower = (rawType || '').trim().toLowerCase();
    if (rawLower === 'tinyint(1)' || rawLower.startsWith('tinyint(1)')) {
      return PrimitiveKind.BOOLEAN;
    }
    const cleanType = (rawType || '').split('(')[0].split(' ')[0].trim().toLowerCase();
    return (this.TYPE_MAP[cleanType] as PrimitiveKind) ?? 'string';
  }

  /**
   * Resolves raw database/migration column type into DatabaseColumnKind.
   * Guaranteed O(1) direct dictionary resolution (0 switch).
   */
  public static toColumnKind(rawType: string): DatabaseColumnKind {
    const cleanType = (rawType || '').split('(')[0].split(' ')[0].trim().toLowerCase();
    return this.COLUMN_KIND_MAP[cleanType] ?? DatabaseColumnKind.Unknown;
  }
}

export interface ParsedColumn {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('createdAt')
  readonly type: string;         // SQL Type ('bigint(20) unsigned' | 'enum')
  readonly columnKind: DatabaseColumnKind; // ✅ Canonical Database Column Kind (Guaranteed)
  readonly nullable: boolean;    // Guaranteed boolean
  readonly semanticType: PrimitiveKind; // ✅ Guaranteed Domain Primitive
  readonly enumValues: readonly string[]; // ✅ Preserved literal enum values (e.g. ['pending', 'completed'])
}

/**
 * EloquentCastKind
 *
 * Canonical Domain Vocabulary for Eloquent Attribute Casts.
 */
export const EloquentCastKind = Object.freeze({
  Integer: 'integer',
  Float: 'float',
  Decimal: 'decimal',
  Boolean: 'boolean',
  String: 'string',
  DateTime: 'datetime',
  Date: 'date',
  Timestamp: 'timestamp',
  Array: 'array',
  Json: 'json',
  Object: 'object',
  Collection: 'collection',
  Encrypted: 'encrypted',
  Custom: 'custom'
} as const);

export type EloquentCastKind = typeof EloquentCastKind[keyof typeof EloquentCastKind];

export interface EloquentCastKindSpecification<K extends EloquentCastKind = EloquentCastKind> {
  readonly kind: K;
  readonly tsType: string;
  readonly semanticType: PrimitiveKind;
  readonly isNumeric: boolean;
  readonly isDateTime: boolean;
  readonly isJsonOrCollection: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key EloquentCastKind.
 */
export type EloquentCastKindRegistry = {
  readonly [K in EloquentCastKind]: EloquentCastKindSpecification<K>;
};

export const ELOQUENT_CAST_REGISTRY: EloquentCastKindRegistry = Object.freeze({
  [EloquentCastKind.Integer]: {
    kind: EloquentCastKind.Integer,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    isNumeric: true,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Float]: {
    kind: EloquentCastKind.Float,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    isNumeric: true,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Decimal]: {
    kind: EloquentCastKind.Decimal,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    isNumeric: true,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Boolean]: {
    kind: EloquentCastKind.Boolean,
    tsType: 'boolean',
    semanticType: PrimitiveKind.BOOLEAN,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.String]: {
    kind: EloquentCastKind.String,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.DateTime]: {
    kind: EloquentCastKind.DateTime,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    isNumeric: false,
    isDateTime: true,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Date]: {
    kind: EloquentCastKind.Date,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    isNumeric: false,
    isDateTime: true,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Timestamp]: {
    kind: EloquentCastKind.Timestamp,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    isNumeric: false,
    isDateTime: true,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Array]: {
    kind: EloquentCastKind.Array,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Json]: {
    kind: EloquentCastKind.Json,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Object]: {
    kind: EloquentCastKind.Object,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Collection]: {
    kind: EloquentCastKind.Collection,
    tsType: 'unknown[]',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Encrypted]: {
    kind: EloquentCastKind.Encrypted,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Custom]: {
    kind: EloquentCastKind.Custom,
    tsType: 'unknown',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  }
});

export type EloquentCastKindVisitor<R> = {
  readonly [K in EloquentCastKind]: (spec: EloquentCastKindSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian EloquentCastKind dengan exhaustive type safety
 */
export function matchEloquentCastKind<R>(
  kind: EloquentCastKind,
  visitor: EloquentCastKindVisitor<R>
): R {
  const spec = ELOQUENT_CAST_REGISTRY[kind] ?? ELOQUENT_CAST_REGISTRY[EloquentCastKind.Custom];
  return visitor[kind](spec as any);
}

/**
 * EloquentCastMapper
 *
 * Canonical Mapper from Laravel $casts string to EloquentCastKind and PrimitiveKind.
 * Pure O(1) dictionary lookup (0 regex, 0 .includes()).
 */
export class EloquentCastMapper {
  private static readonly CAST_MAP: Readonly<Record<string, EloquentCastKind>> = Object.freeze({
    'int': EloquentCastKind.Integer,
    'integer': EloquentCastKind.Integer,
    'real': EloquentCastKind.Float,
    'float': EloquentCastKind.Float,
    'double': EloquentCastKind.Float,
    'decimal': EloquentCastKind.Decimal,
    'string': EloquentCastKind.String,
    'bool': EloquentCastKind.Boolean,
    'boolean': EloquentCastKind.Boolean,
    'object': EloquentCastKind.Object,
    'array': EloquentCastKind.Array,
    'json': EloquentCastKind.Json,
    'collection': EloquentCastKind.Collection,
    'date': EloquentCastKind.Date,
    'datetime': EloquentCastKind.DateTime,
    'custom_datetime': EloquentCastKind.DateTime,
    'timestamp': EloquentCastKind.Timestamp,
    'encrypted': EloquentCastKind.Encrypted
  });

  public static map(rawTargetType: string): { readonly castKind: EloquentCastKind; readonly semanticType: PrimitiveKind } {
    const clean = (rawTargetType || '').split(':')[0].trim().toLowerCase();
    const kind = this.CAST_MAP[clean] ?? EloquentCastKind.Custom;
    const spec = ELOQUENT_CAST_REGISTRY[kind];
    return { castKind: spec.kind, semanticType: spec.semanticType };
  }
}

/**
 * First-Class Eloquent Attribute Cast Entry (Ordered & Guaranteed Complete Model).
 */
export interface ParsedCast {
  readonly column: string;
  readonly targetType: string;
  readonly castKind: EloquentCastKind;
  readonly semanticType: PrimitiveKind;
}

/**
 * First-Class Eloquent Accessor Definition (Ordered).
 */
export interface ParsedAccessor {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('fullName')
  readonly type: string;         // PHP return type
  readonly nullable: boolean;    // Guaranteed boolean
  readonly semanticType: PrimitiveKind; // ✅ Guaranteed Domain Primitive
}

/**
 * EloquentRelationType
 *
 * Canonical Domain Vocabulary for Eloquent ORM Relationships.
 */
export const EloquentRelationType = Object.freeze({
  HasOne: 'hasOne',
  HasMany: 'hasMany',
  BelongsTo: 'belongsTo',
  BelongsToMany: 'belongsToMany',
  HasOneThrough: 'hasOneThrough',
  HasManyThrough: 'hasManyThrough',
  MorphTo: 'morphTo',
  MorphOne: 'morphOne',
  MorphMany: 'morphMany',
  MorphToMany: 'morphToMany',
  MorphedByMany: 'morphedByMany'
} as const);

export type EloquentRelationType = typeof EloquentRelationType[keyof typeof EloquentRelationType];

export type EloquentRelationCardinality = 'one' | 'many';

export interface EloquentRelationDescriptor<T extends EloquentRelationType = EloquentRelationType> {
  readonly type: T;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly isPolymorphic: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key EloquentRelationType (0 string key).
 */
export type EloquentRelationRegistry = {
  readonly [K in EloquentRelationType]: EloquentRelationDescriptor<K>;
};

export const ELOQUENT_RELATION_REGISTRY: EloquentRelationRegistry = Object.freeze({
  [EloquentRelationType.HasOne]: {
    type: EloquentRelationType.HasOne,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: false
  },
  [EloquentRelationType.HasMany]: {
    type: EloquentRelationType.HasMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: false
  },
  [EloquentRelationType.BelongsTo]: {
    type: EloquentRelationType.BelongsTo,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: false
  },
  [EloquentRelationType.BelongsToMany]: {
    type: EloquentRelationType.BelongsToMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: false
  },
  [EloquentRelationType.HasOneThrough]: {
    type: EloquentRelationType.HasOneThrough,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: false
  },
  [EloquentRelationType.HasManyThrough]: {
    type: EloquentRelationType.HasManyThrough,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: false
  },
  [EloquentRelationType.MorphTo]: {
    type: EloquentRelationType.MorphTo,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphOne]: {
    type: EloquentRelationType.MorphOne,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphMany]: {
    type: EloquentRelationType.MorphMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphToMany]: {
    type: EloquentRelationType.MorphToMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphedByMany]: {
    type: EloquentRelationType.MorphedByMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: true
  }
});

/**
 * EloquentRelationClassifier
 *
 * Canonical Classifier for Eloquent ORM Relationships.
 * Strict Type Guard & Mapped Lookup (0 Record<string, ...>).
 */
export class EloquentRelationClassifier {
  public static isRelationMethod(name: string): name is EloquentRelationType {
    return Object.prototype.hasOwnProperty.call(ELOQUENT_RELATION_REGISTRY, name);
  }

  public static getDescriptor<K extends EloquentRelationType>(type: K): EloquentRelationDescriptor<K> {
    return ELOQUENT_RELATION_REGISTRY[type];
  }

  public static isCollection(type: EloquentRelationType): boolean {
    return ELOQUENT_RELATION_REGISTRY[type]?.isCollection ?? false;
  }

  public static isPolymorphic(type: EloquentRelationType): boolean {
    return ELOQUENT_RELATION_REGISTRY[type]?.isPolymorphic ?? false;
  }
}

/**
 * First-Class Eloquent Model Relationship Definition (Ordered & Complete Contract).
 */
export interface ParsedRelation {
  readonly name: string;
  readonly type: EloquentRelationType;
  readonly modelName: string;
  readonly targetModel: string;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly foreignKey: string | null;
}

export interface SingleRelationDescriptor extends ParsedRelation {
  readonly cardinality: 'one';
  readonly isCollection: false;
}

export interface CollectionRelationDescriptor extends ParsedRelation {
  readonly cardinality: 'many';
  readonly isCollection: true;
}

export type RelationCardinalityDescriptor =
  | SingleRelationDescriptor
  | CollectionRelationDescriptor;

export interface RelationCardinalityVisitor<R> {
  readonly one: (relation: SingleRelationDescriptor) => R;
  readonly many: (relation: CollectionRelationDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik kardinalitas relasi Eloquent
 */
export function matchRelationCardinality<R>(
  relation: ParsedRelation,
  visitor: RelationCardinalityVisitor<R>
): R {
  const cardinality = relation.cardinality ?? (relation.isCollection ? 'many' : 'one');
  return visitor[cardinality](relation as any);
}

export const matchRelation = matchRelationCardinality;

export interface EloquentRelationTypeVisitor<R> {
  readonly hasOne: (rel: ParsedRelation) => R;
  readonly hasMany: (rel: ParsedRelation) => R;
  readonly belongsTo: (rel: ParsedRelation) => R;
  readonly belongsToMany: (rel: ParsedRelation) => R;
  readonly hasOneThrough: (rel: ParsedRelation) => R;
  readonly hasManyThrough: (rel: ParsedRelation) => R;
  readonly morphTo: (rel: ParsedRelation) => R;
  readonly morphOne: (rel: ParsedRelation) => R;
  readonly morphMany: (rel: ParsedRelation) => R;
  readonly morphToMany: (rel: ParsedRelation) => R;
  readonly morphedByMany: (rel: ParsedRelation) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik tipe relasi Eloquent
 */
export function matchRelationType<R>(
  relation: ParsedRelation,
  visitor: EloquentRelationTypeVisitor<R>
): R {
  return visitor[relation.type](relation);
}

/**
 * ModelKeyType
 *
 * Canonical Domain Vocabulary for Eloquent Model Primary Keys.
 */
export const ModelKeyType = Object.freeze({
  Int: 'int',
  BigInt: 'bigint',
  String: 'string',
  Uuid: 'uuid',
  Ulid: 'ulid'
} as const);

export type ModelKeyType = typeof ModelKeyType[keyof typeof ModelKeyType];

export interface ModelKeyTypeSpecification<T extends ModelKeyType = ModelKeyType> {
  readonly type: T;
  readonly tsType: 'number' | 'string';
  readonly isNumeric: boolean;
  readonly isStringLike: boolean;
  readonly primitiveKind: PrimitiveKind;
  readonly sampleValue: number | string;
  readonly description: string;
}

export type ModelKeyTypeRegistry = {
  readonly [K in ModelKeyType]: ModelKeyTypeSpecification<K>;
};

export const MODEL_KEY_TYPE_REGISTRY: ModelKeyTypeRegistry = Object.freeze({
  [ModelKeyType.Int]: {
    type: ModelKeyType.Int,
    tsType: 'number',
    isNumeric: true,
    isStringLike: false,
    primitiveKind: PrimitiveKind.NUMBER,
    sampleValue: 1,
    description: 'Integer primary key (auto-incrementing)'
  },
  [ModelKeyType.BigInt]: {
    type: ModelKeyType.BigInt,
    tsType: 'number',
    isNumeric: true,
    isStringLike: false,
    primitiveKind: PrimitiveKind.NUMBER,
    sampleValue: 1,
    description: 'BigInteger primary key'
  },
  [ModelKeyType.String]: {
    type: ModelKeyType.String,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    primitiveKind: PrimitiveKind.STRING,
    sampleValue: 'id_sample',
    description: 'String primary key'
  },
  [ModelKeyType.Uuid]: {
    type: ModelKeyType.Uuid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    primitiveKind: PrimitiveKind.STRING,
    sampleValue: '00000000-0000-0000-0000-000000000000',
    description: 'UUID primary key'
  },
  [ModelKeyType.Ulid]: {
    type: ModelKeyType.Ulid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    primitiveKind: PrimitiveKind.STRING,
    sampleValue: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    description: 'ULID primary key'
  }
});

export type ModelKeyTypeVisitor<R> = {
  readonly int: (spec: ModelKeyTypeSpecification<'int'>) => R;
  readonly bigint: (spec: ModelKeyTypeSpecification<'bigint'>) => R;
  readonly string: (spec: ModelKeyTypeSpecification<'string'>) => R;
  readonly uuid: (spec: ModelKeyTypeSpecification<'uuid'>) => R;
  readonly ulid: (spec: ModelKeyTypeSpecification<'ulid'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik ModelKeyType dengan exhaustive type safety
 */
export function matchModelKeyType<R>(
  typeOrModel: ModelKeyType | { readonly keyType: ModelKeyType },
  visitor: ModelKeyTypeVisitor<R>
): R {
  const type = typeof typeOrModel === 'string' ? typeOrModel : typeOrModel.keyType;
  const spec = MODEL_KEY_TYPE_REGISTRY[type];
  return visitor[type](spec as any);
}

/**
 * ModelKeyTypeMapper
 *
 * O(1) canonical dictionary normalization for model primary key types.
 */
export class ModelKeyTypeMapper {
  private static readonly NORMALIZATION_MAP: Readonly<Record<string, ModelKeyType>> = Object.freeze({
    int: ModelKeyType.Int,
    integer: ModelKeyType.Int,
    bigint: ModelKeyType.BigInt,
    string: ModelKeyType.String,
    uuid: ModelKeyType.Uuid,
    ulid: ModelKeyType.Ulid
  });

  public static normalize(rawKeyType?: string | null): ModelKeyType {
    if (!rawKeyType) return ModelKeyType.Int;
    return this.NORMALIZATION_MAP[rawKeyType.toLowerCase()] ?? ModelKeyType.Int;
  }
}


/**
 * Pure Ordered Eloquent Model AST (0 Record, 0 Object.entries).
 */
export interface ParsedModel {
  readonly name: string;       // e.g. 'App\\Models\\User'
  readonly shortName: string;  // e.g. 'User' (Guaranteed from class_basename in PHP)
  readonly table: string;
  readonly primaryKey: string; // ✅ Guaranteed ('id')
  readonly keyType: ModelKeyType; // ✅ Guaranteed ('int' | 'bigint' | 'uuid')
  readonly keySemanticType: PrimitiveKind; // ✅ Guaranteed (PrimitiveKind.NUMBER | STRING)
  readonly incrementing: boolean; // ✅ Guaranteed boolean
  readonly softDeletes: boolean;  // ✅ Guaranteed boolean (true if SoftDeletes trait or deleted_at column present)
  readonly timestamps: boolean;   // ✅ Guaranteed boolean (true if created_at & updated_at columns present)
  readonly columns: readonly ParsedColumn[];
  readonly fillable: readonly string[];
  readonly guarded: readonly string[];
  readonly hidden: readonly string[];
  readonly appends: readonly string[];
  readonly casts: readonly ParsedCast[];
  readonly accessors: readonly ParsedAccessor[];
  readonly relations: readonly ParsedRelation[];
}

export const ResponseShape = Object.freeze({
  Paginated: 'paginated',
  Collection: 'collection',
  Single: 'single'
} as const);

export type ResponseShape = typeof ResponseShape[keyof typeof ResponseShape];

export interface ResponseShapeSpecification<S extends ResponseShape = ResponseShape> {
  readonly shape: S;
  readonly isCollection: boolean;
  readonly isPaginated: boolean;
  readonly isSingle: boolean;
  readonly defaultWrapperKey: string | null;
  readonly description: string;
}

export type ResponseShapeRegistry = {
  readonly [K in ResponseShape]: ResponseShapeSpecification<K>;
};

export const RESPONSE_SHAPE_REGISTRY: ResponseShapeRegistry = Object.freeze({
  [ResponseShape.Paginated]: {
    shape: ResponseShape.Paginated,
    isCollection: true,
    isPaginated: true,
    isSingle: false,
    defaultWrapperKey: 'data',
    description: 'Paginated envelope containing a collection of records with pagination metadata'
  },
  [ResponseShape.Collection]: {
    shape: ResponseShape.Collection,
    isCollection: true,
    isPaginated: false,
    isSingle: false,
    defaultWrapperKey: 'data',
    description: 'Direct array or collection of records'
  },
  [ResponseShape.Single]: {
    shape: ResponseShape.Single,
    isCollection: false,
    isPaginated: false,
    isSingle: true,
    defaultWrapperKey: null,
    description: 'Single item or record object'
  }
});

export type ResponseShapeVisitor<R> = {
  readonly paginated: (spec: ResponseShapeSpecification<'paginated'>) => R;
  readonly collection: (spec: ResponseShapeSpecification<'collection'>) => R;
  readonly single: (spec: ResponseShapeSpecification<'single'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik ResponseShape dengan exhaustive type safety
 */
export function matchResponseShape<R>(
  shapeOrDescriptor: ResponseShape | { readonly shape: ResponseShape },
  visitor: ResponseShapeVisitor<R>
): R {
  const shape = typeof shapeOrDescriptor === 'string' ? shapeOrDescriptor : shapeOrDescriptor.shape;
  const spec = RESPONSE_SHAPE_REGISTRY[shape];
  return visitor[shape](spec as any);
}


/**
 * PaginationKind
 *
 * Canonical Domain Vocabulary for Laravel Pagination Envelopes.
 */
export const PaginationKind = Object.freeze({
  LengthAware: 'length_aware',
  Cursor: 'cursor'
} as const);

export type PaginationKind = typeof PaginationKind[keyof typeof PaginationKind];

/**
 * PaginatedEnvelopeDescriptor
 *
 * Explicit Domain Model for Laravel Pagination JSON Envelope.
 */
export interface BasePaginatedEnvelopeDescriptor {
  readonly kind: PaginationKind;
  readonly dataKey: string;     // 'data'
  readonly metaKey: string;     // 'meta'
  readonly linksKey?: string | null;   // 'links' | null | undefined
  readonly envelopeTypeName: string; // e.g. 'PaginatedResponse<T>'
}

export interface LengthAwarePaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {
  readonly kind: 'length_aware';
  readonly linksKey: string;
}

export interface CursorPaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {
  readonly kind: 'cursor';
  readonly linksKey?: null;
}

export type AnyPaginatedEnvelopeDescriptor =
  | LengthAwarePaginatedEnvelopeDescriptor
  | CursorPaginatedEnvelopeDescriptor;

export interface PaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {}

export interface PaginationKindSpecification<K extends PaginationKind = PaginationKind> {
  readonly kind: K;
  readonly defaultDataKey: string;
  readonly defaultMetaKey: string;
  readonly defaultLinksKey: string | null;
  readonly defaultEnvelopeTypeName: string;
  readonly hasPageLinks: boolean;
  readonly isCursorBased: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key PaginationKind.
 */
export type PaginationKindRegistry = {
  readonly [K in PaginationKind]: PaginationKindSpecification<K>;
};

export const PAGINATION_KIND_REGISTRY: PaginationKindRegistry = Object.freeze({
  [PaginationKind.LengthAware]: {
    kind: PaginationKind.LengthAware,
    defaultDataKey: 'data',
    defaultMetaKey: 'meta',
    defaultLinksKey: 'links',
    defaultEnvelopeTypeName: 'PaginatedResponse<T>',
    hasPageLinks: true,
    isCursorBased: false
  },
  [PaginationKind.Cursor]: {
    kind: PaginationKind.Cursor,
    defaultDataKey: 'data',
    defaultMetaKey: 'meta',
    defaultLinksKey: null,
    defaultEnvelopeTypeName: 'CursorPaginatedResponse<T>',
    hasPageLinks: false,
    isCursorBased: true
  }
});

export interface PaginatedEnvelopeVisitor<R> {
  readonly length_aware: (desc: LengthAwarePaginatedEnvelopeDescriptor) => R;
  readonly cursor: (desc: CursorPaginatedEnvelopeDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik tipe PaginatedEnvelopeDescriptor dengan exhaustive type safety
 */
export function matchPaginatedEnvelope<R>(
  envelope: PaginatedEnvelopeDescriptor,
  visitor: PaginatedEnvelopeVisitor<R>
): R {
  return visitor[envelope.kind](envelope as any);
}

export const matchPaginationKind = matchPaginatedEnvelope;

/**
 * PolymorphicMorphType
 *
 * Canonical Domain Vocabulary for Eloquent Polymorphic ORM Relations.
 */
export const PolymorphicMorphType = Object.freeze({
  MorphTo: 'morphTo',
  MorphOne: 'morphOne',
  MorphMany: 'morphMany',
  MorphToMany: 'morphToMany',
  MorphedByMany: 'morphedByMany'
} as const);

export type PolymorphicMorphType = typeof PolymorphicMorphType[keyof typeof PolymorphicMorphType];

export interface BasePolymorphicRelationDescriptor<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly idColumn: string;          // 'commentable_id'
  readonly typeColumn: string;        // 'commentable_type'
  readonly targetModels: readonly string[]; // ['Post', 'Video']
  readonly unionTypeName: string;     // 'CommentableTarget'
  readonly isCollection?: boolean;
  readonly cardinality?: EloquentRelationCardinality;
}

export interface MorphToRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphTo'> {
  readonly morphType: 'morphTo';
  readonly isCollection?: false;
  readonly cardinality?: 'one';
}

export interface MorphOneRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphOne'> {
  readonly morphType: 'morphOne';
  readonly isCollection?: false;
  readonly cardinality?: 'one';
}

export interface MorphManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphMany'> {
  readonly morphType: 'morphMany';
  readonly isCollection?: true;
  readonly cardinality?: 'many';
}

export interface MorphToManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphToMany'> {
  readonly morphType: 'morphToMany';
  readonly isCollection?: true;
  readonly cardinality?: 'many';
}

export interface MorphedByManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphedByMany'> {
  readonly morphType: 'morphedByMany';
  readonly isCollection?: true;
  readonly cardinality?: 'many';
}

export type PolymorphicRelationDescriptor<T extends PolymorphicMorphType = PolymorphicMorphType> =
  T extends 'morphTo' ? MorphToRelationDescriptor :
  T extends 'morphOne' ? MorphOneRelationDescriptor :
  T extends 'morphMany' ? MorphManyRelationDescriptor :
  T extends 'morphToMany' ? MorphToManyRelationDescriptor :
  T extends 'morphedByMany' ? MorphedByManyRelationDescriptor :
  BasePolymorphicRelationDescriptor<T>;

export type AnyPolymorphicRelationDescriptor =
  | MorphToRelationDescriptor
  | MorphOneRelationDescriptor
  | MorphManyRelationDescriptor
  | MorphToManyRelationDescriptor
  | MorphedByManyRelationDescriptor;

export interface PolymorphicRelationSpecification<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly defaultIdColumn: string;
  readonly defaultTypeColumn: string;
  readonly defaultUnionTypeName: string;
}

export type PolymorphicRelationRegistry = {
  readonly [K in PolymorphicMorphType]: PolymorphicRelationSpecification<K>;
};

export const POLYMORPHIC_RELATION_REGISTRY: PolymorphicRelationRegistry = Object.freeze({
  [PolymorphicMorphType.MorphTo]: {
    morphType: PolymorphicMorphType.MorphTo,
    cardinality: 'one',
    isCollection: false,
    defaultIdColumn: 'commentable_id',
    defaultTypeColumn: 'commentable_type',
    defaultUnionTypeName: 'CommentableTarget'
  },
  [PolymorphicMorphType.MorphOne]: {
    morphType: PolymorphicMorphType.MorphOne,
    cardinality: 'one',
    isCollection: false,
    defaultIdColumn: 'commentable_id',
    defaultTypeColumn: 'commentable_type',
    defaultUnionTypeName: 'CommentableTarget'
  },
  [PolymorphicMorphType.MorphMany]: {
    morphType: PolymorphicMorphType.MorphMany,
    cardinality: 'many',
    isCollection: true,
    defaultIdColumn: 'commentable_id',
    defaultTypeColumn: 'commentable_type',
    defaultUnionTypeName: 'CommentableTarget'
  },
  [PolymorphicMorphType.MorphToMany]: {
    morphType: PolymorphicMorphType.MorphToMany,
    cardinality: 'many',
    isCollection: true,
    defaultIdColumn: 'taggable_id',
    defaultTypeColumn: 'taggable_type',
    defaultUnionTypeName: 'TaggableTarget'
  },
  [PolymorphicMorphType.MorphedByMany]: {
    morphType: PolymorphicMorphType.MorphedByMany,
    cardinality: 'many',
    isCollection: true,
    defaultIdColumn: 'taggable_id',
    defaultTypeColumn: 'taggable_type',
    defaultUnionTypeName: 'TaggableTarget'
  }
});

export type PolymorphicRelationVisitor<R> = {
  readonly [K in PolymorphicMorphType]: (relation: PolymorphicRelationDescriptor<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian PolymorphicRelationDescriptor dengan exhaustive type safety
 */
export function matchPolymorphicRelation<R>(
  relation: PolymorphicRelationDescriptor,
  visitor: PolymorphicRelationVisitor<R>
): R {
  return visitor[relation.morphType](relation as any);
}

export const matchPolymorphicMorphType = matchPolymorphicRelation;


export interface ScannedPaginatedEnvelopeParams {
  readonly kind: PaginationKind;
  readonly dataKey: string;
  readonly metaKey: string;
  readonly linksKey: string | null;
  readonly envelopeTypeName: string;
}

/**
 * Reusable Constructor: Scanned Paginated Envelope Descriptor.
 */
export class ScannedPaginatedEnvelopeDescriptor implements PaginatedEnvelopeDescriptor {
  public readonly kind: PaginationKind;
  public readonly dataKey: string;
  public readonly metaKey: string;
  public readonly linksKey: string | null;
  public readonly envelopeTypeName: string;

  constructor(params: ScannedPaginatedEnvelopeParams) {
    this.kind = params.kind;
    this.dataKey = params.dataKey;
    this.metaKey = params.metaKey;
    this.linksKey = params.linksKey;
    this.envelopeTypeName = params.envelopeTypeName;
    Object.freeze(this);
  }

  public static create({
    kind = PaginationKind.LengthAware,
    dataKey,
    metaKey,
    linksKey,
    envelopeTypeName
  }: {
    readonly kind?: PaginationKind;
    readonly dataKey?: string;
    readonly metaKey?: string;
    readonly linksKey?: string | null;
    readonly envelopeTypeName?: string;
  } = {}): PaginatedEnvelopeDescriptor {
    const spec = PAGINATION_KIND_REGISTRY[kind];
    return new ScannedPaginatedEnvelopeDescriptor({
      kind,
      dataKey: dataKey ?? spec.defaultDataKey,
      metaKey: metaKey ?? spec.defaultMetaKey,
      linksKey: linksKey !== undefined ? linksKey : spec.defaultLinksKey,
      envelopeTypeName: envelopeTypeName ?? spec.defaultEnvelopeTypeName
    });
  }

  public static lengthAware(
    dataKey: string = 'data',
    linksKey: string = 'links',
    envelopeTypeName: string = 'PaginatedResponse<T>'
  ): LengthAwarePaginatedEnvelopeDescriptor {
    return new ScannedPaginatedEnvelopeDescriptor({
      kind: PaginationKind.LengthAware,
      dataKey,
      metaKey: 'meta',
      linksKey,
      envelopeTypeName
    }) as LengthAwarePaginatedEnvelopeDescriptor;
  }

  public static cursor(
    dataKey: string = 'data',
    envelopeTypeName: string = 'CursorPaginatedResponse<T>'
  ): CursorPaginatedEnvelopeDescriptor {
    return new ScannedPaginatedEnvelopeDescriptor({
      kind: PaginationKind.Cursor,
      dataKey,
      metaKey: 'meta',
      linksKey: null,
      envelopeTypeName
    }) as CursorPaginatedEnvelopeDescriptor;
  }
}

export interface ScannedPolymorphicRelationParams<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly idColumn: string;
  readonly typeColumn: string;
  readonly targetModels: readonly string[];
  readonly unionTypeName: string;
}

/**
 * Reusable Constructor: Scanned Polymorphic Relation Descriptor.
 */
export class ScannedPolymorphicRelationDescriptor implements BasePolymorphicRelationDescriptor {
  public readonly morphType: PolymorphicMorphType;
  public readonly idColumn: string;
  public readonly typeColumn: string;
  public readonly targetModels: readonly string[];
  public readonly unionTypeName: string;
  public readonly isCollection: boolean;
  public readonly cardinality: EloquentRelationCardinality;

  constructor(params: ScannedPolymorphicRelationParams) {
    this.morphType = params.morphType;
    this.idColumn = params.idColumn;
    this.typeColumn = params.typeColumn;
    this.targetModels = Object.freeze([...params.targetModels]);
    this.unionTypeName = params.unionTypeName;
    const spec = POLYMORPHIC_RELATION_REGISTRY[params.morphType];
    this.isCollection = spec.isCollection;
    this.cardinality = spec.cardinality;
    Object.freeze(this);
  }

  public static create({
    morphType = PolymorphicMorphType.MorphTo,
    idColumn,
    typeColumn,
    targetModels = [],
    unionTypeName
  }: {
    readonly morphType?: PolymorphicMorphType;
    readonly idColumn?: string;
    readonly typeColumn?: string;
    readonly targetModels?: readonly string[];
    readonly unionTypeName?: string;
  } = {}): ScannedPolymorphicRelationDescriptor {
    const effectiveType = morphType ?? PolymorphicMorphType.MorphTo;
    const spec = POLYMORPHIC_RELATION_REGISTRY[effectiveType];
    return new ScannedPolymorphicRelationDescriptor({
      morphType: effectiveType,
      idColumn: idColumn ?? spec.defaultIdColumn,
      typeColumn: typeColumn ?? spec.defaultTypeColumn,
      targetModels,
      unionTypeName: unionTypeName ?? spec.defaultUnionTypeName
    });
  }

  public static morphTo(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphToRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphTo,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphToRelationDescriptor;
  }

  public static morphOne(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphOneRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphOne,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphOneRelationDescriptor;
  }

  public static morphMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphMany,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphManyRelationDescriptor;
  }

  public static morphToMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'taggable_id',
    typeColumn: string = 'taggable_type',
    unionTypeName: string = 'TaggableTarget'
  ): MorphToManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphToMany,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphToManyRelationDescriptor;
  }

  public static morphedByMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'taggable_id',
    typeColumn: string = 'taggable_type',
    unionTypeName: string = 'TaggableTarget'
  ): MorphedByManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphedByMany,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphedByManyRelationDescriptor;
  }
}

export interface RouteResponseAnalysis {
  readonly routeName: string;
  readonly responseType: string;
  readonly shape: ResponseShape;
  readonly resourceName: string | null;
  readonly modelName: string | null;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

export abstract class ResponseDescriptorBase {
  abstract readonly kind: string;
  abstract readonly shape: ResponseShape;
  abstract readonly readTypeName: string; // ✅ Guaranteed Read Type Name ('UserResourceTransformed')
  abstract readonly mapperName: string;   // ✅ Guaranteed Mapper Function Name ('toUserResourceRead')
  abstract readonly validatorName: string; // ✅ Guaranteed Contract Validator Name ('validateUserResourceSchema')

  abstract toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis;
  abstract toResponseBody(): ResponseBody;
}

export interface ResourceResponseParams {
  readonly resourceName: string;
  readonly shape: ResponseShape;
}

export class ResourceResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'resource' as const;
  public readonly shape: ResponseShape;
  public readonly resourceName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;

  constructor(params: ResourceResponseParams) {
    super();
    this.resourceName = params.resourceName;
    this.shape = params.shape;
    this.readTypeName = `${params.resourceName}Transformed`;
    this.mapperName = `to${params.resourceName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.resourceName)}Index`
      : `validate${toPascalCase(params.resourceName)}Schema`;
    Object.freeze(this);
  }

  public static create({
    resourceName = 'UnknownResource',
    shape = 'single'
  }: {
    readonly resourceName?: string;
    readonly shape?: ResponseShape;
  } = {}): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape });
  }

  public static single(resourceName: string): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'single' });
  }

  public static collection(resourceName: string): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'collection' });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: this.resourceName,
      modelName: null,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'resource',
      resource: this.resourceName,
      shape: this.shape
    };
  }
}

export interface ModelResponseParams {
  readonly modelName: string;
  readonly shape: ResponseShape;
}

export class ModelResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'model' as const;
  public readonly shape: ResponseShape;
  public readonly modelName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;

  constructor(params: ModelResponseParams) {
    super();
    this.modelName = params.modelName;
    this.shape = params.shape;
    this.readTypeName = `${params.modelName}Transformed`;
    this.mapperName = `to${params.modelName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.modelName)}Index`
      : `validate${toPascalCase(params.modelName)}Schema`;
    Object.freeze(this);
  }

  public static create({
    modelName = 'UnknownModel',
    shape = 'single'
  }: {
    readonly modelName?: string;
    readonly shape?: ResponseShape;
  } = {}): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape });
  }

  public static single(modelName: string): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'single' });
  }

  public static collection(modelName: string): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'collection' });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: null,
      modelName: this.modelName,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'model',
      model: this.modelName,
      shape: this.shape
    };
  }
}

export class VoidResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'void' as const;
  public readonly shape = 'single' as const;
  public readonly readTypeName = 'void';
  public readonly mapperName = 'identity';
  public readonly validatorName = 'undefined';

  constructor() {
    super();
    Object.freeze(this);
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: null,
      modelName: null,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'primitive',
      primitiveType: 'void',
      shape: 'single'
    };
  }
}

export interface InlineResponseDescriptorParams {
  readonly domain: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly shape: ResponseShape;
}

export class InlineResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'inline' as const;
  public readonly shape: ResponseShape;
  public readonly domain: string;
  public readonly baseName: string;
  public readonly typeName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;
  public readonly fields: readonly ResourceFieldDescriptor[];

  constructor(params: InlineResponseDescriptorParams) {
    super();
    this.domain = params.domain;
    this.baseName = params.baseName;
    this.typeName = params.typeName;
    this.readTypeName = params.typeName;
    this.mapperName = `to${params.baseName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.baseName)}Index`
      : `validate${toPascalCase(params.baseName)}Schema`;
    this.fields = Object.freeze([...params.fields]);
    this.shape = params.shape;
    Object.freeze(this);
  }

  public static create({
    domain,
    baseName = domain,
    typeName = `${baseName}Transformed`,
    fields,
    shape = ResponseShape.Single
  }: {
    readonly domain: string;
    readonly baseName?: string;
    readonly typeName?: string;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly shape?: ResponseShape;
  }): InlineResponseDescriptor {
    return new InlineResponseDescriptor({
      domain,
      baseName,
      typeName,
      fields,
      shape
    });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.typeName,
      shape: this.shape,
      resourceName: null,
      modelName: null,
      confidence,
      reasons: [
        `Inline response with ${this.fields.length} fields`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    const properties: Record<string, { readonly typeName: string; readonly nullable: boolean }> = {};
    for (const f of this.fields) {
      properties[f.name] = { typeName: 'string', nullable: f.nullable };
    }
    return {
      type: 'object',
      schema: {
        properties
      },
      shape: this.shape
    };
  }
}

export const ResponseKind = Object.freeze({
  Resource: 'resource',
  Model: 'model',
  Inline: 'inline',
  Void: 'void'
} as const);

export type ResponseKind = typeof ResponseKind[keyof typeof ResponseKind];

export type ResponseDescriptor =
  | ResourceResponseDescriptor
  | ModelResponseDescriptor
  | InlineResponseDescriptor
  | VoidResponseDescriptor;

export interface ResponseKindSpecification<K extends ResponseKind = ResponseKind> {
  readonly kind: K;
  readonly hasSchema: boolean;
  readonly hasMapper: boolean;
  readonly defaultStatusCode: number;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key ResponseKind.
 */
export type ResponseDescriptorRegistry = {
  readonly [K in ResponseKind]: ResponseKindSpecification<K>;
};

export const RESPONSE_DESCRIPTOR_REGISTRY: ResponseDescriptorRegistry = Object.freeze({
  [ResponseKind.Resource]: {
    kind: ResponseKind.Resource,
    hasSchema: true,
    hasMapper: true,
    defaultStatusCode: 200,
  },
  [ResponseKind.Model]: {
    kind: ResponseKind.Model,
    hasSchema: true,
    hasMapper: false,
    defaultStatusCode: 200,
  },
  [ResponseKind.Inline]: {
    kind: ResponseKind.Inline,
    hasSchema: true,
    hasMapper: true,
    defaultStatusCode: 200,
  },
  [ResponseKind.Void]: {
    kind: ResponseKind.Void,
    hasSchema: false,
    hasMapper: false,
    defaultStatusCode: 204,
  },
});

export interface ResponseVisitor<R> {
  readonly resource: (desc: ResourceResponseDescriptor) => R;
  readonly model: (desc: ModelResponseDescriptor) => R;
  readonly inline: (desc: InlineResponseDescriptor) => R;
  readonly void: (desc: VoidResponseDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ResponseDescriptor dengan exhaustive type safety
 */
export function matchResponse<R>(
  descriptor: ResponseDescriptor,
  visitor: ResponseVisitor<R>
): R {
  return visitor[descriptor.kind](descriptor as any);
}

export const RouteParameterLocation = Object.freeze({
  Path: 'path',
  Query: 'query',
  Header: 'header'
} as const);

export type RouteParameterLocation = typeof RouteParameterLocation[keyof typeof RouteParameterLocation];

/**
 * RouteParameterType
 *
 * Canonical Domain Vocabulary for HTTP Route Parameter Data Types.
 */
export const RouteParameterType = Object.freeze({
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Uuid: 'uuid',
  Ulid: 'ulid',
  Date: 'date',
  Slug: 'slug'
} as const);

export type RouteParameterType = typeof RouteParameterType[keyof typeof RouteParameterType];

export interface RouteParameterTypeSpecification<T extends RouteParameterType = RouteParameterType> {
  readonly type: T;
  readonly tsType: 'number' | 'string' | 'boolean';
  readonly isNumeric: boolean;
  readonly isStringLike: boolean;
  readonly isIdentifier: boolean;
  readonly pattern: string;
  readonly zodValidator: string;
  readonly description: string;
}

export type RouteParameterTypeRegistry = {
  readonly [K in RouteParameterType]: RouteParameterTypeSpecification<K>;
};

export const ROUTE_PARAMETER_TYPE_REGISTRY: RouteParameterTypeRegistry = Object.freeze({
  [RouteParameterType.Number]: {
    type: RouteParameterType.Number,
    tsType: 'number',
    isNumeric: true,
    isStringLike: false,
    isIdentifier: true,
    pattern: '^\\d+$',
    zodValidator: 'z.coerce.number()',
    description: 'Numeric path or query parameter'
  },
  [RouteParameterType.String]: {
    type: RouteParameterType.String,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: false,
    pattern: '.*',
    zodValidator: 'z.string()',
    description: 'Generic string parameter'
  },
  [RouteParameterType.Boolean]: {
    type: RouteParameterType.Boolean,
    tsType: 'boolean',
    isNumeric: false,
    isStringLike: false,
    isIdentifier: false,
    pattern: '^(true|false|1|0)$',
    zodValidator: 'z.coerce.boolean()',
    description: 'Boolean flag parameter'
  },
  [RouteParameterType.Uuid]: {
    type: RouteParameterType.Uuid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: true,
    pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    zodValidator: 'z.string().uuid()',
    description: 'RFC 4122 Universally Unique Identifier'
  },
  [RouteParameterType.Ulid]: {
    type: RouteParameterType.Ulid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: true,
    pattern: '^[0-7][0-9A-HJKMNP-TV-Z]{25}$',
    zodValidator: 'z.string().ulid()',
    description: 'Universally Unique Lexicographically Sortable Identifier'
  },
  [RouteParameterType.Date]: {
    type: RouteParameterType.Date,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: false,
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    zodValidator: 'z.string().date()',
    description: 'ISO-8601 date parameter'
  },
  [RouteParameterType.Slug]: {
    type: RouteParameterType.Slug,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: true,
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    zodValidator: 'z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)',
    description: 'URL-friendly slug identifier'
  }
});

export type RouteParameterTypeVisitor<R> = {
  readonly number: (spec: RouteParameterTypeSpecification<'number'>) => R;
  readonly string: (spec: RouteParameterTypeSpecification<'string'>) => R;
  readonly boolean: (spec: RouteParameterTypeSpecification<'boolean'>) => R;
  readonly uuid: (spec: RouteParameterTypeSpecification<'uuid'>) => R;
  readonly ulid: (spec: RouteParameterTypeSpecification<'ulid'>) => R;
  readonly date: (spec: RouteParameterTypeSpecification<'date'>) => R;
  readonly slug: (spec: RouteParameterTypeSpecification<'slug'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik RouteParameterType dengan exhaustive type safety
 */
export function matchRouteParameterType<R>(
  typeOrParam: RouteParameterType | { readonly type: RouteParameterType },
  visitor: RouteParameterTypeVisitor<R>
): R {
  const type = typeof typeOrParam === 'string' ? typeOrParam : typeOrParam.type;
  const spec = ROUTE_PARAMETER_TYPE_REGISTRY[type];
  return visitor[type](spec as any);
}


export interface RouteParameter {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('orderId', 0 toCamelCase in downstream)
  readonly bindingField: string | null; // ✅ Canonical Bound Field ('slug', 'uuid', from Laravel {post:slug})
  readonly in: RouteParameterLocation;
  readonly required: boolean;
  readonly type: RouteParameterType; // ✅ 100% Guaranteed Canonical Vocabulary
}

export interface PathParameterDescriptor extends RouteParameter {
  readonly in: 'path';
}

export interface QueryParameterDescriptor extends RouteParameter {
  readonly in: 'query';
}

export interface HeaderParameterDescriptor extends RouteParameter {
  readonly in: 'header';
}

export type AnyRouteParameter =
  | PathParameterDescriptor
  | QueryParameterDescriptor
  | HeaderParameterDescriptor;

export interface RouteParameterLocationSpecification<K extends RouteParameterLocation = RouteParameterLocation> {
  readonly location: K;
  readonly defaultRequired: boolean;
  readonly isUrlSegment: boolean;
  readonly isTransportHeader: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key RouteParameterLocation.
 */
export type RouteParameterLocationRegistry = {
  readonly [K in RouteParameterLocation]: RouteParameterLocationSpecification<K>;
};

export const PARAMETER_LOCATION_REGISTRY: RouteParameterLocationRegistry = Object.freeze({
  [RouteParameterLocation.Path]: {
    location: RouteParameterLocation.Path,
    defaultRequired: true,
    isUrlSegment: true,
    isTransportHeader: false,
  },
  [RouteParameterLocation.Query]: {
    location: RouteParameterLocation.Query,
    defaultRequired: false,
    isUrlSegment: true,
    isTransportHeader: false,
  },
  [RouteParameterLocation.Header]: {
    location: RouteParameterLocation.Header,
    defaultRequired: true,
    isUrlSegment: false,
    isTransportHeader: true,
  },
});

export interface RouteParameterVisitor<R> {
  readonly path: (param: PathParameterDescriptor) => R;
  readonly query: (param: QueryParameterDescriptor) => R;
  readonly header: (param: HeaderParameterDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik lokasi parameter dengan exhaustive type safety
 */
export function matchRouteParameter<R>(
  param: RouteParameter,
  visitor: RouteParameterVisitor<R>
): R {
  return visitor[param.in](param as any);
}

/**
 * ValidationRuleKind
 *
 * Canonical Domain Vocabulary for Laravel Validation Rules.
 */
export const ValidationRuleKind = Object.freeze({
  Required: 'required',
  Nullable: 'nullable',
  Optional: 'optional',
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Array: 'array',
  Email: 'email',
  Url: 'url',
  Uuid: 'uuid',
  Date: 'date',
  Min: 'min',
  Max: 'max',
  Between: 'between',
  In: 'in',
  Exists: 'exists',
  Unique: 'unique',
  File: 'file',
  Image: 'image',
  Custom: 'custom'
} as const);

export type ValidationRuleKind = typeof ValidationRuleKind[keyof typeof ValidationRuleKind];

export interface BaseValidationRuleNode<K extends ValidationRuleKind = ValidationRuleKind> {
  readonly kind: K;
}

export interface RequiredValidationRuleNode extends BaseValidationRuleNode<'required'> {
  readonly kind: 'required';
}

export interface NullableValidationRuleNode extends BaseValidationRuleNode<'nullable'> {
  readonly kind: 'nullable';
}

export interface OptionalValidationRuleNode extends BaseValidationRuleNode<'optional'> {
  readonly kind: 'optional';
}

export interface StringValidationRuleNode extends BaseValidationRuleNode<'string'> {
  readonly kind: 'string';
}

export interface NumberValidationRuleNode extends BaseValidationRuleNode<'number'> {
  readonly kind: 'number';
}

export interface BooleanValidationRuleNode extends BaseValidationRuleNode<'boolean'> {
  readonly kind: 'boolean';
}

export interface ArrayValidationRuleNode extends BaseValidationRuleNode<'array'> {
  readonly kind: 'array';
  readonly elementType: string | null;
}

export interface EmailValidationRuleNode extends BaseValidationRuleNode<'email'> {
  readonly kind: 'email';
}

export interface UrlValidationRuleNode extends BaseValidationRuleNode<'url'> {
  readonly kind: 'url';
}

export interface UuidValidationRuleNode extends BaseValidationRuleNode<'uuid'> {
  readonly kind: 'uuid';
}

export interface DateValidationRuleNode extends BaseValidationRuleNode<'date'> {
  readonly kind: 'date';
  readonly format: string | null;
}

export interface MinValidationRuleNode extends BaseValidationRuleNode<'min'> {
  readonly kind: 'min';
  readonly value: number;
}

export interface MaxValidationRuleNode extends BaseValidationRuleNode<'max'> {
  readonly kind: 'max';
  readonly value: number;
}

export interface BetweenValidationRuleNode extends BaseValidationRuleNode<'between'> {
  readonly kind: 'between';
  readonly min: number;
  readonly max: number;
}

export interface InValidationRuleNode extends BaseValidationRuleNode<'in'> {
  readonly kind: 'in';
  readonly values: readonly (string | number)[];
}

export interface ExistsValidationRuleNode extends BaseValidationRuleNode<'exists'> {
  readonly kind: 'exists';
  readonly table: string;
  readonly column: string | null;
}

export interface UniqueValidationRuleNode extends BaseValidationRuleNode<'unique'> {
  readonly kind: 'unique';
  readonly table: string;
  readonly column: string | null;
}

export interface FileValidationRuleNode extends BaseValidationRuleNode<'file'> {
  readonly kind: 'file';
}

export interface ImageValidationRuleNode extends BaseValidationRuleNode<'image'> {
  readonly kind: 'image';
}

export interface CustomValidationRuleNode extends BaseValidationRuleNode<'custom'> {
  readonly kind: 'custom';
  readonly rule: string;
  readonly parameters: readonly string[];
}

export type ValidationRuleNode =
  | RequiredValidationRuleNode
  | NullableValidationRuleNode
  | OptionalValidationRuleNode
  | StringValidationRuleNode
  | NumberValidationRuleNode
  | BooleanValidationRuleNode
  | ArrayValidationRuleNode
  | EmailValidationRuleNode
  | UrlValidationRuleNode
  | UuidValidationRuleNode
  | DateValidationRuleNode
  | MinValidationRuleNode
  | MaxValidationRuleNode
  | BetweenValidationRuleNode
  | InValidationRuleNode
  | ExistsValidationRuleNode
  | UniqueValidationRuleNode
  | FileValidationRuleNode
  | ImageValidationRuleNode
  | CustomValidationRuleNode;

export type AnyValidationRuleNode = ValidationRuleNode;

export type ValidationRuleCategory =
  | 'modifier'
  | 'type'
  | 'format'
  | 'constraint'
  | 'database'
  | 'custom';

export interface ValidationRuleSpecification<K extends ValidationRuleKind = ValidationRuleKind> {
  readonly kind: K;
  readonly category: ValidationRuleCategory;
  readonly isTypeAssertion: boolean;
  readonly isConstraint: boolean;
  readonly isModifier: boolean;
  readonly description: string;
}

export type ValidationRuleRegistry = {
  readonly [K in ValidationRuleKind]: ValidationRuleSpecification<K>;
};

export const VALIDATION_RULE_REGISTRY: ValidationRuleRegistry = Object.freeze({
  [ValidationRuleKind.Required]: {
    kind: ValidationRuleKind.Required,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field must be present and not empty'
  },
  [ValidationRuleKind.Nullable]: {
    kind: ValidationRuleKind.Nullable,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field may be null'
  },
  [ValidationRuleKind.Optional]: {
    kind: ValidationRuleKind.Optional,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field may be omitted/sometimes'
  },
  [ValidationRuleKind.String]: {
    kind: ValidationRuleKind.String,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be a string'
  },
  [ValidationRuleKind.Number]: {
    kind: ValidationRuleKind.Number,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be numeric'
  },
  [ValidationRuleKind.Boolean]: {
    kind: ValidationRuleKind.Boolean,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be a boolean'
  },
  [ValidationRuleKind.Array]: {
    kind: ValidationRuleKind.Array,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an array'
  },
  [ValidationRuleKind.Email]: {
    kind: ValidationRuleKind.Email,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be formatted as an e-mail address'
  },
  [ValidationRuleKind.Url]: {
    kind: ValidationRuleKind.Url,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be formatted as a valid URL'
  },
  [ValidationRuleKind.Uuid]: {
    kind: ValidationRuleKind.Uuid,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be a valid UUID'
  },
  [ValidationRuleKind.Date]: {
    kind: ValidationRuleKind.Date,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be a valid date'
  },
  [ValidationRuleKind.Min]: {
    kind: ValidationRuleKind.Min,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must have minimum value or length'
  },
  [ValidationRuleKind.Max]: {
    kind: ValidationRuleKind.Max,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must have maximum value or length'
  },
  [ValidationRuleKind.Between]: {
    kind: ValidationRuleKind.Between,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be between min and max values'
  },
  [ValidationRuleKind.In]: {
    kind: ValidationRuleKind.In,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be included in given list of values'
  },
  [ValidationRuleKind.Exists]: {
    kind: ValidationRuleKind.Exists,
    category: 'database',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must exist in specified database table'
  },
  [ValidationRuleKind.Unique]: {
    kind: ValidationRuleKind.Unique,
    category: 'database',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be unique in specified database table'
  },
  [ValidationRuleKind.File]: {
    kind: ValidationRuleKind.File,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an uploaded file'
  },
  [ValidationRuleKind.Image]: {
    kind: ValidationRuleKind.Image,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an uploaded image file'
  },
  [ValidationRuleKind.Custom]: {
    kind: ValidationRuleKind.Custom,
    category: 'custom',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: false,
    description: 'Custom or unhandled Laravel validation rule'
  }
});

export type ValidationRuleVisitor<R> = {
  readonly required: (rule: RequiredValidationRuleNode) => R;
  readonly nullable: (rule: NullableValidationRuleNode) => R;
  readonly optional: (rule: OptionalValidationRuleNode) => R;
  readonly string: (rule: StringValidationRuleNode) => R;
  readonly number: (rule: NumberValidationRuleNode) => R;
  readonly boolean: (rule: BooleanValidationRuleNode) => R;
  readonly array: (rule: ArrayValidationRuleNode) => R;
  readonly email: (rule: EmailValidationRuleNode) => R;
  readonly url: (rule: UrlValidationRuleNode) => R;
  readonly uuid: (rule: UuidValidationRuleNode) => R;
  readonly date: (rule: DateValidationRuleNode) => R;
  readonly min: (rule: MinValidationRuleNode) => R;
  readonly max: (rule: MaxValidationRuleNode) => R;
  readonly between: (rule: BetweenValidationRuleNode) => R;
  readonly in: (rule: InValidationRuleNode) => R;
  readonly exists: (rule: ExistsValidationRuleNode) => R;
  readonly unique: (rule: UniqueValidationRuleNode) => R;
  readonly file: (rule: FileValidationRuleNode) => R;
  readonly image: (rule: ImageValidationRuleNode) => R;
  readonly custom: (rule: CustomValidationRuleNode) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ValidationRuleNode dengan exhaustive type safety
 */
export function matchValidationRule<R>(
  rule: ValidationRuleNode,
  visitor: ValidationRuleVisitor<R>
): R {
  return visitor[rule.kind](rule as any);
}

export const matchRule = matchValidationRule;

/**
 * ValidationRuleNodeFactory
 *
 * Canonical Reusable Factory for Structured ValidationRuleNode AST.
 */
export class ValidationRuleNodeFactory {
  public static required(): RequiredValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Required });
  }
  public static nullable(): NullableValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Nullable });
  }
  public static optional(): OptionalValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Optional });
  }
  public static string(): StringValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.String });
  }
  public static number(): NumberValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Number });
  }
  public static boolean(): BooleanValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Boolean });
  }
  public static array(elementType: string | null = null): ArrayValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Array, elementType });
  }
  public static email(): EmailValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Email });
  }
  public static url(): UrlValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Url });
  }
  public static uuid(): UuidValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Uuid });
  }
  public static date(format: string | null = null): DateValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Date, format });
  }
  public static min(value: number): MinValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Min, value });
  }
  public static max(value: number): MaxValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Max, value });
  }
  public static between(min: number, max: number): BetweenValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Between, min, max });
  }
  public static in(values: readonly (string | number)[]): InValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.In, values: Object.freeze([...values]) });
  }
  public static exists(table: string, column: string | null = null): ExistsValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Exists, table, column });
  }
  public static unique(table: string, column: string | null = null): UniqueValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Unique, table, column });
  }
  public static file(): FileValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.File });
  }
  public static image(): ImageValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Image });
  }
  public static custom(rule: string, parameters: readonly string[] = []): CustomValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Custom, rule, parameters: Object.freeze([...parameters]) });
  }
}

/**
 * ValidationRuleParser
 *
 * Pure Deterministic AST Parser for Laravel Validation Rule Strings.
 * Transforms raw Laravel rule strings into strongly-typed ValidationRuleNode AST.
 */
export class ValidationRuleParser {
  public static parse(ruleStr: string): ValidationRuleNode {
    const trimmed = (ruleStr || '').trim();
    const colonIdx = trimmed.indexOf(':');
    const name = (colonIdx === -1 ? trimmed : trimmed.slice(0, colonIdx)).toLowerCase();
    const paramStr = colonIdx === -1 ? '' : trimmed.slice(colonIdx + 1);
    const params = paramStr ? paramStr.split(',').map(s => s.trim()) : [];

    switch (name) {
      case 'required':
        return ValidationRuleNodeFactory.required();
      case 'nullable':
        return ValidationRuleNodeFactory.nullable();
      case 'sometimes':
      case 'optional':
        return ValidationRuleNodeFactory.optional();
      case 'string':
        return ValidationRuleNodeFactory.string();
      case 'integer':
      case 'int':
      case 'numeric':
      case 'digits':
        return ValidationRuleNodeFactory.number();
      case 'boolean':
      case 'bool':
        return ValidationRuleNodeFactory.boolean();
      case 'array':
        return ValidationRuleNodeFactory.array();
      case 'email':
        return ValidationRuleNodeFactory.email();
      case 'url':
        return ValidationRuleNodeFactory.url();
      case 'uuid':
        return ValidationRuleNodeFactory.uuid();
      case 'date':
      case 'datetime':
      case 'timestamp':
        return ValidationRuleNodeFactory.date(params[0] ?? null);
      case 'min':
        return ValidationRuleNodeFactory.min(Number(params[0]) || 0);
      case 'max':
        return ValidationRuleNodeFactory.max(Number(params[0]) || 0);
      case 'between':
        return ValidationRuleNodeFactory.between(Number(params[0]) || 0, Number(params[1]) || 0);
      case 'in':
        return ValidationRuleNodeFactory.in(params);
      case 'exists':
        return ValidationRuleNodeFactory.exists(params[0] || '', params[1] ?? null);
      case 'unique':
        return ValidationRuleNodeFactory.unique(params[0] || '', params[1] ?? null);
      case 'file':
        return ValidationRuleNodeFactory.file();
      case 'image':
        return ValidationRuleNodeFactory.image();
      default:
        return ValidationRuleNodeFactory.custom(name, params);
    }
  }

  public static parseAll(rules: readonly (string | ValidationRuleNode)[]): readonly ValidationRuleNode[] {
    return Object.freeze(
      rules.map(r => typeof r === 'string' ? this.parse(r) : r)
    );
  }

  /**
   * Directly lowers ValidationRuleNode AST to Zod schema string expression.
   * Pure deterministic compiler method (0 regex, 0 string matching, 0 if).
   */
  public static toZodExpression(rules: readonly ValidationRuleNode[]): string {
    const isRequired = rules.some(r => r.kind === ValidationRuleKind.Required);
    const hasOptional = rules.some(r => r.kind === ValidationRuleKind.Optional);
    const initialNode: ZodNode = { expression: 'z.string()' };
    let finalNode = ZodSchemaReducer.reduceConstraints(initialNode, rules);
    if (!isRequired && !hasOptional) {
      finalNode = { expression: `${finalNode.expression}.optional()` };
    }
    return finalNode.expression;
  }
}

export interface ZodNode {
  readonly expression: string;
}

/**
 * Ekstrak node spesifik berdasarkan kind dari discriminated union.
 */
export type ExtractRule<K extends ValidationRuleKind> = Extract<
  ValidationRuleNode,
  { readonly kind: K }
>;

/**
 * Handler strictly-typed: parameter constraint DIJAMIN cocok dengan K (0 any).
 */
export type ConstraintHandler<K extends ValidationRuleKind> = (
  base: ZodNode,
  constraint: ExtractRule<K>
) => ZodNode;

/**
 * Registry Mapped Type: Semua key K terpetakan ke handler yang eksak.
 */
export type ConstraintRegistry = {
  readonly [K in ValidationRuleKind]: ConstraintHandler<K>;
};

export const ZOD_CONSTRAINT_REGISTRY: ConstraintRegistry = Object.freeze({
  [ValidationRuleKind.Min]: (base, c) => ({
    expression: `${base.expression}.min(${c.value})`
  }),
  [ValidationRuleKind.Max]: (base, c) => ({
    expression: `${base.expression}.max(${c.value})`
  }),
  [ValidationRuleKind.In]: (base, c) => ({
    expression: `z.enum([${c.values.map(v => JSON.stringify(v)).join(', ')}])`
  }),
  [ValidationRuleKind.Between]: (base, c) => ({
    expression: `${base.expression}.min(${c.min}).max(${c.max})`
  }),
  [ValidationRuleKind.Email]: (base) => ({
    expression: `${base.expression}.email()`
  }),
  [ValidationRuleKind.Url]: (base) => ({
    expression: `${base.expression}.url()`
  }),
  [ValidationRuleKind.Uuid]: (base) => ({
    expression: `${base.expression}.uuid()`
  }),
  [ValidationRuleKind.Nullable]: (base) => ({
    expression: `${base.expression}.nullable()`
  }),
  [ValidationRuleKind.Optional]: (base) => ({
    expression: `${base.expression}.optional()`
  }),
  [ValidationRuleKind.Number]: () => ({
    expression: 'z.number()'
  }),
  [ValidationRuleKind.Boolean]: () => ({
    expression: 'z.boolean()'
  }),
  [ValidationRuleKind.Array]: () => ({
    expression: 'z.array(z.unknown())'
  }),
  [ValidationRuleKind.String]: () => ({
    expression: 'z.string()'
  }),
  [ValidationRuleKind.Date]: (base) => ({
    expression: `${base.expression}.datetime()`
  }),
  [ValidationRuleKind.File]: () => ({
    expression: 'z.instanceof(File)'
  }),
  [ValidationRuleKind.Image]: () => ({
    expression: 'z.instanceof(File)'
  }),
  [ValidationRuleKind.Required]: (base) => base,
  [ValidationRuleKind.Exists]: (base) => base,
  [ValidationRuleKind.Unique]: (base) => base,
  [ValidationRuleKind.Custom]: (base) => base
});

export class ZodSchemaReducer {
  public static reduceConstraints(
    initialNode: ZodNode,
    constraints: readonly ValidationRuleNode[]
  ): ZodNode {
    return constraints.reduce<ZodNode>((base, constraint) => {
      const handler = ZOD_CONSTRAINT_REGISTRY[constraint.kind] as (
        b: ZodNode,
        c: ValidationRuleNode
      ) => ZodNode;
      return handler(base, constraint);
    }, initialNode);
  }
}

/**
 * First-Class Route Validation Rule Entry (Ordered & Guaranteed Complete Model).
 * Pure JSON-serializable AST node: 0 loose strings, 0 split('|'), 0 typeof checks in downstream.
 */
export interface RouteValidationRuleEntry {
  readonly fieldName: string;
  readonly propertyName: string;
  readonly ast: readonly ValidationRuleNode[];
  readonly rules: readonly string[];
}

/**
 * First-Class Route Custom Error Message Entry.
 */
export interface RouteMessageEntry {
  readonly ruleKey: string;
  readonly message: string;
}

/**
 * First-Class Route Custom Attribute Name Entry.
 */
export interface RouteAttributeEntry {
  readonly fieldName: string;
  readonly label: string;
}

/**
 * Pure Ordered Validation Schema Payload (0 Record, 0 Object.entries).
 */
export interface RouteSchemaPayload {
  readonly rules: readonly RouteValidationRuleEntry[];
  readonly messages: readonly RouteMessageEntry[];
  readonly attributes: readonly RouteAttributeEntry[];
}

/**
 * Canonical Domain Vocabulary for HTTP Methods.
 */
export const HttpMethod = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const);

export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];

/**
 * Canonical Domain Vocabulary for Route Action Kinds.
 */
export const RouteActionKind = Object.freeze({
  Create: 'create',
  Update: 'update',
  Read: 'read',
  Delete: 'delete'
} as const);

export type RouteActionKind = typeof RouteActionKind[keyof typeof RouteActionKind];

export interface HttpMethodSpecification<M extends HttpMethod = HttpMethod> {
  readonly method: M;
  readonly actionKind: RouteActionKind;
  readonly isMutating: boolean;
  readonly isSafe: boolean;
  readonly isIdempotent: boolean;
  readonly hasBody: boolean;
  readonly defaultCrudRole: CrudRole;
  readonly description: string;
}

export type HttpMethodRegistry = {
  readonly [K in HttpMethod]: HttpMethodSpecification<K>;
};

export const HTTP_METHOD_REGISTRY: HttpMethodRegistry = Object.freeze({
  [HttpMethod.GET]: {
    method: HttpMethod.GET,
    actionKind: RouteActionKind.Read,
    isMutating: false,
    isSafe: true,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'show',
    description: 'Safe, idempotent retrieval of resources'
  },
  [HttpMethod.POST]: {
    method: HttpMethod.POST,
    actionKind: RouteActionKind.Create,
    isMutating: true,
    isSafe: false,
    isIdempotent: false,
    hasBody: true,
    defaultCrudRole: 'create',
    description: 'Non-idempotent resource creation or action execution'
  },
  [HttpMethod.PUT]: {
    method: HttpMethod.PUT,
    actionKind: RouteActionKind.Update,
    isMutating: true,
    isSafe: false,
    isIdempotent: true,
    hasBody: true,
    defaultCrudRole: 'update',
    description: 'Idempotent complete replacement/update of a resource'
  },
  [HttpMethod.PATCH]: {
    method: HttpMethod.PATCH,
    actionKind: RouteActionKind.Update,
    isMutating: true,
    isSafe: false,
    isIdempotent: false,
    hasBody: true,
    defaultCrudRole: 'update',
    description: 'Partial modification/update of a resource'
  },
  [HttpMethod.DELETE]: {
    method: HttpMethod.DELETE,
    actionKind: RouteActionKind.Delete,
    isMutating: true,
    isSafe: false,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'delete',
    description: 'Idempotent removal of a resource'
  },
  [HttpMethod.OPTIONS]: {
    method: HttpMethod.OPTIONS,
    actionKind: RouteActionKind.Read,
    isMutating: false,
    isSafe: true,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'show',
    description: 'Describes the communication options for the target resource'
  },
  [HttpMethod.HEAD]: {
    method: HttpMethod.HEAD,
    actionKind: RouteActionKind.Read,
    isMutating: false,
    isSafe: true,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'show',
    description: 'Same as GET but returns headers only without response body'
  }
});

export type HttpMethodVisitor<R> = {
  readonly GET: (spec: HttpMethodSpecification<'GET'>) => R;
  readonly POST: (spec: HttpMethodSpecification<'POST'>) => R;
  readonly PUT: (spec: HttpMethodSpecification<'PUT'>) => R;
  readonly PATCH: (spec: HttpMethodSpecification<'PATCH'>) => R;
  readonly DELETE: (spec: HttpMethodSpecification<'DELETE'>) => R;
  readonly OPTIONS: (spec: HttpMethodSpecification<'OPTIONS'>) => R;
  readonly HEAD: (spec: HttpMethodSpecification<'HEAD'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik HttpMethod dengan exhaustive type safety
 */
export function matchHttpMethod<R>(
  methodOrRoute: HttpMethod | { readonly method: HttpMethod } | string,
  visitor: HttpMethodVisitor<R>
): R {
  const raw = typeof methodOrRoute === 'string' ? methodOrRoute : methodOrRoute.method;
  const upper = raw.toUpperCase() as HttpMethod;
  const spec = HTTP_METHOD_REGISTRY[upper] ?? HTTP_METHOD_REGISTRY.GET;
  return visitor[spec.method](spec as any);
}

export interface RouteActionKindSpecification<A extends RouteActionKind = RouteActionKind> {
  readonly actionKind: A;
  readonly isMutating: boolean;
  readonly defaultMethod: HttpMethod;
  readonly defaultCrudRole: CrudRole;
  readonly description: string;
}

export type RouteActionKindRegistry = {
  readonly [K in RouteActionKind]: RouteActionKindSpecification<K>;
};

export const ROUTE_ACTION_KIND_REGISTRY: RouteActionKindRegistry = Object.freeze({
  [RouteActionKind.Create]: {
    actionKind: RouteActionKind.Create,
    isMutating: true,
    defaultMethod: HttpMethod.POST,
    defaultCrudRole: 'create',
    description: 'Creation of a new entity or resource'
  },
  [RouteActionKind.Update]: {
    actionKind: RouteActionKind.Update,
    isMutating: true,
    defaultMethod: HttpMethod.PUT,
    defaultCrudRole: 'update',
    description: 'Modification or mutation of an existing entity'
  },
  [RouteActionKind.Read]: {
    actionKind: RouteActionKind.Read,
    isMutating: false,
    defaultMethod: HttpMethod.GET,
    defaultCrudRole: 'show',
    description: 'Retrieval or query of an entity or collection'
  },
  [RouteActionKind.Delete]: {
    actionKind: RouteActionKind.Delete,
    isMutating: true,
    defaultMethod: HttpMethod.DELETE,
    defaultCrudRole: 'delete',
    description: 'Deletion or destruction of an entity'
  }
});

export type RouteActionKindVisitor<R> = {
  readonly create: (spec: RouteActionKindSpecification<'create'>) => R;
  readonly update: (spec: RouteActionKindSpecification<'update'>) => R;
  readonly read: (spec: RouteActionKindSpecification<'read'>) => R;
  readonly delete: (spec: RouteActionKindSpecification<'delete'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik RouteActionKind dengan exhaustive type safety
 */
export function matchRouteActionKind<R>(
  kindOrAction: RouteActionKind | { readonly actionKind: RouteActionKind },
  visitor: RouteActionKindVisitor<R>
): R {
  const kind = typeof kindOrAction === 'string' ? kindOrAction : kindOrAction.actionKind;
  const spec = ROUTE_ACTION_KIND_REGISTRY[kind];
  return visitor[kind](spec as any);
}


/**
 * Canonical Domain Vocabulary for Route Authentication Schemes.
 */
export const SecuritySchemeKind = Object.freeze({
  Sanctum: 'sanctum',
  Bearer: 'bearer',
  Cookie: 'cookie',
  Public: 'public'
} as const);

export type SecuritySchemeKind = typeof SecuritySchemeKind[keyof typeof SecuritySchemeKind];

/**
 * First-Class Route Security & Authentication Descriptor (Guaranteed Complete Model).
 * Eliminates downstream middleware.some(m => m.startsWith('auth')).
 */
export interface RouteSecurityDescriptor {
  readonly isProtected: boolean;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly string[];
  readonly abilities: readonly string[]; // ✅ Dedicated Sanctum/Passport Abilities SSOT
}

export interface ScannedRouteSecurityParams {
  readonly isProtected: boolean;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly string[];
  readonly abilities: readonly string[];
}

/**
 * Reusable Constructor: Scanned Route Security Descriptor.
 */
export class ScannedRouteSecurityDescriptor implements RouteSecurityDescriptor {
  public readonly isProtected: boolean;
  public readonly scheme: SecuritySchemeKind;
  public readonly guards: readonly string[];
  public readonly abilities: readonly string[];

  constructor(params: ScannedRouteSecurityParams) {
    this.isProtected = params.isProtected;
    this.scheme = params.scheme;
    this.guards = Object.freeze([...params.guards]);
    this.abilities = Object.freeze([...params.abilities]);
    Object.freeze(this);
  }

  public static create({
    isProtected = false,
    scheme = SecuritySchemeKind.Public,
    guards = [],
    abilities = []
  }: {
    readonly isProtected?: boolean;
    readonly scheme?: SecuritySchemeKind;
    readonly guards?: readonly string[];
    readonly abilities?: readonly string[];
  } = {}): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected,
      scheme,
      guards,
      abilities
    });
  }

  public static public(): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected: false,
      scheme: SecuritySchemeKind.Public,
      guards: [],
      abilities: []
    });
  }

  public static protected(
    scheme: SecuritySchemeKind = SecuritySchemeKind.Bearer,
    guards: readonly string[] = [],
    abilities: readonly string[] = []
  ): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected: true,
      scheme,
      guards,
      abilities
    });
  }
}

export class RouteSecurityClassifier {
  public static classify(middleware: readonly string[]): RouteSecurityDescriptor {
    const guards: string[] = [];
    const abilities: string[] = [];
    let isProtected = false;
    let scheme: SecuritySchemeKind = SecuritySchemeKind.Public;

    for (const m of middleware) {
      const trimmed = m.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'auth:sanctum') {
        isProtected = true;
        scheme = SecuritySchemeKind.Sanctum;
        guards.push('sanctum');
      } else if (lower === 'auth:api' || lower === 'auth:bearer') {
        isProtected = true;
        scheme = SecuritySchemeKind.Bearer;
        guards.push('api');
      } else if (lower === 'auth' || lower.startsWith('auth:')) {
        isProtected = true;
        scheme = SecuritySchemeKind.Cookie;
        guards.push('web');
      } else if (lower.startsWith('ability:') || lower.startsWith('abilities:')) {
        const colonIdx = trimmed.indexOf(':');
        const items = trimmed.slice(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean);
        abilities.push(...items);
      }
    }

    return new ScannedRouteSecurityDescriptor({
      isProtected,
      scheme,
      guards,
      abilities
    });
  }
}

export interface SecuritySchemeSpecification<K extends SecuritySchemeKind = SecuritySchemeKind> {
  readonly scheme: K;
  readonly isProtected: boolean;
  readonly requiresAuthorizationHeader: boolean;
  readonly defaultHeaderName: string | null;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SecuritySchemeKind.
 */
export type SecuritySchemeRegistry = {
  readonly [K in SecuritySchemeKind]: SecuritySchemeSpecification<K>;
};

export const SECURITY_SCHEME_REGISTRY: SecuritySchemeRegistry = Object.freeze({
  [SecuritySchemeKind.Sanctum]: {
    scheme: SecuritySchemeKind.Sanctum,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: 'Authorization',
  },
  [SecuritySchemeKind.Bearer]: {
    scheme: SecuritySchemeKind.Bearer,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: 'Authorization',
  },
  [SecuritySchemeKind.Cookie]: {
    scheme: SecuritySchemeKind.Cookie,
    isProtected: true,
    requiresAuthorizationHeader: false,
    defaultHeaderName: null,
  },
  [SecuritySchemeKind.Public]: {
    scheme: SecuritySchemeKind.Public,
    isProtected: false,
    requiresAuthorizationHeader: false,
    defaultHeaderName: null,
  },
});

export interface RouteSecurityVisitor<R> {
  readonly sanctum: (security: RouteSecurityDescriptor) => R;
  readonly bearer: (security: RouteSecurityDescriptor) => R;
  readonly cookie: (security: RouteSecurityDescriptor) => R;
  readonly public: (security: RouteSecurityDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik skema keamanan RouteSecurityDescriptor dengan exhaustive type safety
 */
export function matchRouteSecurity<R>(
  security: RouteSecurityDescriptor,
  visitor: RouteSecurityVisitor<R>
): R {
  return visitor[security.scheme](security);
}

/**
 * HttpStatusCode
 *
 * Canonical Domain Vocabulary for Standard HTTP Status Codes.
 */
export const HttpStatusCode = Object.freeze({
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  Conflict: 409,
  UnprocessableEntity: 422,
  TooManyRequests: 429,
  InternalServerError: 500
} as const);

export type HttpStatusCode = typeof HttpStatusCode[keyof typeof HttpStatusCode] | number;

export type KnownHttpStatusCode = typeof HttpStatusCode[keyof typeof HttpStatusCode];

export type HttpStatusCodeCategory = 'informational' | 'success' | 'redirection' | 'client_error' | 'server_error';

export interface HttpStatusCodeSpecification<C extends number = number> {
  readonly code: C;
  readonly name: string;
  readonly category: HttpStatusCodeCategory;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly isClientError: boolean;
  readonly isServerError: boolean;
  readonly hasResponseBody: boolean;
  readonly statusText: string;
  readonly description: string;
}

export type HttpStatusCodeRegistry = {
  readonly [K in KnownHttpStatusCode]: HttpStatusCodeSpecification<K>;
};

export const HTTP_STATUS_CODE_REGISTRY: HttpStatusCodeRegistry = Object.freeze({
  [HttpStatusCode.Ok]: {
    code: HttpStatusCode.Ok,
    name: 'Ok',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'OK',
    description: 'Standard successful HTTP response'
  },
  [HttpStatusCode.Created]: {
    code: HttpStatusCode.Created,
    name: 'Created',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Created',
    description: 'Resource successfully created'
  },
  [HttpStatusCode.Accepted]: {
    code: HttpStatusCode.Accepted,
    name: 'Accepted',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Accepted',
    description: 'Request accepted for processing but processing has not completed'
  },
  [HttpStatusCode.NoContent]: {
    code: HttpStatusCode.NoContent,
    name: 'NoContent',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: false,
    statusText: 'No Content',
    description: 'Request successfully processed, no payload content returned'
  },
  [HttpStatusCode.BadRequest]: {
    code: HttpStatusCode.BadRequest,
    name: 'BadRequest',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Bad Request',
    description: 'Server could not understand the request due to invalid syntax'
  },
  [HttpStatusCode.Unauthorized]: {
    code: HttpStatusCode.Unauthorized,
    name: 'Unauthorized',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Unauthorized',
    description: 'Authentication is required and has failed or has not been provided'
  },
  [HttpStatusCode.Forbidden]: {
    code: HttpStatusCode.Forbidden,
    name: 'Forbidden',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Forbidden',
    description: 'Client does not have access rights to the content'
  },
  [HttpStatusCode.NotFound]: {
    code: HttpStatusCode.NotFound,
    name: 'NotFound',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Not Found',
    description: 'Server cannot find the requested resource'
  },
  [HttpStatusCode.MethodNotAllowed]: {
    code: HttpStatusCode.MethodNotAllowed,
    name: 'MethodNotAllowed',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Method Not Allowed',
    description: 'Request HTTP method is not supported for the target resource'
  },
  [HttpStatusCode.Conflict]: {
    code: HttpStatusCode.Conflict,
    name: 'Conflict',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Conflict',
    description: 'Request conflicts with the current state of the server'
  },
  [HttpStatusCode.UnprocessableEntity]: {
    code: HttpStatusCode.UnprocessableEntity,
    name: 'UnprocessableEntity',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Unprocessable Entity',
    description: 'Request was well-formed but was unable to be followed due to semantic errors (Laravel validation failure)'
  },
  [HttpStatusCode.TooManyRequests]: {
    code: HttpStatusCode.TooManyRequests,
    name: 'TooManyRequests',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Too Many Requests',
    description: 'User has sent too many requests in a given amount of time (rate limited)'
  },
  [HttpStatusCode.InternalServerError]: {
    code: HttpStatusCode.InternalServerError,
    name: 'InternalServerError',
    category: 'server_error',
    isSuccess: false,
    isError: true,
    isClientError: false,
    isServerError: true,
    hasResponseBody: true,
    statusText: 'Internal Server Error',
    description: 'Server encountered an unexpected condition that prevented it from fulfilling the request'
  }
});

export type HttpStatusCodeVisitor<R> = {
  readonly 200: (spec: HttpStatusCodeSpecification<200>) => R;
  readonly 201: (spec: HttpStatusCodeSpecification<201>) => R;
  readonly 202: (spec: HttpStatusCodeSpecification<202>) => R;
  readonly 204: (spec: HttpStatusCodeSpecification<204>) => R;
  readonly 400: (spec: HttpStatusCodeSpecification<400>) => R;
  readonly 401: (spec: HttpStatusCodeSpecification<401>) => R;
  readonly 403: (spec: HttpStatusCodeSpecification<403>) => R;
  readonly 404: (spec: HttpStatusCodeSpecification<404>) => R;
  readonly 405: (spec: HttpStatusCodeSpecification<405>) => R;
  readonly 409: (spec: HttpStatusCodeSpecification<409>) => R;
  readonly 422: (spec: HttpStatusCodeSpecification<422>) => R;
  readonly 429: (spec: HttpStatusCodeSpecification<429>) => R;
  readonly 500: (spec: HttpStatusCodeSpecification<500>) => R;
  readonly other?: (code: number) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik HttpStatusCode dengan exhaustive type safety
 */
export function matchHttpStatusCode<R>(
  codeOrObject: number | { readonly status: number } | { readonly statusCode: number },
  visitor: HttpStatusCodeVisitor<R>
): R {
  const code: number = typeof codeOrObject === 'number'
    ? codeOrObject
    : 'status' in codeOrObject
      ? codeOrObject.status
      : (codeOrObject as any).statusCode;

  const handler = (visitor as any)[code];
  if (handler) {
    const spec = (HTTP_STATUS_CODE_REGISTRY as any)[code];
    return handler(spec);
  }
  if (visitor.other) {
    return visitor.other(code);
  }
  throw new Error(`Unhandled HttpStatusCode: ${code}`);
}


/**
 * RateLimitDescriptor
 *
 * Explicit Domain Model for Laravel Route Rate Limiting (throttle middleware).
 */
export interface RateLimitDescriptor {
  readonly maxAttempts: number;
  readonly decayMinutes: number;
}

/**
 * RequestContentType
 *
 * Canonical Domain Vocabulary for HTTP Request Payloads.
 */
export const RequestContentType = Object.freeze({
  Json: 'application/json',
  Multipart: 'multipart/form-data',
  UrlEncoded: 'application/x-www-form-urlencoded',
  None: 'none'
} as const);

export type RequestContentType = typeof RequestContentType[keyof typeof RequestContentType];

export interface BaseRequestContentTypeDescriptor {
  readonly kind: RequestContentType;
  readonly mimeType: string | null;
  readonly isBinary: boolean;
  readonly hasPayload: boolean;
}

export interface JsonRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'application/json';
  readonly mimeType: 'application/json';
  readonly isBinary: false;
  readonly hasPayload: true;
}

export interface MultipartRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'multipart/form-data';
  readonly mimeType: 'multipart/form-data';
  readonly isBinary: true;
  readonly hasPayload: true;
}

export interface UrlEncodedRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'application/x-www-form-urlencoded';
  readonly mimeType: 'application/x-www-form-urlencoded';
  readonly isBinary: false;
  readonly hasPayload: true;
}

export interface NoneRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'none';
  readonly mimeType: null;
  readonly isBinary: false;
  readonly hasPayload: false;
}

export type RequestContentTypeDescriptor =
  | JsonRequestContentTypeDescriptor
  | MultipartRequestContentTypeDescriptor
  | UrlEncodedRequestContentTypeDescriptor
  | NoneRequestContentTypeDescriptor;

export interface RequestContentTypeSpecification<K extends RequestContentType = RequestContentType> {
  readonly kind: K;
  readonly mimeType: string | null;
  readonly isBinary: boolean;
  readonly hasPayload: boolean;
  readonly headerExpression: string | null;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key RequestContentType.
 */
export type RequestContentTypeRegistry = {
  readonly [K in RequestContentType]: RequestContentTypeSpecification<K>;
};

export const REQUEST_CONTENT_TYPE_REGISTRY: RequestContentTypeRegistry = Object.freeze({
  [RequestContentType.Json]: {
    kind: RequestContentType.Json,
    mimeType: 'application/json',
    isBinary: false,
    hasPayload: true,
    headerExpression: "'Content-Type': 'application/json'"
  },
  [RequestContentType.Multipart]: {
    kind: RequestContentType.Multipart,
    mimeType: 'multipart/form-data',
    isBinary: true,
    hasPayload: true,
    headerExpression: "'Content-Type': 'multipart/form-data'"
  },
  [RequestContentType.UrlEncoded]: {
    kind: RequestContentType.UrlEncoded,
    mimeType: 'application/x-www-form-urlencoded',
    isBinary: false,
    hasPayload: true,
    headerExpression: "'Content-Type': 'application/x-www-form-urlencoded'"
  },
  [RequestContentType.None]: {
    kind: RequestContentType.None,
    mimeType: null,
    isBinary: false,
    hasPayload: false,
    headerExpression: null
  }
});

export class ScannedRequestContentTypeDescriptor implements BaseRequestContentTypeDescriptor {
  public readonly kind: RequestContentType;
  public readonly mimeType: string | null;
  public readonly isBinary: boolean;
  public readonly hasPayload: boolean;

  constructor(spec: RequestContentTypeSpecification) {
    this.kind = spec.kind;
    this.mimeType = spec.mimeType;
    this.isBinary = spec.isBinary;
    this.hasPayload = spec.hasPayload;
    Object.freeze(this);
  }

  public static json(): JsonRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.Json]
    ) as JsonRequestContentTypeDescriptor;
  }

  public static multipart(): MultipartRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.Multipart]
    ) as MultipartRequestContentTypeDescriptor;
  }

  public static urlEncoded(): UrlEncodedRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.UrlEncoded]
    ) as UrlEncodedRequestContentTypeDescriptor;
  }

  public static none(): NoneRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.None]
    ) as NoneRequestContentTypeDescriptor;
  }

  public static fromKind(kind: RequestContentType): RequestContentTypeDescriptor {
    const spec = REQUEST_CONTENT_TYPE_REGISTRY[kind] ?? REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.None];
    return new ScannedRequestContentTypeDescriptor(spec) as RequestContentTypeDescriptor;
  }
}

export interface RequestContentTypeVisitor<R> {
  readonly json: (desc: JsonRequestContentTypeDescriptor) => R;
  readonly multipart: (desc: MultipartRequestContentTypeDescriptor) => R;
  readonly urlEncoded: (desc: UrlEncodedRequestContentTypeDescriptor) => R;
  readonly none: (desc: NoneRequestContentTypeDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik RequestContentType dengan exhaustive type safety
 */
export function matchRequestContentType<R>(
  contentType: RequestContentType | RequestContentTypeDescriptor,
  visitor: RequestContentTypeVisitor<R>
): R {
  const kind: RequestContentType = typeof contentType === 'string' ? contentType : contentType.kind;
  const descriptor = ScannedRequestContentTypeDescriptor.fromKind(kind);
  const DISPATCH: Record<RequestContentType, (d: any) => R> = {
    [RequestContentType.Json]: visitor.json,
    [RequestContentType.Multipart]: visitor.multipart,
    [RequestContentType.UrlEncoded]: visitor.urlEncoded,
    [RequestContentType.None]: visitor.none
  };
  return DISPATCH[kind](descriptor);
}

export interface RouteQueryParameter {
  readonly name: string;
  readonly propertyName: string;
  readonly required: boolean;
  readonly type: RouteParameterType;
  readonly isArray: boolean;
  readonly default: unknown;
}

/**
 * Canonical Laravel Error Types (SSOT)
 */
export interface LaravelValidationError {
  readonly message: string;
  readonly errors: Record<string, readonly string[]>;
}

export interface LaravelUnauthorizedError {
  readonly message: string;
}

export interface LaravelForbiddenError {
  readonly message: string;
}

export interface LaravelNotFoundError {
  readonly message: string;
}

export interface LaravelServerError {
  readonly message: string;
}

/**
 * HttpErrorKind
 *
 * Canonical Domain Vocabulary for HTTP Error Response Categories.
 */
export const HttpErrorKind = Object.freeze({
  Validation: 'validation',
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  NotFound: 'notFound',
  ServerError: 'serverError',
  Custom: 'custom'
} as const);

export type HttpErrorKind = typeof HttpErrorKind[keyof typeof HttpErrorKind];

export interface HttpErrorKindSpecification<K extends HttpErrorKind = HttpErrorKind> {
  readonly kind: K;
  readonly defaultStatusCode: HttpStatusCode;
  readonly defaultName: string;
  readonly defaultTypeName: string;
  readonly isClientError: boolean;
  readonly isServerError: boolean;
}

export type HttpErrorKindRegistry = {
  readonly [K in HttpErrorKind]: HttpErrorKindSpecification<K>;
};

export const HTTP_ERROR_KIND_REGISTRY: HttpErrorKindRegistry = Object.freeze({
  [HttpErrorKind.Validation]: {
    kind: HttpErrorKind.Validation,
    defaultStatusCode: HttpStatusCode.UnprocessableEntity,
    defaultName: 'UnprocessableEntity',
    defaultTypeName: 'LaravelValidationError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Unauthorized]: {
    kind: HttpErrorKind.Unauthorized,
    defaultStatusCode: HttpStatusCode.Unauthorized,
    defaultName: 'Unauthorized',
    defaultTypeName: 'LaravelUnauthorizedError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Forbidden]: {
    kind: HttpErrorKind.Forbidden,
    defaultStatusCode: HttpStatusCode.Forbidden,
    defaultName: 'Forbidden',
    defaultTypeName: 'LaravelForbiddenError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.NotFound]: {
    kind: HttpErrorKind.NotFound,
    defaultStatusCode: HttpStatusCode.NotFound,
    defaultName: 'NotFound',
    defaultTypeName: 'LaravelNotFoundError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.ServerError]: {
    kind: HttpErrorKind.ServerError,
    defaultStatusCode: HttpStatusCode.InternalServerError,
    defaultName: 'InternalServerError',
    defaultTypeName: 'LaravelServerError',
    isClientError: false,
    isServerError: true
  },
  [HttpErrorKind.Custom]: {
    kind: HttpErrorKind.Custom,
    defaultStatusCode: HttpStatusCode.BadRequest,
    defaultName: 'BadRequest',
    defaultTypeName: 'LaravelError',
    isClientError: true,
    isServerError: false
  }
});

export interface HttpErrorVisitor<R> {
  readonly validation: (desc: HttpErrorResponseDescriptor) => R;
  readonly unauthorized: (desc: HttpErrorResponseDescriptor) => R;
  readonly forbidden: (desc: HttpErrorResponseDescriptor) => R;
  readonly notFound: (desc: HttpErrorResponseDescriptor) => R;
  readonly serverError: (desc: HttpErrorResponseDescriptor) => R;
  readonly custom: (desc: HttpErrorResponseDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian HttpErrorResponseDescriptor dengan exhaustive type safety
 */
export function matchHttpError<R>(
  error: HttpErrorResponseDescriptor | HttpErrorKind,
  visitor: HttpErrorVisitor<R>
): R {
  const isKindString = typeof error === 'string';
  const kind = isKindString ? error : (error.kind ?? HttpErrorKind.Custom);
  const descriptor: HttpErrorResponseDescriptor = isKindString
    ? {
        kind,
        statusCode: HTTP_ERROR_KIND_REGISTRY[kind].defaultStatusCode,
        name: HTTP_ERROR_KIND_REGISTRY[kind].defaultName,
        typeName: HTTP_ERROR_KIND_REGISTRY[kind].defaultTypeName,
        schema: Object.freeze({})
      }
    : error;
  return visitor[kind](descriptor);
}

export interface HttpErrorResponseDescriptor {
  readonly kind: HttpErrorKind;
  readonly statusCode: HttpStatusCode;
  readonly name: string;
  readonly typeName: string;
  readonly schema: Record<string, unknown>;
}

export interface ScalarValidationFieldNode {
  readonly kind: 'scalar';
  readonly fieldName: string;
  readonly propertyName: string;
  readonly rules: readonly ValidationRuleNode[];
}

export interface ArrayValidationFieldNode {
  readonly kind: 'array';
  readonly fieldName: string;
  readonly propertyName: string;
  readonly rules: readonly ValidationRuleNode[];
  readonly element: ValidationFieldNode;
}

export interface ObjectValidationFieldNode {
  readonly kind: 'object';
  readonly fieldName: string;
  readonly propertyName: string;
  readonly fields: readonly ValidationFieldNode[];
}

export type ValidationFieldNode =
  | ScalarValidationFieldNode
  | ArrayValidationFieldNode
  | ObjectValidationFieldNode;

/**
 * ValidationFieldKind
 *
 * Canonical Domain Vocabulary for Validation Tree Node Kinds.
 */
export const ValidationFieldKind = Object.freeze({
  Scalar: 'scalar',
  Array: 'array',
  Object: 'object'
} as const);

export type ValidationFieldKind = typeof ValidationFieldKind[keyof typeof ValidationFieldKind];

export interface ValidationFieldSpecification<K extends ValidationFieldKind = ValidationFieldKind> {
  readonly kind: K;
  readonly isContainer: boolean;
  readonly allowsChildren: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key ValidationFieldKind.
 */
export type ValidationFieldRegistry = {
  readonly [K in ValidationFieldKind]: ValidationFieldSpecification<K>;
};

export const VALIDATION_FIELD_REGISTRY: ValidationFieldRegistry = Object.freeze({
  [ValidationFieldKind.Scalar]: {
    kind: ValidationFieldKind.Scalar,
    isContainer: false,
    allowsChildren: false
  },
  [ValidationFieldKind.Array]: {
    kind: ValidationFieldKind.Array,
    isContainer: true,
    allowsChildren: true
  },
  [ValidationFieldKind.Object]: {
    kind: ValidationFieldKind.Object,
    isContainer: true,
    allowsChildren: true
  }
});

export interface ValidationFieldVisitor<R> {
  readonly scalar: (node: ScalarValidationFieldNode) => R;
  readonly array: (node: ArrayValidationFieldNode) => R;
  readonly object: (node: ObjectValidationFieldNode) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ValidationFieldNode dengan exhaustive type safety
 */
export function matchValidationField<R>(
  node: ValidationFieldNode,
  visitor: ValidationFieldVisitor<R>
): R {
  return visitor[node.kind](node as any);
}

export interface ValidationFieldFolder<R> {
  readonly scalar: (node: ScalarValidationFieldNode) => R;
  readonly array: (node: ArrayValidationFieldNode, foldedElement: R) => R;
  readonly object: (node: ObjectValidationFieldNode, foldedFields: readonly R[]) => R;
}

/**
 * 0 `if` Recursive Tree Fold: Mengakumulasi seluruh subtree ValidationFieldNode dari bawah ke atas secara fungsional murni
 */
export function foldValidationField<R>(
  node: ValidationFieldNode,
  folder: ValidationFieldFolder<R>
): R {
  const FOLD_DISPATCH: ValidationFieldVisitor<R> = {
    scalar: (s) => folder.scalar(s),
    array: (a) => folder.array(a, foldValidationField(a.element, folder)),
    object: (o) => folder.object(o, o.fields.map(child => foldValidationField(child, folder)))
  };
  return FOLD_DISPATCH[node.kind](node as any);
}

/**
 * CrudRole
 *
 * Canonical REST CRUD Role Vocabulary.
 */
export const CrudRole = Object.freeze({
  Index: 'index',
  Show: 'show',
  Create: 'create',
  Update: 'update',
  Delete: 'delete',
  Custom: 'custom'
} as const);

export type CrudRole = typeof CrudRole[keyof typeof CrudRole];

/**
 * RoutePolicyKind
 *
 * Canonical ADT discriminator for Laravel route authorization policies.
 */
export const RoutePolicyKind = Object.freeze({
  AbilityModel: 'ability_model',
  Gate: 'gate',
  Custom: 'custom'
} as const);

export type RoutePolicyKind = typeof RoutePolicyKind[keyof typeof RoutePolicyKind];

export interface RoutePolicyKindSpecification<K extends RoutePolicyKind = RoutePolicyKind> {
  readonly kind: K;
  readonly requiresModel: boolean;
  readonly description: string;
}

export type RoutePolicyKindRegistry = {
  readonly [K in RoutePolicyKind]: RoutePolicyKindSpecification<K>;
};

export const ROUTE_POLICY_REGISTRY: RoutePolicyKindRegistry = Object.freeze({
  [RoutePolicyKind.AbilityModel]: {
    kind: RoutePolicyKind.AbilityModel,
    requiresModel: true,
    description: 'Laravel Model Policy checking ability against a model parameter'
  },
  [RoutePolicyKind.Gate]: {
    kind: RoutePolicyKind.Gate,
    requiresModel: false,
    description: 'Laravel Gate authorization checking ability without model parameter'
  },
  [RoutePolicyKind.Custom]: {
    kind: RoutePolicyKind.Custom,
    requiresModel: false,
    description: 'Custom authorization policy or middleware rule'
  }
});

export interface RoutePolicyVisitor<R> {
  readonly ability_model: (desc: RoutePolicyDescriptor) => R;
  readonly gate: (desc: RoutePolicyDescriptor) => R;
  readonly custom: (desc: RoutePolicyDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian RoutePolicyDescriptor dengan exhaustive type safety
 */
export function matchRoutePolicy<R>(
  policy: RoutePolicyDescriptor | RoutePolicyKind,
  visitor: RoutePolicyVisitor<R>
): R {
  const isKindString = typeof policy === 'string';
  const kind = isKindString ? policy : (policy.kind ?? (policy.modelParameter ? RoutePolicyKind.AbilityModel : RoutePolicyKind.Gate));
  const descriptor: RoutePolicyDescriptor = isKindString
    ? {
        kind,
        ability: '',
        modelParameter: ROUTE_POLICY_REGISTRY[kind].requiresModel ? 'model' : null
      }
    : policy;
  return visitor[kind](descriptor);
}

/**
 * RoutePolicyDescriptor
 *
 * Explicit Domain Model for Laravel Route Authorization Policies.
 */
export interface RoutePolicyDescriptor {
  readonly kind: RoutePolicyKind;
  readonly ability: string;        // e.g. 'update', 'view'
  readonly modelParameter: string | null;// e.g. 'order'
}

/**
 * PageEndpointKind
 *
 * Canonical ADT discriminator for Page Route Endpoints.
 */
export const PageEndpointKind = Object.freeze({
  Static: 'static',
  Parameterized: 'parameterized',
  QueryFiltered: 'query_filtered'
} as const);

export type PageEndpointKind = typeof PageEndpointKind[keyof typeof PageEndpointKind];

export interface PageEndpointKindSpecification<K extends PageEndpointKind = PageEndpointKind> {
  readonly kind: K;
  readonly isCallable: boolean;
  readonly description: string;
}

export type PageEndpointKindRegistry = {
  readonly [K in PageEndpointKind]: PageEndpointKindSpecification<K>;
};

export const PAGE_ENDPOINT_REGISTRY: PageEndpointKindRegistry = Object.freeze({
  [PageEndpointKind.Static]: {
    kind: PageEndpointKind.Static,
    isCallable: false,
    description: 'Static page route without path or query parameters'
  },
  [PageEndpointKind.Parameterized]: {
    kind: PageEndpointKind.Parameterized,
    isCallable: true,
    description: 'Parameterized page route with required path parameters'
  },
  [PageEndpointKind.QueryFiltered]: {
    kind: PageEndpointKind.QueryFiltered,
    isCallable: true,
    description: 'Page route with optional query parameters and optional/required path parameters'
  }
});

export interface PageEndpointDescriptor {
  readonly kind: PageEndpointKind;
  readonly path: string;
  readonly query: readonly string[];
  readonly params: readonly string[];
}

export interface PageEndpointVisitor<R> {
  readonly static: (endpoint: PageEndpointDescriptor) => R;
  readonly parameterized: (endpoint: PageEndpointDescriptor) => R;
  readonly query_filtered: (endpoint: PageEndpointDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian PageEndpointDescriptor dengan exhaustive type safety
 */
export function matchPageEndpoint<R>(
  endpoint: PageEndpointDescriptor | PageEndpointKind,
  visitor: PageEndpointVisitor<R>
): R {
  const isKindString = typeof endpoint === 'string';
  const kind = isKindString ? endpoint : endpoint.kind;
  const descriptor: PageEndpointDescriptor = isKindString
    ? {
        kind,
        path: '/',
        query: kind === PageEndpointKind.QueryFiltered ? ['filter'] : [],
        params: kind === PageEndpointKind.Parameterized ? ['id'] : []
      }
    : endpoint;
  return visitor[kind](descriptor);
}

/**
 * BroadcastChannelDescriptor
 *
 * Explicit Domain Model for Laravel Broadcast Channels (routes/channels.php).
 */
export const BroadcastChannelKind = Object.freeze({
  Public: 'public',
  Private: 'private',
  Presence: 'presence'
} as const);

export type BroadcastChannelKind = typeof BroadcastChannelKind[keyof typeof BroadcastChannelKind];

export interface BroadcastChannelDescriptor {
  readonly name: string;
  readonly kind: BroadcastChannelKind;
  readonly pattern: string;
  readonly runtimePattern: string;
  readonly parameters: readonly RouteParameter[];
  readonly isPrivate: boolean;
  readonly isPresence: boolean;
}

export interface PublicBroadcastChannelDescriptor extends BroadcastChannelDescriptor {
  readonly kind: 'public';
  readonly isPrivate: false;
  readonly isPresence: false;
}

export interface PrivateBroadcastChannelDescriptor extends BroadcastChannelDescriptor {
  readonly kind: 'private';
  readonly isPrivate: true;
  readonly isPresence: false;
}

export interface PresenceBroadcastChannelDescriptor extends BroadcastChannelDescriptor {
  readonly kind: 'presence';
  readonly isPrivate: true;
  readonly isPresence: true;
}

export interface BroadcastChannelSpecification<K extends BroadcastChannelKind = BroadcastChannelKind> {
  readonly kind: K;
  readonly echoMethod: 'channel' | 'private' | 'join';
  readonly requiresAuth: boolean;
  readonly supportsPresenceData: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key BroadcastChannelKind.
 */
export type BroadcastChannelRegistry = {
  readonly [K in BroadcastChannelKind]: BroadcastChannelSpecification<K>;
};

export const BROADCAST_CHANNEL_REGISTRY: BroadcastChannelRegistry = Object.freeze({
  [BroadcastChannelKind.Public]: {
    kind: BroadcastChannelKind.Public,
    echoMethod: 'channel',
    requiresAuth: false,
    supportsPresenceData: false,
  },
  [BroadcastChannelKind.Private]: {
    kind: BroadcastChannelKind.Private,
    echoMethod: 'private',
    requiresAuth: true,
    supportsPresenceData: false,
  },
  [BroadcastChannelKind.Presence]: {
    kind: BroadcastChannelKind.Presence,
    echoMethod: 'join',
    requiresAuth: true,
    supportsPresenceData: true,
  },
});

export interface BroadcastChannelVisitor<R> {
  readonly public: (channel: PublicBroadcastChannelDescriptor) => R;
  readonly private: (channel: PrivateBroadcastChannelDescriptor) => R;
  readonly presence: (channel: PresenceBroadcastChannelDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian BroadcastChannelDescriptor dengan exhaustive type safety
 */
export function matchBroadcastChannel<R>(
  channel: BroadcastChannelDescriptor,
  visitor: BroadcastChannelVisitor<R>
): R {
  return visitor[channel.kind](channel as any);
}

// =========================================================================
// EXPLICIT COMPILER ENUMS & DOMAIN MODELS (SSOT ORIGIN BOUNDARY)
// =========================================================================

export const RouteHookKind = Object.freeze({
  Query: 'query',
  Mutation: 'mutation',
  InfiniteQuery: 'infinite_query'
} as const);
export type RouteHookKind = typeof RouteHookKind[keyof typeof RouteHookKind];

export interface BaseRouteHookDescriptor<K extends RouteHookKind = RouteHookKind> {
  readonly kind: K;
  readonly hookPrefix: string;          // 'use'
  readonly tanstackHookName: string;    // 'useQuery' | 'useMutation' | 'useInfiniteQuery'
  readonly isMutating: boolean;         // false | true | false
  readonly requiresQueryKey: boolean;   // true | false | true
  readonly supportsPagination: boolean; // false | false | true
}

export interface QueryHookDescriptor extends BaseRouteHookDescriptor<'query'> {
  readonly kind: 'query';
  readonly tanstackHookName: 'useQuery';
  readonly isMutating: false;
  readonly requiresQueryKey: true;
  readonly supportsPagination: false;
}

export interface MutationHookDescriptor extends BaseRouteHookDescriptor<'mutation'> {
  readonly kind: 'mutation';
  readonly tanstackHookName: 'useMutation';
  readonly isMutating: true;
  readonly requiresQueryKey: false;
  readonly supportsPagination: false;
}

export interface InfiniteQueryHookDescriptor extends BaseRouteHookDescriptor<'infinite_query'> {
  readonly kind: 'infinite_query';
  readonly tanstackHookName: 'useInfiniteQuery';
  readonly isMutating: false;
  readonly requiresQueryKey: true;
  readonly supportsPagination: true;
}

export type AnyRouteHookDescriptor =
  | QueryHookDescriptor
  | MutationHookDescriptor
  | InfiniteQueryHookDescriptor;

export type RouteHookDescriptor<K extends RouteHookKind = RouteHookKind> =
  K extends 'query' ? QueryHookDescriptor :
  K extends 'mutation' ? MutationHookDescriptor :
  K extends 'infinite_query' ? InfiniteQueryHookDescriptor :
  BaseRouteHookDescriptor<K>;

export interface HookKindSpecification<K extends RouteHookKind = RouteHookKind> {
  readonly kind: K;
  readonly hookPrefix: string;
  readonly tanstackHookName: string;
  readonly isMutating: boolean;
  readonly requiresQueryKey: boolean;
  readonly supportsPagination: boolean;
  readonly defaultOptionsTypeName: string;
}

export type HookKindRegistry = {
  readonly [K in RouteHookKind]: HookKindSpecification<K>;
};

export const HOOK_KIND_REGISTRY: HookKindRegistry = Object.freeze({
  [RouteHookKind.Query]: {
    kind: RouteHookKind.Query,
    hookPrefix: 'use',
    tanstackHookName: 'useQuery',
    isMutating: false,
    requiresQueryKey: true,
    supportsPagination: false,
    defaultOptionsTypeName: 'UseQueryOptions'
  },
  [RouteHookKind.Mutation]: {
    kind: RouteHookKind.Mutation,
    hookPrefix: 'use',
    tanstackHookName: 'useMutation',
    isMutating: true,
    requiresQueryKey: false,
    supportsPagination: false,
    defaultOptionsTypeName: 'UseMutationOptions'
  },
  [RouteHookKind.InfiniteQuery]: {
    kind: RouteHookKind.InfiniteQuery,
    hookPrefix: 'use',
    tanstackHookName: 'useInfiniteQuery',
    isMutating: false,
    requiresQueryKey: true,
    supportsPagination: true,
    defaultOptionsTypeName: 'UseInfiniteQueryOptions'
  }
});

export type RouteHookKindVisitor<R> = {
  readonly [K in RouteHookKind]: (spec: HookKindSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian RouteHookKind dengan exhaustive type safety
 */
export function matchRouteHookKind<R>(
  kind: RouteHookKind,
  visitor: RouteHookKindVisitor<R>
): R {
  const spec = HOOK_KIND_REGISTRY[kind] ?? HOOK_KIND_REGISTRY[RouteHookKind.Query];
  return visitor[kind](spec as any);
}

export const matchHookKind = matchRouteHookKind;

export class ScannedRouteHookDescriptor implements BaseRouteHookDescriptor {
  public readonly kind: RouteHookKind;
  public readonly hookPrefix: string;
  public readonly tanstackHookName: string;
  public readonly isMutating: boolean;
  public readonly requiresQueryKey: boolean;
  public readonly supportsPagination: boolean;

  constructor(kind: RouteHookKind = RouteHookKind.Query) {
    this.kind = kind;
    const spec = HOOK_KIND_REGISTRY[kind] ?? HOOK_KIND_REGISTRY[RouteHookKind.Query];
    this.hookPrefix = spec.hookPrefix;
    this.tanstackHookName = spec.tanstackHookName;
    this.isMutating = spec.isMutating;
    this.requiresQueryKey = spec.requiresQueryKey;
    this.supportsPagination = spec.supportsPagination;
    Object.freeze(this);
  }

  public static query(): QueryHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.Query) as unknown as QueryHookDescriptor;
  }

  public static mutation(): MutationHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.Mutation) as unknown as MutationHookDescriptor;
  }

  public static infiniteQuery(): InfiniteQueryHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.InfiniteQuery) as unknown as InfiniteQueryHookDescriptor;
  }

  public static fromKind(kind: RouteHookKind): ScannedRouteHookDescriptor {
    return new ScannedRouteHookDescriptor(kind);
  }
}

// =========================================================================
// CRUD ROLE ADT FLOW DATA & DOMAIN SPECIFICATION (SSOT)
// =========================================================================

export interface BaseCrudRoleDescriptor<R extends CrudRole = CrudRole> {
  readonly role: R;
  readonly isMutating: boolean;
  readonly isCollection: boolean;
  readonly isItem: boolean;
  readonly affectsSingleResource: boolean;
  readonly defaultActionName: string;
  readonly defaultHttpMethod: HttpMethod;
  readonly defaultHookKind: RouteHookKind;
  readonly defaultActionKind: RouteActionKind;
  readonly description: string;
}

export interface IndexCrudRoleDescriptor extends BaseCrudRoleDescriptor<'index'> {
  readonly role: 'index';
  readonly isMutating: false;
  readonly isCollection: true;
  readonly isItem: false;
  readonly affectsSingleResource: false;
  readonly defaultActionName: 'list';
  readonly defaultHttpMethod: typeof HttpMethod.GET;
  readonly defaultHookKind: typeof RouteHookKind.Query;
  readonly defaultActionKind: typeof RouteActionKind.Read;
}

export interface ShowCrudRoleDescriptor extends BaseCrudRoleDescriptor<'show'> {
  readonly role: 'show';
  readonly isMutating: false;
  readonly isCollection: false;
  readonly isItem: true;
  readonly affectsSingleResource: true;
  readonly defaultActionName: 'get';
  readonly defaultHttpMethod: typeof HttpMethod.GET;
  readonly defaultHookKind: typeof RouteHookKind.Query;
  readonly defaultActionKind: typeof RouteActionKind.Read;
}

export interface CreateCrudRoleDescriptor extends BaseCrudRoleDescriptor<'create'> {
  readonly role: 'create';
  readonly isMutating: true;
  readonly isCollection: false;
  readonly isItem: false;
  readonly affectsSingleResource: false;
  readonly defaultActionName: 'create';
  readonly defaultHttpMethod: typeof HttpMethod.POST;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Create;
}

export interface UpdateCrudRoleDescriptor extends BaseCrudRoleDescriptor<'update'> {
  readonly role: 'update';
  readonly isMutating: true;
  readonly isCollection: false;
  readonly isItem: true;
  readonly affectsSingleResource: true;
  readonly defaultActionName: 'update';
  readonly defaultHttpMethod: typeof HttpMethod.PUT;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Update;
}

export interface DeleteCrudRoleDescriptor extends BaseCrudRoleDescriptor<'delete'> {
  readonly role: 'delete';
  readonly isMutating: true;
  readonly isCollection: false;
  readonly isItem: true;
  readonly affectsSingleResource: true;
  readonly defaultActionName: 'remove';
  readonly defaultHttpMethod: typeof HttpMethod.DELETE;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Delete;
}

export interface CustomCrudRoleDescriptor extends BaseCrudRoleDescriptor<'custom'> {
  readonly role: 'custom';
  readonly isMutating: false;
  readonly isCollection: false;
  readonly isItem: false;
  readonly affectsSingleResource: false;
  readonly defaultActionName: 'call';
  readonly defaultHttpMethod: typeof HttpMethod.POST;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Create;
}

export type AnyCrudRoleDescriptor =
  | IndexCrudRoleDescriptor
  | ShowCrudRoleDescriptor
  | CreateCrudRoleDescriptor
  | UpdateCrudRoleDescriptor
  | DeleteCrudRoleDescriptor
  | CustomCrudRoleDescriptor;

export interface CrudRoleSpecification<R extends CrudRole = CrudRole> extends BaseCrudRoleDescriptor<R> {}

export type CrudRoleRegistry = {
  readonly [K in CrudRole]: CrudRoleSpecification<K>;
};

export const CRUD_ROLE_REGISTRY: CrudRoleRegistry = Object.freeze({
  [CrudRole.Index]: {
    role: CrudRole.Index,
    isMutating: false,
    isCollection: true,
    isItem: false,
    affectsSingleResource: false,
    defaultActionName: 'list',
    defaultHttpMethod: HttpMethod.GET,
    defaultHookKind: RouteHookKind.Query,
    defaultActionKind: RouteActionKind.Read,
    description: 'Collection retrieval of multiple resources'
  },
  [CrudRole.Show]: {
    role: CrudRole.Show,
    isMutating: false,
    isCollection: false,
    isItem: true,
    affectsSingleResource: true,
    defaultActionName: 'get',
    defaultHttpMethod: HttpMethod.GET,
    defaultHookKind: RouteHookKind.Query,
    defaultActionKind: RouteActionKind.Read,
    description: 'Single resource retrieval by identifier'
  },
  [CrudRole.Create]: {
    role: CrudRole.Create,
    isMutating: true,
    isCollection: false,
    isItem: false,
    affectsSingleResource: false,
    defaultActionName: 'create',
    defaultHttpMethod: HttpMethod.POST,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Create,
    description: 'Creation of a new resource'
  },
  [CrudRole.Update]: {
    role: CrudRole.Update,
    isMutating: true,
    isCollection: false,
    isItem: true,
    affectsSingleResource: true,
    defaultActionName: 'update',
    defaultHttpMethod: HttpMethod.PUT,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Update,
    description: 'Modification of an existing resource'
  },
  [CrudRole.Delete]: {
    role: CrudRole.Delete,
    isMutating: true,
    isCollection: false,
    isItem: true,
    affectsSingleResource: true,
    defaultActionName: 'remove',
    defaultHttpMethod: HttpMethod.DELETE,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Delete,
    description: 'Deletion of an existing resource'
  },
  [CrudRole.Custom]: {
    role: CrudRole.Custom,
    isMutating: false,
    isCollection: false,
    isItem: false,
    affectsSingleResource: false,
    defaultActionName: 'call',
    defaultHttpMethod: HttpMethod.POST,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Create,
    description: 'Custom endpoint outside canonical CRUD operations'
  }
});

export type CrudRoleVisitor<R> = {
  readonly [K in CrudRole]: (spec: CrudRoleSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian CrudRole dengan exhaustive type safety
 */
export function matchCrudRole<R>(
  roleOrRoute: CrudRole | { readonly crudRole: CrudRole } | string,
  visitor: CrudRoleVisitor<R>
): R {
  const rawRole = typeof roleOrRoute === 'string'
    ? roleOrRoute
    : (roleOrRoute as any).crudRole;
  const spec = (CRUD_ROLE_REGISTRY as Record<string, CrudRoleSpecification>)[rawRole] ?? CRUD_ROLE_REGISTRY[CrudRole.Custom];
  return visitor[spec.role](spec as any);
}

export class ScannedCrudRoleDescriptor implements BaseCrudRoleDescriptor {
  public readonly role: CrudRole;
  public readonly isMutating: boolean;
  public readonly isCollection: boolean;
  public readonly isItem: boolean;
  public readonly affectsSingleResource: boolean;
  public readonly defaultActionName: string;
  public readonly defaultHttpMethod: HttpMethod;
  public readonly defaultHookKind: RouteHookKind;
  public readonly defaultActionKind: RouteActionKind;
  public readonly description: string;

  constructor(role: CrudRole = CrudRole.Custom) {
    this.role = role;
    const spec = (CRUD_ROLE_REGISTRY as Record<string, CrudRoleSpecification>)[role] ?? CRUD_ROLE_REGISTRY[CrudRole.Custom];
    this.isMutating = spec.isMutating;
    this.isCollection = spec.isCollection;
    this.isItem = spec.isItem;
    this.affectsSingleResource = spec.affectsSingleResource;
    this.defaultActionName = spec.defaultActionName;
    this.defaultHttpMethod = spec.defaultHttpMethod;
    this.defaultHookKind = spec.defaultHookKind;
    this.defaultActionKind = spec.defaultActionKind;
    this.description = spec.description;
    Object.freeze(this);
  }

  public static index(): IndexCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Index) as unknown as IndexCrudRoleDescriptor;
  }

  public static show(): ShowCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Show) as unknown as ShowCrudRoleDescriptor;
  }

  public static create(): CreateCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Create) as unknown as CreateCrudRoleDescriptor;
  }

  public static update(): UpdateCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Update) as unknown as UpdateCrudRoleDescriptor;
  }

  public static delete(): DeleteCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Delete) as unknown as DeleteCrudRoleDescriptor;
  }

  public static custom(): CustomCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Custom) as unknown as CustomCrudRoleDescriptor;
  }

  public static fromRole(role: CrudRole): ScannedCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(role);
  }
}


export const RoutePayloadMode = Object.freeze({
  None: 'none',
  Required: 'required',
  Optional: 'optional'
} as const);
export type RoutePayloadMode = typeof RoutePayloadMode[keyof typeof RoutePayloadMode];

export const SdkResponseKind = Object.freeze({
  Void: 'void',
  Raw: 'raw',
  Validated: 'validated',
  Mapped: 'mapped',
  ValidatedAndMapped: 'validated_and_mapped'
} as const);
export type SdkResponseKind = typeof SdkResponseKind[keyof typeof SdkResponseKind];

export const InvalidationTargetKind = Object.freeze({
  SelfList: 'self_list',
  ParentList: 'parent_list',
  ParentDetail: 'parent_detail',
  AuthResource: 'auth_resource'
} as const);
export type InvalidationTargetKind = typeof InvalidationTargetKind[keyof typeof InvalidationTargetKind];

export interface InvalidationTarget {
  readonly groupName: string;
  readonly kind: InvalidationTargetKind;
  readonly queryKeyExpression: string;
}

export interface SelfListInvalidationTarget extends InvalidationTarget {
  readonly kind: 'self_list';
}

export interface ParentListInvalidationTarget extends InvalidationTarget {
  readonly kind: 'parent_list';
}

export interface ParentDetailInvalidationTarget extends InvalidationTarget {
  readonly kind: 'parent_detail';
}

export interface AuthResourceInvalidationTarget extends InvalidationTarget {
  readonly kind: 'auth_resource';
}

export type AnyInvalidationTarget =
  | SelfListInvalidationTarget
  | ParentListInvalidationTarget
  | ParentDetailInvalidationTarget
  | AuthResourceInvalidationTarget;

export interface InvalidationTargetSpecification<K extends InvalidationTargetKind = InvalidationTargetKind> {
  readonly kind: K;
  readonly queryKeySuffix: 'all' | 'lists' | 'detail';
  readonly computeQueryKey: (groupName: string) => string;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key InvalidationTargetKind.
 */
export type InvalidationTargetRegistry = {
  readonly [K in InvalidationTargetKind]: InvalidationTargetSpecification<K>;
};

export const INVALIDATION_TARGET_REGISTRY: InvalidationTargetRegistry = Object.freeze({
  [InvalidationTargetKind.SelfList]: {
    kind: InvalidationTargetKind.SelfList,
    queryKeySuffix: 'all',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.all`,
  },
  [InvalidationTargetKind.ParentList]: {
    kind: InvalidationTargetKind.ParentList,
    queryKeySuffix: 'lists',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.lists`,
  },
  [InvalidationTargetKind.ParentDetail]: {
    kind: InvalidationTargetKind.ParentDetail,
    queryKeySuffix: 'detail',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.detail`,
  },
  [InvalidationTargetKind.AuthResource]: {
    kind: InvalidationTargetKind.AuthResource,
    queryKeySuffix: 'all',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.all`,
  },
});

export interface InvalidationTargetVisitor<R> {
  readonly self_list: (target: SelfListInvalidationTarget) => R;
  readonly parent_list: (target: ParentListInvalidationTarget) => R;
  readonly parent_detail: (target: ParentDetailInvalidationTarget) => R;
  readonly auth_resource: (target: AuthResourceInvalidationTarget) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian InvalidationTarget dengan exhaustive type safety
 */
export function matchInvalidationTarget<R>(
  target: InvalidationTarget,
  visitor: InvalidationTargetVisitor<R>
): R {
  return visitor[target.kind](target as any);
}

export class ScannedInvalidationTarget implements InvalidationTarget {
  public readonly groupName: string;
  public readonly kind: InvalidationTargetKind;
  public readonly queryKeyExpression: string;

  constructor({
    groupName,
    kind
  }: {
    readonly groupName: string;
    readonly kind: InvalidationTargetKind;
  }) {
    this.groupName = groupName;
    this.kind = kind;
    this.queryKeyExpression = ScannedInvalidationTarget.computeQueryKey(groupName, kind);
    Object.freeze(this);
  }

  public static computeQueryKey(groupName: string, kind: InvalidationTargetKind): string {
    return INVALIDATION_TARGET_REGISTRY[kind].computeQueryKey(groupName);
  }

  public static selfList(groupName: string): SelfListInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.SelfList
    }) as SelfListInvalidationTarget;
  }

  public static parentList(groupName: string): ParentListInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.ParentList
    }) as ParentListInvalidationTarget;
  }

  public static parentDetail(groupName: string): ParentDetailInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.ParentDetail
    }) as ParentDetailInvalidationTarget;
  }

  public static authResource(groupName: string): AuthResourceInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.AuthResource
    }) as AuthResourceInvalidationTarget;
  }

  public static resourceList(groupName: string): ParentListInvalidationTarget {
    return ScannedInvalidationTarget.parentList(groupName);
  }

  public static resourceItem(groupName: string): ParentDetailInvalidationTarget {
    return ScannedInvalidationTarget.parentDetail(groupName);
  }
}

export interface RouteCacheInvalidationDescriptor {
  readonly targets: readonly InvalidationTarget[];
  readonly queryKeyExpressions: readonly string[];
}

const EMPTY_INVALIDATION_TARGETS: readonly InvalidationTarget[] = Object.freeze([]);

export class ScannedRouteCacheInvalidationDescriptor implements RouteCacheInvalidationDescriptor {
  public readonly targets: readonly InvalidationTarget[];
  public readonly queryKeyExpressions: readonly string[];

  constructor({
    targets
  }: {
    readonly targets: readonly InvalidationTarget[];
  }) {
    this.targets = Object.freeze(targets);
    this.queryKeyExpressions = Object.freeze(targets.map(t => t.queryKeyExpression));
    Object.freeze(this);
  }

  public static empty(): ScannedRouteCacheInvalidationDescriptor {
    return new ScannedRouteCacheInvalidationDescriptor({ targets: EMPTY_INVALIDATION_TARGETS });
  }

  public static none(): ScannedRouteCacheInvalidationDescriptor {
    return ScannedRouteCacheInvalidationDescriptor.empty();
  }

  public static fromTargets(targets: readonly InvalidationTarget[]): ScannedRouteCacheInvalidationDescriptor {
    return new ScannedRouteCacheInvalidationDescriptor({ targets });
  }
}

export const ScannedRouteInvalidationPayload = ScannedRouteCacheInvalidationDescriptor;
export type ScannedRouteInvalidationPayload = ScannedRouteCacheInvalidationDescriptor;

export interface BaseRouteExecutionSignature {
  readonly payloadMode: RoutePayloadMode;
  readonly parameterDeclaration: string;
  readonly callArgumentsExpression: string;
  readonly hasPayload: boolean;
  readonly isOptional: boolean;
}

export interface NoPayloadExecutionSignature extends BaseRouteExecutionSignature {
  readonly payloadMode: 'none';
  readonly parameterDeclaration: '';
  readonly callArgumentsExpression: '';
  readonly hasPayload: false;
  readonly isOptional: true;
}

export interface RequiredPayloadExecutionSignature extends BaseRouteExecutionSignature {
  readonly payloadMode: 'required';
  readonly parameterDeclaration: string;
  readonly callArgumentsExpression: 'payload';
  readonly hasPayload: true;
  readonly isOptional: false;
}

export interface OptionalPayloadExecutionSignature extends BaseRouteExecutionSignature {
  readonly payloadMode: 'optional';
  readonly parameterDeclaration: string;
  readonly callArgumentsExpression: 'payload';
  readonly hasPayload: true;
  readonly isOptional: true;
}

export type AnyRouteExecutionSignature =
  | NoPayloadExecutionSignature
  | RequiredPayloadExecutionSignature
  | OptionalPayloadExecutionSignature;

export interface RouteExecutionSignature extends BaseRouteExecutionSignature {}

export interface RoutePayloadModeSpecification<M extends RoutePayloadMode = RoutePayloadMode> {
  readonly mode: M;
  readonly hasPayload: boolean;
  readonly isOptional: boolean;
  readonly defaultCallArguments: string;
  readonly formatDeclaration: (typeName: string) => string;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key RoutePayloadMode.
 */
export type RoutePayloadModeRegistry = {
  readonly [M in RoutePayloadMode]: RoutePayloadModeSpecification<M>;
};

export const ROUTE_PAYLOAD_MODE_REGISTRY: RoutePayloadModeRegistry = Object.freeze({
  [RoutePayloadMode.None]: {
    mode: RoutePayloadMode.None,
    hasPayload: false,
    isOptional: true,
    defaultCallArguments: '',
    formatDeclaration: () => ''
  },
  [RoutePayloadMode.Required]: {
    mode: RoutePayloadMode.Required,
    hasPayload: true,
    isOptional: false,
    defaultCallArguments: 'payload',
    formatDeclaration: (typeName: string) => `payload: ${typeName}`
  },
  [RoutePayloadMode.Optional]: {
    mode: RoutePayloadMode.Optional,
    hasPayload: true,
    isOptional: true,
    defaultCallArguments: 'payload',
    formatDeclaration: (typeName: string) => `payload: ${typeName} = {}`
  }
});

export interface RouteExecutionSignatureVisitor<R> {
  readonly none: (sig: NoPayloadExecutionSignature) => R;
  readonly required: (sig: RequiredPayloadExecutionSignature) => R;
  readonly optional: (sig: OptionalPayloadExecutionSignature) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian RouteExecutionSignature dengan exhaustive type safety
 */
export function matchRouteExecutionSignature<R>(
  signature: RouteExecutionSignature | RoutePayloadMode,
  visitor: RouteExecutionSignatureVisitor<R>
): R {
  const mode = typeof signature === 'string' ? signature : signature.payloadMode;
  return visitor[mode](signature as any);
}

export const matchRoutePayloadMode = matchRouteExecutionSignature;

export class ScannedRouteExecutionSignature implements RouteExecutionSignature {
  public readonly payloadMode: RoutePayloadMode;
  public readonly parameterDeclaration: string;
  public readonly callArgumentsExpression: string;
  public readonly hasPayload: boolean;
  public readonly isOptional: boolean;

  constructor({
    payloadMode,
    parameterDeclaration,
    callArgumentsExpression,
    hasPayload,
    isOptional
  }: {
    readonly payloadMode: RoutePayloadMode;
    readonly parameterDeclaration: string;
    readonly callArgumentsExpression: string;
    readonly hasPayload?: boolean;
    readonly isOptional?: boolean;
  }) {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[payloadMode];
    this.payloadMode = payloadMode;
    this.parameterDeclaration = parameterDeclaration;
    this.callArgumentsExpression = callArgumentsExpression;
    this.hasPayload = hasPayload ?? spec.hasPayload;
    this.isOptional = isOptional ?? spec.isOptional;
    Object.freeze(this);
  }

  public static noPayload(): NoPayloadExecutionSignature {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.None];
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.None,
      parameterDeclaration: spec.formatDeclaration(''),
      callArgumentsExpression: spec.defaultCallArguments,
      hasPayload: spec.hasPayload,
      isOptional: spec.isOptional
    }) as NoPayloadExecutionSignature;
  }

  public static authOnly(): NoPayloadExecutionSignature {
    return ScannedRouteExecutionSignature.noPayload();
  }

  public static requiredPayload(typeName: string): RequiredPayloadExecutionSignature {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.Required];
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.Required,
      parameterDeclaration: spec.formatDeclaration(typeName),
      callArgumentsExpression: spec.defaultCallArguments,
      hasPayload: spec.hasPayload,
      isOptional: spec.isOptional
    }) as RequiredPayloadExecutionSignature;
  }

  public static optionalPayload(typeName: string): OptionalPayloadExecutionSignature {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.Optional];
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.Optional,
      parameterDeclaration: spec.formatDeclaration(typeName),
      callArgumentsExpression: spec.defaultCallArguments,
      hasPayload: spec.hasPayload,
      isOptional: spec.isOptional
    }) as OptionalPayloadExecutionSignature;
  }

  public static fromMode(mode: RoutePayloadMode, typeName: string = 'any'): RouteExecutionSignature {
    const DISPATCH: Record<RoutePayloadMode, () => RouteExecutionSignature> = {
      [RoutePayloadMode.None]: () => ScannedRouteExecutionSignature.noPayload(),
      [RoutePayloadMode.Required]: () => ScannedRouteExecutionSignature.requiredPayload(typeName),
      [RoutePayloadMode.Optional]: () => ScannedRouteExecutionSignature.optionalPayload(typeName)
    };
    return DISPATCH[mode]();
  }

  public static create(
    hookKind: RouteHookKind,
    hasParams: boolean,
    hasPayload: boolean = false,
    typeName: string = 'any'
  ): RouteExecutionSignature {
    const mode = hasPayload ? RoutePayloadMode.Required : RoutePayloadMode.None;
    return ScannedRouteExecutionSignature.fromMode(mode, typeName);
  }
}

export interface SdkResponseResolution {
  readonly kind: SdkResponseKind;
  readonly type: string;
  readonly hasSchema: boolean;
  readonly schemaExpression: string;
  readonly hasMapper: boolean;
  readonly mapperExpression: string;
}

export interface VoidSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'void';
  readonly type: 'void';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface RawSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'raw';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface ValidatedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'validated';
  readonly hasSchema: true;
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface MappedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'mapped';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: true;
}

export interface ValidatedAndMappedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'validated_and_mapped';
  readonly hasSchema: true;
  readonly hasMapper: true;
}

export type AnySdkResponseResolution =
  | VoidSdkResponseResolution
  | RawSdkResponseResolution
  | ValidatedSdkResponseResolution
  | MappedSdkResponseResolution
  | ValidatedAndMappedSdkResponseResolution;

export interface SdkResponseKindSpecification<K extends SdkResponseKind = SdkResponseKind> {
  readonly kind: K;
  readonly hasSchema: boolean;
  readonly hasMapper: boolean;
  readonly isTransformed: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SdkResponseKind.
 */
export type SdkResponseKindRegistry = {
  readonly [K in SdkResponseKind]: SdkResponseKindSpecification<K>;
};

export const SDK_RESPONSE_KIND_REGISTRY: SdkResponseKindRegistry = Object.freeze({
  [SdkResponseKind.Void]: {
    kind: SdkResponseKind.Void,
    hasSchema: false,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Raw]: {
    kind: SdkResponseKind.Raw,
    hasSchema: false,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Validated]: {
    kind: SdkResponseKind.Validated,
    hasSchema: true,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Mapped]: {
    kind: SdkResponseKind.Mapped,
    hasSchema: false,
    hasMapper: true,
    isTransformed: true
  },
  [SdkResponseKind.ValidatedAndMapped]: {
    kind: SdkResponseKind.ValidatedAndMapped,
    hasSchema: true,
    hasMapper: true,
    isTransformed: true
  }
});

export interface SdkResponseResolutionVisitor<R> {
  readonly void: (res: VoidSdkResponseResolution) => R;
  readonly raw: (res: RawSdkResponseResolution) => R;
  readonly validated: (res: ValidatedSdkResponseResolution) => R;
  readonly mapped: (res: MappedSdkResponseResolution) => R;
  readonly validated_and_mapped: (res: ValidatedAndMappedSdkResponseResolution) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian SdkResponseResolution dengan exhaustive type safety
 */
export function matchSdkResponseResolution<R>(
  resolution: SdkResponseResolution,
  visitor: SdkResponseResolutionVisitor<R>
): R {
  return visitor[resolution.kind](resolution as any);
}

export const matchSdkResponse = matchSdkResponseResolution;

export class ScannedSdkResponseResolution implements SdkResponseResolution {
  public readonly kind: SdkResponseKind;
  public readonly type: string;
  public readonly hasSchema: boolean;
  public readonly schemaExpression: string;
  public readonly hasMapper: boolean;
  public readonly mapperExpression: string;

  constructor({
    kind,
    type,
    hasSchema,
    schemaExpression,
    hasMapper,
    mapperExpression
  }: {
    readonly kind: SdkResponseKind;
    readonly type: string;
    readonly hasSchema: boolean;
    readonly schemaExpression: string;
    readonly hasMapper: boolean;
    readonly mapperExpression: string;
  }) {
    this.kind = kind;
    this.type = type;
    this.hasSchema = hasSchema;
    this.schemaExpression = schemaExpression;
    this.hasMapper = hasMapper;
    this.mapperExpression = mapperExpression;
    Object.freeze(this);
  }

  public static voidResponse(): VoidSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Void,
      type: 'void',
      hasSchema: false,
      schemaExpression: '',
      hasMapper: false,
      mapperExpression: ''
    }) as VoidSdkResponseResolution;
  }

  public static raw(readTypeName: string): RawSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Raw,
      type: readTypeName,
      hasSchema: false,
      schemaExpression: '',
      hasMapper: false,
      mapperExpression: ''
    }) as RawSdkResponseResolution;
  }

  public static validated(readTypeName: string, schemaExpression: string): ValidatedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Validated,
      type: readTypeName,
      hasSchema: true,
      schemaExpression,
      hasMapper: false,
      mapperExpression: ''
    }) as ValidatedSdkResponseResolution;
  }

  public static mapped(readTypeName: string, mapperExpression: string): MappedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Mapped,
      type: readTypeName,
      hasSchema: false,
      schemaExpression: '',
      hasMapper: true,
      mapperExpression
    }) as MappedSdkResponseResolution;
  }

  public static validatedAndMapped(
    readTypeName: string,
    schemaExpression: string,
    mapperExpression: string
  ): ValidatedAndMappedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.ValidatedAndMapped,
      type: readTypeName,
      hasSchema: true,
      schemaExpression,
      hasMapper: true,
      mapperExpression
    }) as ValidatedAndMappedSdkResponseResolution;
  }
}

export interface ParsedRoute {
  readonly name: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly resourceName: string;      // ✅ Guaranteed from PHP scanner
  readonly groupName: string;         // ✅ Canonical Route Group SSOT ('users', 'orderItems')
  readonly crudRole: CrudRole;        // ✅ Canonical REST CRUD Role SSOT ('index' | 'show' | 'create' | 'update' | 'delete' | 'custom')
  readonly runtimePath: string;       // ✅ Express/React Runtime Path SSOT ('/users/:userId')
  readonly responseTypeName: string;  // ✅ Guaranteed from PHP scanner (e.g. 'UsersResponse')
  readonly actionKind: RouteActionKind; // ✅ Guaranteed Action Intent (0 ternary '? :')
  readonly isMutating: boolean;                      // ✅ Guaranteed Mutating Flag (0 '||' checks)
  readonly hookKind: RouteHookKind;                  // ✅ Guaranteed Hook Kind SSOT (Query vs Mutation)
  readonly invalidation: RouteCacheInvalidationDescriptor; // ✅ Guaranteed Cache Invalidation SSOT
  readonly executionSignature: RouteExecutionSignature;   // ✅ Guaranteed Signature SSOT
  readonly requestContentType: RequestContentType;   // ✅ Guaranteed Transport Content-Type SSOT
  readonly parameters: readonly RouteParameter[];    // Backwards-compatible path parameters
  readonly pathParameters: readonly RouteParameter[];// ✅ Dedicated Path Parameters SSOT
  readonly queryParameters: readonly RouteQueryParameter[]; // ✅ Dedicated Query Parameters SSOT
  readonly auth: boolean;
  readonly security: RouteSecurityDescriptor;        // ✅ Guaranteed Security SSOT (0 middleware.some)
  readonly middleware: readonly string[];
  readonly policies: readonly RoutePolicyDescriptor[];// ✅ Dedicated Laravel Policies SSOT ('can:update,order')
  readonly rateLimit: RateLimitDescriptor | null;    // ✅ Dedicated Laravel Rate Limit SSOT ('throttle:60,1')
  readonly response: ResponseDescriptor;             // ◄── 100% Guaranteed Value Object!
  readonly errorResponses: readonly HttpErrorResponseDescriptor[]; // ✅ First-Class Error Descriptors (422, etc.)

  /**
   * Strongly-typed Laravel validation rules payload.
   */
  readonly schema: RouteSchemaPayload;

  /**
   * Local variable assignments tracked during semantic analysis (Ordered Array).
   */
  readonly assignments: readonly ResourceAssignment[];

  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly uri: string;
  readonly actionName: string;
  readonly controllerName: string | null;
  readonly contract?: EndpointContract; // ✅ Complete Contract-Driven Architecture SSOT
}

// ============================================================================
// ROUTE DESCRIPTOR ADT (Direct Extension of ParsedRoute — 100% Data Connected)
// ============================================================================

export interface GetCollectionRouteDescriptor extends ParsedRoute {
  readonly kind: 'get_collection';
  readonly method: 'GET';
}

export interface GetItemRouteDescriptor extends ParsedRoute {
  readonly kind: 'get_item';
  readonly method: 'GET';
}

export interface MutationRouteDescriptor extends ParsedRoute {
  readonly kind: 'mutation';
  readonly method: 'POST' | 'PUT' | 'PATCH';
}

export interface DeletionRouteDescriptor extends ParsedRoute {
  readonly kind: 'deletion';
  readonly method: 'DELETE';
}

export type RouteDescriptor =
  | GetCollectionRouteDescriptor
  | GetItemRouteDescriptor
  | MutationRouteDescriptor
  | DeletionRouteDescriptor;

export type RouteClassifier = (route: ParsedRoute) => RouteDescriptor;

export const CRUD_DISPATCH_REGISTRY: Record<CrudRole, RouteClassifier> = Object.freeze({
  index: (route): GetCollectionRouteDescriptor => ({
    ...route,
    kind: 'get_collection',
    method: 'GET',
  }),

  show: (route): GetItemRouteDescriptor => ({
    ...route,
    kind: 'get_item',
    method: 'GET',
  }),

  create: (route): MutationRouteDescriptor => ({
    ...route,
    kind: 'mutation',
    method: route.method as 'POST' | 'PUT' | 'PATCH',
  }),

  update: (route): MutationRouteDescriptor => ({
    ...route,
    kind: 'mutation',
    method: route.method as 'POST' | 'PUT' | 'PATCH',
  }),

  delete: (route): DeletionRouteDescriptor => ({
    ...route,
    kind: 'deletion',
    method: 'DELETE',
  }),

  custom: (route): RouteDescriptor => {
    const CUSTOM_DISPATCH: Record<RouteHookKind, RouteClassifier> = {
      [RouteHookKind.Query]: CRUD_DISPATCH_REGISTRY.index,
      [RouteHookKind.Mutation]: CRUD_DISPATCH_REGISTRY.create,
      [RouteHookKind.InfiniteQuery]: CRUD_DISPATCH_REGISTRY.index,
    };
    return CUSTOM_DISPATCH[route.hookKind](route);
  },
});

/**
 * 0 `if` Classifier: Mengonversi ParsedRoute menjadi RouteDescriptor ADT utuh
 */
export const classifyRoute = (route: ParsedRoute): RouteDescriptor =>
  CRUD_DISPATCH_REGISTRY[route.crudRole](route);

export interface RouteVisitor<R> {
  readonly get_collection: (desc: GetCollectionRouteDescriptor) => R;
  readonly get_item: (desc: GetItemRouteDescriptor) => R;
  readonly mutation: (desc: MutationRouteDescriptor) => R;
  readonly deletion: (desc: DeletionRouteDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian dengan exhaustive type safety
 */
export function matchRoute<R>(
  descriptor: RouteDescriptor,
  visitor: RouteVisitor<R>
): R {
  return visitor[descriptor.kind](descriptor as any);
}

/**
 * RouteDescriptorKind
 *
 * Canonical Domain Vocabulary for Route ADT Discriminator Tags.
 */
export const RouteDescriptorKind = Object.freeze({
  GetCollection: 'get_collection',
  GetItem: 'get_item',
  Mutation: 'mutation',
  Deletion: 'deletion',
} as const);

export type RouteDescriptorKind = typeof RouteDescriptorKind[keyof typeof RouteDescriptorKind];

export interface RouteKindSpecification<K extends RouteDescriptorKind = RouteDescriptorKind> {
  readonly kind: K;
  readonly hookKind: RouteHookKind;
  readonly isMutating: boolean;
  readonly allowsPayload: boolean;
}

export type RouteDescriptorRegistry = {
  readonly [K in RouteDescriptorKind]: RouteKindSpecification<K>;
};

export const ROUTE_DESCRIPTOR_REGISTRY: RouteDescriptorRegistry = Object.freeze({
  [RouteDescriptorKind.GetCollection]: {
    kind: RouteDescriptorKind.GetCollection,
    hookKind: RouteHookKind.Query,
    isMutating: false,
    allowsPayload: false,
  },
  [RouteDescriptorKind.GetItem]: {
    kind: RouteDescriptorKind.GetItem,
    hookKind: RouteHookKind.Query,
    isMutating: false,
    allowsPayload: false,
  },
  [RouteDescriptorKind.Mutation]: {
    kind: RouteDescriptorKind.Mutation,
    hookKind: RouteHookKind.Mutation,
    isMutating: true,
    allowsPayload: true,
  },
  [RouteDescriptorKind.Deletion]: {
    kind: RouteDescriptorKind.Deletion,
    hookKind: RouteHookKind.Mutation,
    isMutating: true,
    allowsPayload: false,
  },
});

/**
 * RouteCollectionRegistry
 *
 * Immutable First-Class Partition Registry for Scanned Route Descriptors.
 */
export interface RouteCollectionRegistry {
  readonly all: readonly RouteDescriptor[];
  readonly collections: readonly GetCollectionRouteDescriptor[];
  readonly items: readonly GetItemRouteDescriptor[];
  readonly mutations: readonly MutationRouteDescriptor[];
  readonly deletions: readonly DeletionRouteDescriptor[];
  matchAll<R>(visitor: RouteVisitor<R>): readonly R[];
}

export class ScannedRouteRegistry implements RouteCollectionRegistry {
  public readonly all: readonly RouteDescriptor[];
  public readonly collections: readonly GetCollectionRouteDescriptor[];
  public readonly items: readonly GetItemRouteDescriptor[];
  public readonly mutations: readonly MutationRouteDescriptor[];
  public readonly deletions: readonly DeletionRouteDescriptor[];

  constructor({
    all,
    collections,
    items,
    mutations,
    deletions
  }: {
    readonly all: readonly RouteDescriptor[];
    readonly collections: readonly GetCollectionRouteDescriptor[];
    readonly items: readonly GetItemRouteDescriptor[];
    readonly mutations: readonly MutationRouteDescriptor[];
    readonly deletions: readonly DeletionRouteDescriptor[];
  }) {
    this.all = all;
    this.collections = collections;
    this.items = items;
    this.mutations = mutations;
    this.deletions = deletions;
    Object.freeze(this);
  }

  public static fromRoutes(routes: readonly ParsedRoute[]): ScannedRouteRegistry {
    const all = routes.map(classifyRoute);
    const collections: GetCollectionRouteDescriptor[] = [];
    const items: GetItemRouteDescriptor[] = [];
    const mutations: MutationRouteDescriptor[] = [];
    const deletions: DeletionRouteDescriptor[] = [];

    const PARTITION_DISPATCH: RouteVisitor<void> = {
      get_collection: (d) => { collections.push(d); },
      get_item: (d) => { items.push(d); },
      mutation: (d) => { mutations.push(d); },
      deletion: (d) => { deletions.push(d); }
    };

    all.forEach(desc => matchRoute(desc, PARTITION_DISPATCH));

    return new ScannedRouteRegistry({
      all: Object.freeze(all),
      collections: Object.freeze(collections),
      items: Object.freeze(items),
      mutations: Object.freeze(mutations),
      deletions: Object.freeze(deletions)
    });
  }

  public matchAll<R>(visitor: RouteVisitor<R>): readonly R[] {
    return this.all.map(desc => matchRoute(desc, visitor));
  }
}

// ============================================================================
// ENDPOINT CONTRACT ADT & COMPLETE CONTRACT ARCHITECTURE (CDA)
// ============================================================================

export interface EndpointRequestContract {
  readonly hasBody: boolean;
  readonly pathParameters: readonly RouteParameter[];
  readonly queryParameters: readonly RouteQueryParameter[];
  readonly contentType: RequestContentType;
  readonly schema: RouteSchemaPayload;
  readonly executionSignature: RouteExecutionSignature;
  readonly security: RouteSecurityDescriptor;
}

export interface EndpointSuccessResponseContract {
  readonly statusCode: HttpStatusCode;
  readonly descriptor: ResponseDescriptor;
  readonly readTypeName: string;
  readonly validatorName: string;
  readonly mapperName: string;
  readonly shape: ResponseShape;
}

export interface EndpointErrorResponseContract {
  readonly statusCode: HttpStatusCode;
  readonly name: string;
  readonly typeName: string;
  readonly schema: Record<string, unknown>;
}

export interface EndpointResponseContract {
  readonly success: EndpointSuccessResponseContract;
  readonly errors: readonly EndpointErrorResponseContract[];
  readonly errorUnionType: string;
}

export interface EndpointContract<
  TMethod extends HttpMethod = HttpMethod,
  TRole extends CrudRole = CrudRole
> {
  readonly id: string;
  readonly name: string;
  readonly method: TMethod;
  readonly path: string;
  readonly runtimePath: string;
  readonly groupName: string;
  readonly resourceName: string;
  readonly crudRole: TRole;
  readonly isMutating: boolean;
  readonly hookKind: RouteHookKind;
  readonly request: EndpointRequestContract;
  readonly response: EndpointResponseContract;
  readonly invalidation: RouteCacheInvalidationDescriptor;
  readonly policies: readonly RoutePolicyDescriptor[];
  readonly raw: ParsedRoute;
}

export class ScannedEndpointContract implements EndpointContract {
  public readonly id: string;
  public readonly name: string;
  public readonly method: HttpMethod;
  public readonly path: string;
  public readonly runtimePath: string;
  public readonly groupName: string;
  public readonly resourceName: string;
  public readonly crudRole: CrudRole;
  public readonly isMutating: boolean;
  public readonly hookKind: RouteHookKind;
  public readonly request: EndpointRequestContract;
  public readonly response: EndpointResponseContract;
  public readonly invalidation: RouteCacheInvalidationDescriptor;
  public readonly policies: readonly RoutePolicyDescriptor[];
  public readonly raw: ParsedRoute;

  constructor(params: EndpointContract) {
    this.id = params.id;
    this.name = params.name;
    this.method = params.method;
    this.path = params.path;
    this.runtimePath = params.runtimePath;
    this.groupName = params.groupName;
    this.resourceName = params.resourceName;
    this.crudRole = params.crudRole;
    this.isMutating = params.isMutating;
    this.hookKind = params.hookKind;
    this.request = Object.freeze({ ...params.request });
    this.response = Object.freeze({
      ...params.response,
      errors: Object.freeze([...params.response.errors])
    });
    this.invalidation = params.invalidation;
    this.policies = Object.freeze([...params.policies]);
    this.raw = params.raw;
    Object.freeze(this);
  }

  public static fromRoute(route: ParsedRoute): ScannedEndpointContract {
    const errorList: EndpointErrorResponseContract[] = (route.errorResponses ?? []).map(err => ({
      statusCode: err.statusCode,
      name: err.name,
      typeName: err.typeName,
      schema: err.schema
    }));

    const errorUnionType = errorList.length > 0
      ? Array.from(new Set(errorList.map(e => e.typeName))).join(' | ')
      : 'ApiError';

    const defaultStatusCode = route.method.toUpperCase() === 'POST'
      ? HttpStatusCode.Created
      : (route.response?.readTypeName === 'void' ? HttpStatusCode.NoContent : HttpStatusCode.Ok);

    const successContract: EndpointSuccessResponseContract = {
      statusCode: defaultStatusCode,
      descriptor: route.response,
      readTypeName: route.response?.readTypeName ?? 'unknown',
      validatorName: route.response?.validatorName ?? 'undefined',
      mapperName: route.response?.mapperName ?? 'identity',
      shape: route.response?.shape ?? ResponseShape.Single
    };

    const hasBody = Boolean(route.schema?.rules && (Array.isArray(route.schema.rules) ? route.schema.rules.length > 0 : Object.keys(route.schema.rules).length > 0));

    const requestContract: EndpointRequestContract = {
      hasBody,
      pathParameters: route.pathParameters ?? [],
      queryParameters: route.queryParameters ?? [],
      contentType: route.requestContentType,
      schema: route.schema,
      executionSignature: route.executionSignature,
      security: route.security
    };

    const group = route.groupName || route.resourceName || 'App';
    const action = route.actionName || 'action';
    const isMutating = route.isMutating ?? (HTTP_METHOD_REGISTRY[route.method as HttpMethod]?.isMutating ?? false);
    const hookKind = route.hookKind ?? (isMutating ? RouteHookKind.Mutation : RouteHookKind.Query);
    const crudRole = route.crudRole ?? CrudRole.Custom;

    return new ScannedEndpointContract({
      id: route.name || `${group}.${action}`,
      name: action,
      method: route.method as HttpMethod,
      path: route.path,
      runtimePath: route.runtimePath ?? route.path,
      groupName: group,
      resourceName: route.resourceName ?? group,
      crudRole,
      isMutating,
      hookKind,
      request: requestContract,
      response: {
        success: successContract,
        errors: errorList,
        errorUnionType
      },
      invalidation: route.invalidation,
      policies: route.policies ?? [],
      raw: route
    });
  }
}

export function createEndpointContract(route: ParsedRoute): EndpointContract {
  return ScannedEndpointContract.fromRoute(route);
}

export interface EndpointResponseVisitor<R> {
  success: (success: EndpointSuccessResponseContract) => R;
  error?: (errors: readonly EndpointErrorResponseContract[], errorUnion: string) => R;
}

export function matchEndpointResponse<R>(
  responseContract: EndpointResponseContract,
  visitor: EndpointResponseVisitor<R>
): R {
  return visitor.success(responseContract.success);
}

/**
 * Guarantees a non-null EndpointContract from any ParsedRoute.
 */
export function getRouteContract(route: ParsedRoute): EndpointContract {
  return route.contract ?? ScannedEndpointContract.fromRoute(route);
}

/**
 * Builds an O(1) Map of contracts keyed by contract id / action name.
 */
export function getManifestContractMap(manifest: RouteManifest): Map<string, EndpointContract> {
  const map = new Map<string, EndpointContract>();
  const contracts = manifest.contracts ?? manifest.routes.map(r => getRouteContract(r));
  for (const c of contracts) {
    map.set(c.id, c);
  }
  return map;
}

/**
 * Backward compatibility type aliases for legacy adapters.
 */
export type ResourceFieldKind = ResourceFieldDescriptor;
export type ResponseMetadata = ResponseDescriptor;