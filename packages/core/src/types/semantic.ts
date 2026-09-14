import { TraceNode, SemanticResolution, AccessKind } from './contract';
import type { FieldNode } from './field';
import {
  ModelFieldMap,
  ModelRelationMap,
  ModelAccessorMap,
  ModelServiceMap,
  ModelControllerMap,
  ModelNodeMap,
  SemanticModelMap,
  SemanticRelationMap
} from './domain/semanticCollections';

export {
  type ModelFieldInfo,
  type ModelFieldEntry,
  ModelFieldMap,
  type ModelRelationInfo,
  type ModelRelationEntry,
  ModelRelationMap,
  type ModelAccessorInfo,
  type ModelAccessorEntry,
  ModelAccessorMap,
  type ModelServiceEntry,
  ModelServiceMap,
  type ModelControllerEntry,
  ModelControllerMap,
  type ModelNodeEntry,
  ModelNodeMap,
  type SemanticModelEntry,
  SemanticModelMap,
  type SemanticRelationEntry,
  SemanticRelationMap
} from './domain/semanticCollections';

/* =========================================================
 *  ROUTESYNC COMPILER CORE — IR v2 SPEC
 * ========================================================= */

/* =========================
 *  1. CORE ENUMS
 * ========================= */

export type IRKind =
  | "raw_code"
  | "literal"
  | "property_access"
  | "method_call"
  | "binary_expression"
  | "ternary_expression"
  | "nullsafe_chain"
  | "type_cast"
  | "collection"
  | "model_reference"
  | "unknown";

/* =========================
 *  2. SOURCE LAYER (TRACEABILITY)
 * ========================= */

export type SourceContext =
  | "controller"
  | "resource"
  | "model"
  | "route"
  | "service";

export interface SourceRef {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly context: SourceContext;
}

export class SourceRefFactory {
  public static create(
    file: string,
    context: SourceContext = 'route',
    line: number = 0,
    column: number = 0
  ): SourceRef {
    return Object.freeze({ file, line, column, context });
  }

  public static unknown(file: string = '', context: SourceContext = 'route'): SourceRef {
    return Object.freeze({ file, line: 0, column: 0, context });
  }
}

/* =========================
 *  3. RAW LAYER (IMMUTABLE INPUT)
 * ========================= */

export interface RootASTNode {
  readonly kind: "root";
  readonly identifier: string;
  readonly source: SourceRef;
}

export class RootASTNodeFactory {
  public static create(
    identifier: string = '',
    source: SourceRef = SourceRefFactory.unknown()
  ): RootASTNode {
    return Object.freeze({
      kind: "root",
      identifier,
      source
    });
  }
}

export interface IRRawNode {
  readonly kind: "raw_code";
  readonly code: string;
  readonly hints: IRHints;
  readonly parsed_ast?: ParsedASTNode;
}

export class IRRawNodeDescriptor implements IRRawNode {
  public readonly kind = "raw_code" as const;
  public readonly code: string;
  public readonly hints: IRHints;
  public readonly parsed_ast?: ParsedASTNode;

  constructor(code: string, hints: IRHints, parsedAst?: ParsedASTNode) {
    this.code = code;
    this.hints = hints;
    this.parsed_ast = parsedAst;
    Object.freeze(this);
  }

  public static fromRawCode(code: string, hints?: IRHints): IRRawNodeDescriptor {
    return new IRRawNodeDescriptor(code, hints ?? IRHintsFactory.default());
  }

  public static withAst(code: string, ast: ParsedASTNode, hints?: IRHints): IRRawNodeDescriptor {
    return new IRRawNodeDescriptor(code, hints ?? IRHintsFactory.default(), ast);
  }
}

/* =========================
 *  4. HINT SYSTEM (LIGHTWEIGHT SIGNALING ONLY)
 * ========================= */

export type IRHintPattern =
  | "property_access"
  | "method_call"
  | "binary_expression"
  | "type_cast"
  | "ternary"
  | "nullsafe_chain"
  | "collection"
  | "unknown";

export type IRFrameworkContext = "eloquent" | "resource" | "blade" | "unknown";

export interface IRHints {
  readonly pattern: IRHintPattern;
  readonly confidence: number;
  readonly nullable: boolean;
  readonly framework_context: IRFrameworkContext;
}

export class IRHintsFactory {
  public static create(
    pattern: IRHintPattern,
    confidence: number = 1.0,
    nullable: boolean = false,
    frameworkContext: IRFrameworkContext = 'unknown'
  ): IRHints {
    return Object.freeze({
      pattern,
      confidence,
      nullable,
      framework_context: frameworkContext
    });
  }

