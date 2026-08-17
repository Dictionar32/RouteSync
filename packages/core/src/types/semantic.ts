import { TraceNode, SemanticResolution } from './contract';
import type { FieldNode } from './field';

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

export interface SourceRef {
  file: string;
  line?: number;
  column?: number;

  context:
  | "controller"
  | "resource"
  | "model"
  | "route"
  | "service";
}

/* =========================
 *  3. RAW LAYER (IMMUTABLE INPUT)
 * ========================= */

export interface IRRawNode {
  kind: "raw_code";
  code: string;

  hints?: IRHints;

  parsed_ast?: ParsedASTNode;
}

/* =========================
 *  4. HINT SYSTEM (LIGHTWEIGHT SIGNALING ONLY)
 * ========================= */

export interface IRHints {
  pattern:
  | "property_access"
  | "method_call"
  | "binary_expression"
  | "type_cast"
  | "ternary"
  | "nullsafe_chain"
  | "collection"
  | "unknown";

  confidence?: number; // 0..1

  nullable?: boolean;

  framework_context?: "eloquent" | "resource" | "blade" | "unknown";
}

/* =========================
 *  5. PARSED AST (PHP -> TS STRUCTURE)
 * ========================= */

export type ParsedASTNode =
  | PropertyAccessAST
  | MethodCallAST
  | BinaryExpressionAST
  | TypeCastAST
  | TernaryAST
  | LiteralAST
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
  target: ParsedASTNode | null;
  property: string;
  /**
   * Explicit access classification emitted by the parser.
   * The adapter must not infer or default this value.
   */
  accessKind: AccessKind;
}

export interface MethodCallAST {
  kind: "method_call";
  target: ParsedASTNode | null;
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

export interface LiteralAST {
  kind: "literal";
  value: string | number | boolean | null;
}

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
  target: ParsedASTNode | null;
  name: string;
}

export interface NullsafePropertyAccessAST {
  kind: "nullsafe_property_access";
  target: ParsedASTNode | null;
  property: string;
}

export interface NewInstanceAST {
  kind: "new_instance";
  target: ParsedASTNode | null;
  resource?: string;
  collection?: boolean;
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

export interface SemanticNode extends SemanticResolution {
  type: SemanticType;

  fields?: Record<string, SemanticType>;
}

/**
 * Semantic Relation definition untuk relationMap
 */
export interface SemanticRelation {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany' | 'morphTo' | 'morphMany'
  model: string
  foreignKey?: string
  localKey?: string
  table?: string
  pivot?: Record<string, SemanticType>
}

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

export interface ModelNode {
  kind: "model_node";
  name: string;              // Order
  table?: string;            // orders
  /**
   * Dulu Record<string, string> (nama field -> tipe doang, nullable
   * hilang). Diperkaya supaya nullable ikut kebawa dari ParsedColumn
   * -- data ini sudah ditangkap scanner PHP (Schema::getColumns()),
   * cuma dibuang di ServiceGraphBuilder sebelumnya.
   */
  fields?: Record<string, { type: string; nullable: boolean }>;
  /**
   * Dulu string[] (nama relasi doang, type & target model hilang).
   * Diperkaya supaya cardinality (hasMany/belongsTo/dst) dan model
   * target ikut kebawa -- sama seperti di atas, datanya sudah ada
   * dari scanner, cuma dibuang.
   */
  relations?: Record<string, { type: string; model: string }>;
  /**
   * Accessors (camelCase getter) dan casts ikut dibawa dari manifest —
   * SymbolTable membaca keduanya dari node yang di-load
   * (SymbolTable.ts:31,39), jadi graph node yang tidak membawanya
   * membuat accessor/JSON-cast column jatuh ke fallback string.
   */
  accessors?: Record<string, { source?: SourceRef; ast?: FieldNode; semantic?: SemanticResolution }>;
  casts?: Record<string, string>;
  layer: "model";
  confidence: number;
}

export interface ServiceGraph {
  services: Record<string, ServiceNode>;
  controllers: Record<string, ControllerNode>;
  models: Record<string, ModelNode>;
  edges: ServiceDependency[];
}

/* =========================
 *  11. KERNEL V2 SPEC (LOCKED CONTRACT)
 * ========================= */

export interface IRContext {
  modelMap: Record<string, SemanticType>;
  relationMap: Record<string, SemanticRelation>;
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

export interface ZodObjectNode {
  kind: "zod_object";
  shape: Record<string, ZodAST>;
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

export interface RequestContract {
  params?: Record<string, "string" | "number">;

  query?: Record<string, "string" | "number" | "boolean">;

  body?: ZodAST;
}

export interface ResponseContract {
  type: "object" | "array" | "primitive" | "model";

  model?: string;

  schema: ZodAST;

  semantic: SemanticNode;

  confidence: number;
}

export interface ZodContract {
  ast: ZodAST;

  imports: string[];
}

export interface ReactQueryHooks {
  key: string[];

  useQuery?: string;

  useMutation?: string;

  enabled?: boolean;
}

export * from './contract';