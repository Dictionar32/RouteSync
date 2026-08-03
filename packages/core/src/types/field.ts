/**
 * CompilerRoadmap.md Stage 2 follow-up — unified field representation.
 * See compiler/CompilerBacklog.md H1/H3 and the design review thread that
 * produced this (v1 -> v3, approved) for the reasoning behind every choice
 * here. Short version:
 *
 *   - Collapses 3 previously-parallel unions (ResourceFieldKind,
 *     ResponseMetadata, ParsedASTNode) into one, FieldNode.
 *   - Parser produces framework-agnostic AST only (no `resource`,
 *     no forced `model` on static calls). Laravel-specific facts
 *     (is this a Resource? a collection call?) live exclusively in
 *     `resolved`, decided by ResourceGraphResolver and nothing upstream.
 *   - `PrimitiveField`/`ModelField` are the exception: they're genuinely
 *     declared by LaravelRouteParser.ts's attribute/JSON-literal scan,
 *     not inferred, so they stay as raw kinds.
 *
 * MIGRATION STATUS (phase 1 of 3 — see compiler/CompilerBacklog.md):
 *   1. [this file] add the new model + adapters from the old one. DONE.
 *   2. migrate PhpCodeParser.ts / incremental.ts / SemanticResolutionKernel
 *      to use FieldNode internally; verify routesync.ir.json output is
 *      unchanged (or changed only as expected). NOT STARTED.
 *   3. delete ResourceFieldKind, ResponseMetadata, ParsedASTNode and the
 *      Scanned-vs-Parsed split once every consumer has moved. NOT STARTED.
 * Old types are untouched by this file and still work exactly as before.
 */

import type { SemanticResolution, AccessKind } from './contract'
import type { SourceRef, IRHints } from './semantic'

export interface BaseField {
  resolved?: SemanticResolution
  source?: SourceRef
}

/** Base for every kind PhpCodeParser produces from a code string — always carries the original text for debugging, so it isn't repeated on all 12 variants individually. */
export interface ParsedField extends BaseField {
  originalCode: string
}

/* ---------- declared kinds (known without parsing PHP code) ----------
   Constructed directly by LaravelRouteParser.ts's attribute/JSON-literal
   scan — never by PhpCodeParser. */

export interface PrimitiveField extends BaseField { kind: 'primitive'; type: string }

export interface ModelField extends BaseField { kind: 'model'; model: string; collection: boolean; paginated?: boolean }

export interface ObjectField extends BaseField { kind: 'object'; fields: Record<string, FieldNode> }

export interface UnknownField extends BaseField { kind: 'unknown'; code?: string }

/* ---------- raw / parsed kinds ---------- */

export interface RawCodeField extends BaseField { kind: 'raw_code'; code: string; hints?: IRHints }

export interface LiteralField extends ParsedField { kind: 'literal'; value: string | number | boolean | null }

export interface VariableField extends ParsedField { kind: 'variable'; name: string }

export interface PropertyAccessField extends ParsedField { kind: 'property_access'; target: FieldNode | null; property: string; accessKind: AccessKind }

export interface MethodCallField extends ParsedField { kind: 'method_call'; target: FieldNode | null; name: string; args: FieldNode[] }

export interface StaticMethodCallField extends ParsedField { kind: 'static_method_call'; className: string; name: string; args: FieldNode[] }

export interface BinaryExpressionField extends ParsedField { kind: 'binary_expression'; operator: string; left: FieldNode; right: FieldNode }

export interface TypeCastField extends ParsedField { kind: 'type_cast'; castType: 'int' | 'float' | 'string' | 'bool'; expression: FieldNode }

export interface TernaryField extends ParsedField { kind: 'ternary'; condition: FieldNode; truthy: FieldNode; falsy: FieldNode }

export interface NullsafeChainField extends ParsedField { kind: 'nullsafe_chain'; chain: FieldNode[] }

export interface NullsafePropertyAccessField extends ParsedField { kind: 'nullsafe_property_access'; target: FieldNode | null; property: string }

export interface NewInstanceField extends ParsedField { kind: 'new_instance'; className: string; args: FieldNode[] }

export type FieldNode =
  | PrimitiveField | ModelField | ObjectField | UnknownField
  | RawCodeField | LiteralField | VariableField | PropertyAccessField
  | MethodCallField | StaticMethodCallField | BinaryExpressionField
  | TypeCastField | TernaryField | NullsafeChainField
  | NullsafePropertyAccessField | NewInstanceField

/* ---------- unified route/resource/model definitions ---------- */
/* (*Def, not *Node: semantic.ts already has ServiceNode/ControllerNode/
   ModelNode for the service-graph layer.) */

export interface RouteDef {
  name: string
  method: string
  path: string
  auth: boolean
  middleware: string[]
  schema?: Record<string, unknown> | null
  response?: FieldNode | null
  assignments?: Record<string, string> | null
  stableHash?: string
  sourceFile?: string | null
  sourceLine?: number | null
}

export interface ResourceDef {
  name: string
  model?: string
  fields: Record<string, FieldNode>
  assignments?: Record<string, string>
  sourceFile?: string | null
  sourceLine?: number | null
}

export interface ModelDef {
  name: string
  table?: string
  columns?: { name: string; type: string; nullable: boolean }[]
  hidden?: string[]
  appends?: string[]
  casts?: Record<string, string>
  relations?: Record<string, { type: string; model: string }>
  accessors?: Record<string, FieldNode>
}