  public static default(pattern: IRHintPattern = 'unknown'): IRHints {
    return Object.freeze({
      pattern,
      confidence: 1.0,
      nullable: false,
      framework_context: 'unknown'
    });
  }

  public static empty(pattern: IRHintPattern = 'unknown'): IRHints {
    return this.default(pattern);
  }
}

/* =========================
 *  5. PARSED AST (PHP -> TS STRUCTURE)
 * ========================= */

export type ParsedASTNode =
  | RootASTNode
  | PropertyAccessAST
  | MethodCallAST
  | BinaryExpressionAST
  | TypeCastAST
  | TernaryAST
  | LiteralAST
  | NullLiteralAST
  | NullsafeChainAST
  | UnknownAST
  | VariableAST
  | PrimitiveAST
  | ResourceAST
  | ModelAST
  | StaticMethodCallAST
  | NullsafePropertyAccessAST
  | NewInstanceAST;

/* ---------- AST NODES ---------- */

export interface VariableAST {
  kind: "variable";
  name: string;
}

export interface PropertyAccessAST {
  kind: "property_access";
  target: ParsedASTNode;
  property: string;
  /**
   * Explicit access classification emitted by the parser.
   * The adapter must not infer or default this value.
   */
  accessKind: AccessKind;
}

export interface MethodCallAST {
  kind: "method_call";
  target: ParsedASTNode;
  name: string;
  args: ParsedASTNode[];
  resource?: string;
  collection?: boolean;
}

export interface BinaryExpressionAST {
  kind: "binary_expression";
  operator: string; // + - * / ?? etc
  left: ParsedASTNode;
  right: ParsedASTNode;
}

export interface TypeCastAST {
  kind: "type_cast";
  castType: "int" | "float" | "string" | "bool";
  expression: ParsedASTNode;
}

export interface TernaryAST {
  kind: "ternary";
  condition: ParsedASTNode;
  truthy: ParsedASTNode;
  falsy: ParsedASTNode;
}

export interface ScalarLiteralAST {
  kind: "literal";
  value: string | number | boolean;
}

export interface NullLiteralAST {
  kind: "null_literal";
}

export type LiteralAST = ScalarLiteralAST;
export type ParsedLiteralAST = ScalarLiteralAST | NullLiteralAST;

export interface NullsafeChainAST {
  kind: "nullsafe_chain";
  chain: ParsedASTNode[];
}

export interface UnknownAST {
  kind: "unknown";
  code: string;
}

export interface PrimitiveAST {
  kind: "primitive";
  type: string;
}

export interface ResourceAST {
  kind: "resource";
  resource: string;
  collection?: boolean;
}

export interface ModelAST {
  kind: "model";
  model: string;
}

export interface StaticMethodCallAST {
  kind: "static_method_call";
  target: ParsedASTNode;
  name: string;
}

export interface NullsafePropertyAccessAST {
  kind: "nullsafe_property_access";
  target: ParsedASTNode;
  property: string;
}

export interface NewInstanceAST {
  kind: "new_instance";
  target: ParsedASTNode;
  resource?: string;
  collection?: boolean;
}

/* =========================
 *  5.1. CATAMORPHISM: PARSED AST VISITOR & MATCHER (0 IF, 0 SWITCH)
 * ========================= */

export interface ParsedASTVisitor<R> {
  readonly root: (node: RootASTNode) => R;
  readonly variable: (node: VariableAST) => R;
  readonly property_access: (node: PropertyAccessAST) => R;
  readonly method_call: (node: MethodCallAST) => R;
  readonly binary_expression: (node: BinaryExpressionAST) => R;
  readonly type_cast: (node: TypeCastAST) => R;
  readonly ternary: (node: TernaryAST) => R;
  readonly literal: (node: LiteralAST) => R;
  readonly null_literal: (node: NullLiteralAST) => R;
  readonly nullsafe_chain: (node: NullsafeChainAST) => R;
  readonly unknown: (node: UnknownAST) => R;
  readonly primitive: (node: PrimitiveAST) => R;
  readonly resource: (node: ResourceAST) => R;
  readonly model: (node: ModelAST) => R;
  readonly static_method_call: (node: StaticMethodCallAST) => R;
  readonly nullsafe_property_access: (node: NullsafePropertyAccessAST) => R;
  readonly new_instance: (node: NewInstanceAST) => R;
}

/**
 * 0 `if`, 0 `switch` Catamorphic Eliminator for ParsedASTNode
 */
