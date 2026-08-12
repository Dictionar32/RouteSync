import { RouteManifest, camelCase, SemanticResolutionKernel, ServiceGraphBuilder } from '@routesync/core'
import type { FieldNode } from '@routesync/core'
import { PhpCodeParser } from '../parsers/PhpCodeParser'

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
  /** Raw source text for literal AST nodes emitted by the PHP extractor, e.g. `{"kind":"literal","code":"{\"kind\":\"model\",...}"}`. */
  code?: string
  /** Nested field map for `kind: 'object'` shapes (mirrors SemanticNode.fields). */
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

function hasResolved(v: unknown): v is { resolved: SemanticNode } {
  return typeof v === 'object' && v !== null && 'resolved' in v
}

function hasSemantic(v: unknown): v is { semantic: SemanticNode } {
  return typeof v === 'object' && v !== null && 'semantic' in v
}

export function getSemanticNode(v: unknown): SemanticNode | undefined {
  if (!v || typeof v !== 'object') return undefined
  if (hasResolved(v)) return v.resolved
  if (hasSemantic(v)) return v.semantic
  const typed = v as Record<string, unknown>
  if (typed.status || typed.type || typed.kind) {
    return typed as unknown as SemanticNode
  }
  return undefined
}

export function unwrapManifestNode(v: unknown): unknown {
  if (v && typeof v === 'object' && 'node' in v) {
    return (v as { node: unknown }).node
  }
  return v
}

export function inferTypeFromName(name: string): "string" | "number" | "boolean" | "unknown" {
  const lowerName = name.toLowerCase()
  if (
    lowerName.endsWith('minor') ||
    lowerName.endsWith('amount') ||
    lowerName.endsWith('price') ||
    lowerName.endsWith('harga') ||
    lowerName.endsWith('count') ||
    lowerName.endsWith('qty') ||
    lowerName.endsWith('id') ||
    lowerName === 'rating'
  ) {
    return 'number'
  }
  if (
    lowerName.endsWith('url') ||
    lowerName.endsWith('redirect') ||
    lowerName.endsWith('name') ||
    lowerName.endsWith('token') ||
    lowerName.endsWith('number') ||
    lowerName.endsWith('status') ||
    lowerName.endsWith('reason') ||
    lowerName.endsWith('provider') ||
    lowerName.endsWith('code')
  ) {
    return 'string'
  }
  if (
    lowerName.startsWith('is') ||
    lowerName.startsWith('has') ||
    lowerName.startsWith('was') ||
    lowerName.endsWith('paid')
  ) {
    return 'boolean'
  }
  if (
    lowerName.endsWith('at') ||
    lowerName.endsWith('date') ||
    lowerName.endsWith('time')
  ) {
    return 'string'
  }
  return 'unknown'
}

import { CompilerContext, CompilerPipeline } from './pipeline'
import { ModelGraphBuilderPass, SemanticResolutionPass, NormalizationPass, ValidationPass } from './passes'

