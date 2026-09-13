/**
 * normalizerTypes.ts
 *
 * Core domain types and interfaces for the compiler normalizer IR.
 *
 * @module cli/generators/normalizer
 */

export interface SourceLocation {
  readonly file: string
  readonly line: number
  readonly column?: number
}

export type NormalizedField =
  | PrimitiveField
  | ObjectField
  | ModelField
  | ResourceField

export interface PrimitiveField {
  readonly kind: "primitive"
  readonly type: "string" | "number" | "boolean" | "null"
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface ObjectField {
  readonly kind: "object"
  readonly fields: Readonly<Record<string, NormalizedField>>
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface ModelField {
  readonly kind: "model"
  readonly modelName: string
  readonly collection: boolean
  readonly paginated?: boolean
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface ResourceField {
  readonly kind: "resource"
  readonly resourceName: string
  readonly collection: boolean
  readonly paginated?: boolean
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface NormalizedResource {
  readonly symbolId: string
  readonly name: string
  readonly fields: Readonly<Record<string, NormalizedField>>
  readonly loc?: SourceLocation
}

export interface NormalizedAccessor {
  readonly name: string
  readonly returnType: NormalizedField
  readonly loc?: SourceLocation
}

export interface NormalizedModel {
  readonly symbolId: string
  readonly name: string
  readonly tableName: string
  readonly fields: Readonly<Record<string, NormalizedField>>
  readonly accessors?: Readonly<Record<string, NormalizedAccessor>>
  readonly appends?: ReadonlyArray<string>
  readonly loc?: SourceLocation
}

export interface NormalizedRoute {
  readonly symbolId: string
  readonly method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  readonly uri: string
  readonly actionName: string
  readonly controllerName: string
  readonly response: NormalizedField
  readonly loc?: SourceLocation
}

export interface NormalizedManifest {
  readonly irVersion: 1
  readonly version: string
  readonly baseURL: string
  readonly routes: ReadonlyArray<NormalizedRoute>
  readonly models: ReadonlyArray<NormalizedModel>
  readonly resources: ReadonlyArray<NormalizedResource>
}

// Augmentation helper types and guards
export interface SemanticNode {
  status: string
  type: string
  model?: string
  resource?: string
  collection?: boolean
  paginated?: boolean
  nullable?: boolean
  fields?: Record<string, unknown>
  items?: unknown
  kind?: string
}

export type RuntimeAugmented<T = unknown> = T & {
  resolved?: SemanticNode
  semantic?: SemanticNode
  parsed_ast?: unknown
  node?: unknown
  kind?: string
  type?: string
  /** Raw source text for literal AST nodes emitted by the PHP extractor. */
  code?: string
  /** Nested field map for `kind: 'object'` shapes. */
  fields?: Record<string, unknown>
  /** Present on accessor definitions carrying a parsed PHP expression AST. */
  expression?: unknown
}

export interface ResolutionContext {
  readonly layer: "resource" | "route" | "model"
  readonly fileName: string
  readonly modelMap: Readonly<Record<string, string>>
  readonly relationMap: Readonly<Record<string, string>>
  readonly assignments: Readonly<Record<string, unknown>>
  readonly resolvedAssignments: Readonly<Record<string, SemanticNode>>
}