export function matchParsedAST<R>(
  node: ParsedASTNode,
  visitor: ParsedASTVisitor<R>
): R {
  const handler = visitor[node.kind] as (n: ParsedASTNode) => R;
  return handler(node);
}

/* =========================
 *  6. SEMANTIC LAYER (FINAL RESOLUTION)
 * ========================= */

export type SemanticType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "array"
  | "object"
  | "model"
  | "resource"
  | "collection"
  | "nullable"
  | "json-object"
  | "json-member"
  | "BinaryFile"
  | "NewAccessToken"
  | "unknown";

export interface SemanticFieldEntry {
  readonly name: string;
  readonly type: SemanticType;
}

export class SemanticFieldSet implements Iterable<SemanticFieldEntry> {
  public readonly entries: readonly SemanticFieldEntry[];
  private readonly _lookup: ReadonlyMap<string, SemanticType>;

  constructor(entries: readonly SemanticFieldEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, SemanticType>();
    for (const e of entries) {
      map.set(e.name, e.type);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): SemanticFieldSet {
    return new SemanticFieldSet([]);
  }

  public static fromRecord(record: Readonly<{ readonly [name: string]: SemanticType }>): SemanticFieldSet {
    const entries: SemanticFieldEntry[] = Object.entries(record).map(([name, type]) => ({ name, type }));
    return new SemanticFieldSet(entries);
  }

  public static fromEntries(entries: readonly SemanticFieldEntry[]): SemanticFieldSet {
    return new SemanticFieldSet(entries);
  }

  public get(name: string): SemanticType | undefined {
    return this._lookup.get(name);
  }

  public getType(name: string): SemanticType | undefined {
    return this._lookup.get(name);
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public hasField(name: string): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<SemanticFieldEntry> {
    return this.entries[Symbol.iterator]();
  }

  public toRecord(): { readonly [name: string]: SemanticType } {
    return Object.fromEntries(this.entries.map(e => [e.name, e.type]));
  }
}

export interface SemanticNode extends Omit<SemanticResolution, 'fields'> {
  type: SemanticType;

  fields?: SemanticFieldSet;
}

export type SemanticRelationKind = 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany' | 'morphTo' | 'morphMany';

export interface BelongsToManyRelationContract {
  readonly kind: 'belongsToMany';
  readonly model: string;
  readonly foreignKey: string;
  readonly relatedKey: string;
  readonly pivotTable: string;
  readonly pivotFields: readonly (readonly [string, string])[];
}

export interface DirectRelationContract {
  readonly kind: 'hasOne' | 'hasMany' | 'belongsTo';
  readonly model: string;
  readonly foreignKey: string;
  readonly localKey: string;
}

export interface MorphRelationContract {
  readonly kind: 'morphTo' | 'morphMany';
  readonly model: string;
  readonly morphName: string;
  readonly morphType: string;
  readonly morphId: string;
}

/**
 * Level 7 Complete Closed ADT for SemanticRelation (0 undefined, 0 null, 0 ?:).
 */
export type SemanticRelationContract =
  | BelongsToManyRelationContract
  | DirectRelationContract
  | MorphRelationContract;

export type SemanticRelation = {
  type: SemanticRelationKind;
  model: string;
  foreignKey?: string;
  localKey?: string;
  table?: string;
  pivot?: SemanticFieldSet;
};

/* =========================
 *  8. IR META (INCREMENTAL BUILD + CACHE)
 * ========================= */

export interface IRMeta {
  version: "ir.v2";

  stableHash: string;

  lineage: string[];

  createdAt?: string;

  tags?: string[];
}

/* =========================
 *  9. ROOT IR NODE
 * ========================= */

export interface SemanticIRNode {
  id: string;

  source: SourceRef;

  node: IRRawNode;

  semantic: SemanticNode;

  meta: IRMeta;

  context?: IRContext;
}

/* =========================
 *  10. SERVICE GRAPH INTELLIGENCE LAYER (IR v2 EXTENSION)
 * ========================= */

export type ExecutionLayer =
  | "controller"
  | "service"
  | "model"
  | "repository"
  | "unknown";

export interface ServiceDependency {
  from: string;   // ServiceA
  to: string;     // ServiceB
  type:
  | "calls"
  | "composes"
  | "depends_on_model"
  | "uses_repository";
  /**
   * Cardinality Eloquent relation asli ('hasMany' | 'belongsTo' | 'hasOne' |
   * 'belongsToMany' | 'morphTo' | dst), kalau edge ini berasal dari model
   * relation. `type` di atas tetap 'depends_on_model' untuk semuanya demi
   * backward-compat (ContractGraph.ts mencocokkan `d.type === 'depends_on_model'`)
   * -- field ini yang membawa info cardinality yang sebelumnya dibuang oleh
   * ServiceGraphBuilder.
   */
  relationKind?: string;
  weight: number; // 0-1 strength
}

export interface ServiceNode {
  kind: "service_node";
  name: string;              // OrderService
  namespace?: string;        // App\Services
  methods: string[];         // ["getInvoice", "createOrder"]
  layer: "service";
  dependencies: ServiceDependency[];
  confidence: number;        // 0 - 1
}

export interface ControllerAction {
  name: string;
}

export interface ControllerNode {
  kind: "controller_node";
  name: string;              // OrderController
  routes: string[];          // ["/orders/{id}"]
  actions: ControllerAction[];
  layer: "controller";
  calls: string[];           // service methods it triggers
  confidence: number;
}

export interface ModelCastEntry {
  readonly column: string;
  readonly castType: string;
}

export class ModelCastCollection implements Iterable<ModelCastEntry> {
  public readonly casts: readonly ModelCastEntry[];
  private readonly _lookup: ReadonlyMap<string, string>;

  constructor(casts: readonly ModelCastEntry[]) {
    this.casts = Object.freeze([...casts]);
    const map = new Map<string, string>();
    for (const c of casts) {
      map.set(c.column, c.castType);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): ModelCastCollection {
    return new ModelCastCollection([]);
  }

  public static fromRecord(record: Readonly<{ readonly [column: string]: string }>): ModelCastCollection {
    const casts: ModelCastEntry[] = Object.entries(record).map(([column, castType]) => ({ column, castType }));
    return new ModelCastCollection(casts);
  }

  public static fromEntries(casts: readonly ModelCastEntry[]): ModelCastCollection {
    return new ModelCastCollection(casts);
  }

  public get(column: string): string | undefined {
    return this._lookup.get(column);
  }

  public getCast(column: string): string | undefined {
    return this._lookup.get(column);
  }

  public has(column: string): boolean {
    return this._lookup.has(column);
  }

  public hasCast(column: string): boolean {
    return this._lookup.has(column);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelCastEntry> {
    return this.casts[Symbol.iterator]();
  }

  public toRecord(): { readonly [column: string]: string } {
    return Object.fromEntries(this.casts.map(c => [c.column, c.castType]));
  }
}

export interface ModelNode {
  kind: "model_node";
  name: string;              // Order
  table?: string;            // orders
  /**
   * Strongly-typed ModelFieldMap replacing naked Record.
   * Carries column type and nullable flag from ParsedColumn.
   */
  fields?: ModelFieldMap;
  /**
   * Strongly-typed ModelRelationMap replacing naked Record.
   * Carries relation type (hasMany, belongsTo, etc.) and target model.
   */
  relations?: ModelRelationMap;
  /**
   * Accessors (camelCase getter) and casts carried from manifest.
   */
  accessors?: ModelAccessorMap;
  casts?: ModelCastCollection;
  layer: "model";
  confidence: number;
}

export interface ServiceGraph {
  services: ModelServiceMap<ServiceNode>;
  controllers: ModelControllerMap<ControllerNode>;
  models: ModelNodeMap<ModelNode>;
  edges: ServiceDependency[];
}

/* =========================
 *  11. KERNEL V2 SPEC (LOCKED CONTRACT)
 * ========================= */

export interface IRContext {
  modelMap: SemanticModelMap<SemanticType>;
  relationMap: SemanticRelationMap<SemanticRelation>;
  config?: {
    strictMode: boolean;
  };

  layer?: ExecutionLayer;
  controller?: ControllerNode;
  service?: ServiceNode;
  model?: ModelNode;
  graph?: {
    entrypoint?: boolean;
    visited?: string[];
  };
}

export interface SemanticKernelV2 {
  resolve(
    node: ParsedASTNode,
    context: IRContext
  ): SemanticNode;
}

/* =========================
 *  11. ZOD AST (NO STRING GENERATION)
 * ========================= */

export type ZodAST =
  | ZodObjectNode
  | ZodStringNode
  | ZodNumberNode
  | ZodBooleanNode
  | ZodArrayNode
  | ZodOptionalNode
  | ZodUnionNode
  | ZodLiteralNode
  | ZodUnknownNode;

/* ---------- ZOD NODES ---------- */

export interface ZodPropertyEntry {
  readonly key: string;
  readonly schema: ZodAST;
}

export class ZodObjectShape implements Iterable<ZodPropertyEntry> {
  public readonly properties: readonly ZodPropertyEntry[];
  private readonly _lookup: ReadonlyMap<string, ZodAST>;

  constructor(properties: readonly ZodPropertyEntry[]) {
    this.properties = Object.freeze([...properties]);
    const map = new Map<string, ZodAST>();
    for (const p of properties) {
      map.set(p.key, p.schema);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): ZodObjectShape {
    return new ZodObjectShape([]);
  }

  public static fromRecord(record: Readonly<{ readonly [key: string]: ZodAST }>): ZodObjectShape {
    const properties: ZodPropertyEntry[] = Object.entries(record).map(([key, schema]) => ({ key, schema }));
    return new ZodObjectShape(properties);
  }

  public static fromEntries(properties: readonly ZodPropertyEntry[]): ZodObjectShape {
    return new ZodObjectShape(properties);
  }

  public get(key: string): ZodAST | undefined {
    return this._lookup.get(key);
  }

  public getProperty(key: string): ZodAST | undefined {
    return this._lookup.get(key);
  }

  public has(key: string): boolean {
    return this._lookup.has(key);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ZodPropertyEntry> {
    return this.properties[Symbol.iterator]();
  }

  public toRecord(): { readonly [key: string]: ZodAST } {
    return Object.fromEntries(this.properties.map(p => [p.key, p.schema]));
  }
}

export interface ZodObjectNode {
  kind: "zod_object";
  shape: ZodObjectShape;
}

export interface ZodStringNode {
  kind: "zod_string";
}

export interface ZodNumberNode {
  kind: "zod_number";
}

export interface ZodBooleanNode {
  kind: "zod_boolean";
}

export interface ZodArrayNode {
  kind: "zod_array";
  element: ZodAST;
}

export interface ZodOptionalNode {
  kind: "zod_optional";
  inner: ZodAST;
}

export interface ZodUnionNode {
  kind: "zod_union";
  options: ZodAST[];
}

export interface ZodLiteralNode {
  kind: "zod_literal";
  value: string | number | boolean;
}

export interface ZodUnknownNode {
  kind: "zod_unknown";
}

/* =========================
 *  12. SDK CONTRACT LAYER
 * ========================= */

export interface GeneratedSDKModule {
  routeName: string;

  endpoint: string;

  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  request: RequestContract;

  response: ResponseContract;

  hooks: ReactQueryHooks;

  zod: ZodContract;
}

export interface RouteParamTypeMap {
  [param: string]: "string" | "number";
}

export interface RouteQueryTypeMap {
  [query: string]: "string" | "number" | "boolean";
}

export interface RequestPayloadContract {
  readonly params: readonly (readonly [string, 'string' | 'number'])[];
  readonly query: readonly (readonly [string, 'string' | 'number' | 'boolean'])[];
  readonly body: ZodAST;
}

export type RequestContract = {
  params?: RouteParamTypeMap;
  query?: RouteQueryTypeMap;
  body?: ZodAST;
};

export interface ModelResponsePayloadContract {
  readonly type: 'model';
  readonly model: string;
  readonly schema: ZodAST;
  readonly semantic: SemanticNode;
  readonly confidence: number;
}

export interface NonModelResponsePayloadContract {
  readonly type: 'object' | 'array' | 'primitive';
  readonly schema: ZodAST;
  readonly semantic: SemanticNode;
  readonly confidence: number;
}

export type ResponsePayloadContract =
  | ModelResponsePayloadContract
  | NonModelResponsePayloadContract;

export type ResponseContract = {
  type: "object" | "array" | "primitive" | "model";
  model?: string;
  schema: ZodAST;
  semantic: SemanticNode;
  confidence: number;
};

export interface ZodContract {
  ast: ZodAST;

  imports: string[];
}

export interface QueryHookContract {
  readonly kind: 'query';
  readonly key: readonly string[];
  readonly hookName: string;
  readonly enabled: boolean;
}

export interface MutationHookContract {
  readonly kind: 'mutation';
  readonly key: readonly string[];
  readonly hookName: string;
}

/**
 * Level 7 Complete ADT for ReactQueryHooks (0 undefined, 0 null, 0 ?:).
 */
export type ReactQueryHooksContract = QueryHookContract | MutationHookContract;

export type ReactQueryHooks = {
  key: string[];
  useQuery?: string;
  useMutation?: string;
  enabled?: boolean;
};
export {
  type ResolutionStatus,
  type TraceNode,
  type SemanticResolution,
  type JsonObjectResolution,
  type AccessKind,
  type JsonMemberResolution
} from './contract';