// Stateless normalizer with SRP sub-functions
export function normalizeManifest(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedManifest {
  const context = new CompilerContext()
  const pipeline = new CompilerPipeline()

  pipeline.addPass(new ModelGraphBuilderPass(kernel))
  pipeline.addPass(new SemanticResolutionPass())
  pipeline.addPass(new NormalizationPass(kernel))
  pipeline.addPass(new ValidationPass())

  const result = pipeline.compile(manifest, context)

  if (context.hasErrors()) {
    const errorMsg = context.diagnostics
      .filter(d => d.severity === 'error')
      .map(d => `[Error] ${d.message}`)
      .join('\n')
    throw new Error(`Compiler execution halted due to validation errors:\n${errorMsg}`)
  }

  return result
}

function buildModelGraph(manifest: RouteManifest, kernel: SemanticResolutionKernel): void {
  const graphBuilder = new ServiceGraphBuilder()
  if (manifest.models) {
    manifest.models.forEach(m => {
      const modelNode = graphBuilder.buildModelNode(m.name)
      const fields: Record<string, { type: string; nullable: boolean }> = {}
      m.columns.forEach(col => {
        let type = 'string'
        const lower = col.type.toLowerCase()
        if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number'
        else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean'
        fields[col.name] = { type, nullable: !!col.nullable }
      })
      // ServiceGraphBuilder's ModelNode exposes mutable data fields on the
      // freshly-built node; we populate them before the graph is handed to
      // the kernel. Kedua ModelNode (graph & kernel) kini berbagi bentuk
      // data yang sama, jadi tidak perlu cast.
      modelNode.fields = fields
      if (m.relations) {
        modelNode.relations = m.relations
      }
      if (m.accessors) {
        modelNode.accessors = m.accessors
      }
      // casts wajib dibawa — lihat komentar di commands/scan.ts; tanpa ini
      // kolom ber-cast tidak pernah jadi 'json-object' dan rantai ternary
      // (is_array($x) ? ($x['k'] ?? null) : null) tidak ter-resolve di jalur
      // generate ini (normalizeResources → kernel.resolve).
      if (m.casts) {
        modelNode.casts = m.casts
      }
      graphBuilder.getGraph().models[m.name] = modelNode
    })
  }
  // KNOWN ISSUE (not fixed here — needs an architectural decision):
  // There are still TWO structurally different `ModelNode` interfaces in @routesync/core:
  //   - types/semantic.ts    ModelNode: { kind: 'model_node', layer: 'model' (required), confidence: number (required) }
  //   - semantic/types.ts    ModelNode: { layer?: string (optional), no kind/confidence }
  // ServiceGraph.models uses the first; SemanticResolutionKernel.loadGraph expects the second.
  // Field data (fields/relations/accessors/casts) kini identik bentuknya, jadi
  // assignment typechecks tanpa cast — sisanya tinggal metadata (kind/layer/confidence).
  // Pick one and rename/merge before the next consumer trips on the metadata difference.
  kernel.loadGraph(graphBuilder.getGraph())
}

export function normalizeResources(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedResource[] {
  const normalizedResources: NormalizedResource[] = []
  if (!manifest.resources) return normalizedResources

  manifest.resources.forEach(res => {
    const parsedAssignments: Record<string, unknown> = {}
    const resolvedAssignments: Record<string, SemanticNode> = {}
    const context: ResolutionContext = {
      layer: 'resource',
      fileName: res.name,
      modelMap: {},
      relationMap: {},
      assignments: parsedAssignments,
      resolvedAssignments: resolvedAssignments
    }

    if (res.assignments) {
      for (const varName in res.assignments) {
        const code = res.assignments[varName]
        const ast = PhpCodeParser.parseExpression(code, {})
        parsedAssignments[varName] = ast
        const resolved = kernel.resolve(ast, context)
        if (resolved && resolved.status !== 'unknown') {
          resolvedAssignments[varName] = resolved as SemanticNode
        }
      }
    }

    const patchField = (field: RuntimeAugmented) => {
      if (!field) return
      if (field.kind === 'object' && field.fields) {
        Object.values(field.fields).forEach(f => patchField(f as RuntimeAugmented))
      } else {
        const meta = field.resolved || field.semantic
        const ast = field.parsed_ast || (field.node && (field.node as RuntimeAugmented).parsed_ast)
          || (field.kind && field.kind !== 'object' && field.kind !== 'raw_code' ? field : null)
        if ((!meta || meta.status === 'unknown' || meta.type === 'unknown') && ast) {
          const resolved = kernel.resolve(ast as FieldNode, context)
          if (resolved && resolved.status !== 'unknown') {
            field.resolved = resolved
          }
        }
      }
    }

    Object.values(res.fields).forEach((field: unknown) => {
      patchField(field as RuntimeAugmented)
    })

    // Map to NormalizedFields
    const fields: Record<string, NormalizedField> = {}
    const visited = new Set<string>()
    for (const [fieldName, fieldDef] of Object.entries(res.fields)) {
      fields[fieldName] = mapToNormalizedField(fieldDef, fieldName, visited)
    }

    normalizedResources.push({
      symbolId: `resource:${res.name}`,
      name: res.name,
      fields,
      loc: res.sourceFile ? { file: res.sourceFile, line: res.sourceLine || 1 } : undefined
    })
  })

  return normalizedResources
}

export function normalizeModels(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedModel[] {
  const normalizedModels: NormalizedModel[] = []
  if (!manifest.models) return normalizedModels

  manifest.models.forEach(m => {
    const fields: Record<string, NormalizedField> = {}
    const casts = m.casts || {}
    
    m.columns.forEach(col => {
      let type: "string" | "number" | "boolean" | "null" = "string"
      const lower = col.type.toLowerCase()
      if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number'
      else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean'

      const castType = casts[col.name]
      if (castType) {
        const lowerCast = castType.toLowerCase()
        if (lowerCast.includes('int') || lowerCast.includes('float') || lowerCast.includes('double') || lowerCast.includes('real')) type = 'number'
        else if (lowerCast.includes('bool') || lowerCast === 'boolean') type = 'boolean'
        else if (lowerCast === 'array' || lowerCast === 'json' || lowerCast === 'object' || lowerCast === 'collection') type = 'string'
      }

      fields[col.name] = {
        kind: "primitive",
        type,
        nullable: !!col.nullable
      }
    })

    const accessors: Record<string, NormalizedAccessor> = {}
    const visited = new Set<string>()
    if (m.accessors) {
      for (const [accName, accDef] of Object.entries(m.accessors)) {
        accessors[accName] = normalizeAccessor(accName, accDef, accName, visited)
      }
    }

    normalizedModels.push({
      symbolId: `model:${m.name}`,
      name: m.name,
      tableName: m.table,
      fields,
      accessors,
      appends: m.appends
    })
  })

  return normalizedModels
}

export function normalizeRoutes(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedRoute[] {
  const normalizedRoutes: NormalizedRoute[] = []
  if (!manifest.routes) return normalizedRoutes

  manifest.routes.forEach(route => {
    const parsedAssignments: Record<string, unknown> = {}
    const resolvedAssignments: Record<string, SemanticNode> = {}
    const context: ResolutionContext = {
      layer: 'route',
      fileName: route.name,
      modelMap: {},
      relationMap: {},
      assignments: parsedAssignments,
      resolvedAssignments: resolvedAssignments
    }

    if (route.assignments) {
      for (const varName in route.assignments) {
        const code = route.assignments[varName]
        const ast = PhpCodeParser.parseExpression(code, {})
        parsedAssignments[varName] = ast
        const resolved = kernel.resolve(ast, context)
        if (resolved && resolved.status !== 'unknown') {
          resolvedAssignments[varName] = resolved as SemanticNode
        }
      }
    }

    const resolveResponse = (meta: unknown) => {
      if (!meta) return
      const augmentedMeta = meta as RuntimeAugmented
      if (augmentedMeta.kind === 'object' && augmentedMeta.fields) {
        Object.values(augmentedMeta.fields).forEach((field: unknown) => {
          const augmentedField = field as RuntimeAugmented
          const ast = augmentedField.parsed_ast || (augmentedField.node && (augmentedField.node as RuntimeAugmented).parsed_ast)
            || (augmentedField.kind && augmentedField.kind !== 'object' && augmentedField.kind !== 'raw_code' ? augmentedField : null)
          if (ast) {
            const resolved = kernel.resolve(ast as FieldNode, context)
            if (resolved && resolved.status !== 'unknown') {
              augmentedField.resolved = resolved
            }
          }
          resolveResponse(field)
        })
      }
    }
    resolveResponse(route.response)

    const visited = new Set<string>()
    const responseField = mapToNormalizedField(route.response, 'response', visited)
    let method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET"
    const upperMethod = route.method.toUpperCase()
    if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(upperMethod)) {
      method = upperMethod as "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
    }

    normalizedRoutes.push({
      symbolId: `route:${route.name || route.uri}`,
      method,
      uri: route.uri || route.path,
      actionName: route.actionName || 'index',
      controllerName: route.controllerName || '',
      response: responseField
    })
  })

  return normalizedRoutes
}

function normalizeAccessor(
  name: string,
  accessorDef: unknown,
  fieldName: string,
  visited: Set<string>
): NormalizedAccessor {
  const augmentedDef = accessorDef as RuntimeAugmented
  const semantic = augmentedDef?.semantic
  let returnType: NormalizedField
  if (semantic && semantic.status === 'resolved') {
    returnType = mapToNormalizedField(accessorDef, fieldName, visited)
  } else {
    const expr = augmentedDef?.expression as { type?: string } | undefined
    if (!expr) {
      const inferred = inferTypeFromName(fieldName)
      returnType = { kind: "primitive", type: inferred === "unknown" ? "string" : inferred, nullable: true }
    } else {
      let primitiveType: "string" | "number" | "boolean" | "null" = "string"
      if (expr.type === 'number') primitiveType = 'number'
      else if (expr.type === 'string') primitiveType = 'string'
      else if (expr.type === 'boolean') primitiveType = 'boolean'

      returnType = { kind: "primitive", type: primitiveType, nullable: true }
    }
  }
  return {
    name,
    returnType
  }
}

function mapToNormalizedField(
  fieldDef: unknown,
  fieldName: string,
  visited: Set<string>,
  currentPath: string = ''
): NormalizedField {
  if (!fieldDef) {
    const inferred = inferTypeFromName(fieldName)
    return {
      kind: "primitive",
      type: inferred === "unknown" ? "string" : inferred,
      nullable: true
    }
  }

  // Circular reference path tracking
  const path = currentPath ? `${currentPath}.${fieldName}` : fieldName
  if (visited.has(path)) {
    return {
      kind: "primitive",
      type: "string",
      nullable: true
    }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(path)

  const meta = getSemanticNode(fieldDef)
  if (!meta || meta.status === 'unknown' || meta.type === 'unknown') {
    const inferred = inferTypeFromName(fieldName)
    return {
      kind: "primitive",
      type: inferred === "unknown" ? "string" : inferred,
      nullable: true
    }
  }

  const type = meta.type || meta.kind
  const model = meta.model
  const resource = meta.resource
  const collection = !!meta.collection
  const nullable = !!meta.nullable

  if (type === 'model' && model) {
    return {
      kind: "model",
      modelName: model,
      collection,
      paginated: !!meta.paginated,
      nullable
    }
  }

  if (type === 'resource' && resource) {
    return {
      kind: "resource",
      resourceName: resource,
      collection,
      paginated: !!meta.paginated,
      nullable
    }
  }

  if (type === 'object') {
    const fields: Record<string, NormalizedField> = {}
    if (meta.fields) {
      for (const [k, v] of Object.entries(meta.fields)) {
        fields[k] = mapToNormalizedField(v, k, nextVisited, path)
      }
    }
    return {
      kind: "object",
      fields,
      nullable
    }
  }

  let primitiveType: "string" | "number" | "boolean" | "null" = "string"
  if (type === 'number') primitiveType = 'number'
  else if (type === 'string') primitiveType = 'string'
  else if (type === 'boolean') primitiveType = 'boolean'
  else if (type === 'null') primitiveType = 'null'
  else {
    const inferred = inferTypeFromName(fieldName)
    if (inferred !== 'unknown') {
      primitiveType = inferred
    }
  }

  return {
    kind: "primitive",
    type: primitiveType,
    nullable
  }
}
