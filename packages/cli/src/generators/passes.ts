import { RouteManifest, SemanticResolutionKernel, ServiceGraphBuilder, SemanticModelNode, DATABASE_COLUMN_KIND_REGISTRY } from '@routesync/core'
import { PhpCodeParser } from '../parsers/PhpCodeParser'
import { CompilerPass, CompilerContext } from './pipeline'
import {
  NormalizedManifest,
  NormalizedRoute,
  NormalizedModel,
  NormalizedResource,
  NormalizedField,
  SemanticNode,
  RuntimeAugmented,
  ResolutionContext,
  getSemanticNode,
  inferTypeFromName,
  normalizeModels,
  normalizeResources,
  normalizeRoutes
} from './normalizer'

export class ModelGraphBuilderPass implements CompilerPass<RouteManifest, { manifest: RouteManifest; kernel: SemanticResolutionKernel }> {
  readonly id = "graph-builder"
  readonly name = "ModelGraphBuilder"
  readonly inputKind = "RouteManifest"
  readonly outputKind = "ResolvedManifest"

  constructor(private externalKernel?: SemanticResolutionKernel) {}

  run(manifest: RouteManifest, context: CompilerContext): { manifest: RouteManifest; kernel: SemanticResolutionKernel } {
    const kernel = this.externalKernel || new SemanticResolutionKernel()
    const graphBuilder = new ServiceGraphBuilder()
    
    if (manifest.models) {
      manifest.models.forEach(m => {
        const modelNode = graphBuilder.buildModelNode(m.name)
        const fields: Record<string, unknown> = {}
        m.columns.forEach(col => {
          let type = 'string'
          if (col.columnKind && DATABASE_COLUMN_KIND_REGISTRY[col.columnKind]) {
            type = DATABASE_COLUMN_KIND_REGISTRY[col.columnKind].tsType
          } else {
            const lower = col.type.toLowerCase()
            if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number'
            else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean'
          }
          fields[col.name] = { type, nullable: !!col.nullable }
        })
        
        const semanticModelNode = modelNode as unknown as SemanticModelNode
        semanticModelNode.fields = fields
        if (m.relations) {
          semanticModelNode.relations = m.relations
        }
        if (m.accessors) {
          semanticModelNode.accessors = m.accessors
        }
        // casts wajib dibawa — lihat komentar di commands/scan.ts; tanpa ini
        // kolom ber-cast (mis. `detail` => 'array') tidak pernah jadi
        // 'json-object' dan rantai ternary is_array($x) ? ($x['k'] ?? null)
        // : null tidak ter-resolve (SymbolTable.cast() selalu undefined).
        if (m.casts) {
          semanticModelNode.casts = m.casts
        }
        graphBuilder.getGraph().models[m.name] = modelNode
      })
    }
    kernel.loadGraph(graphBuilder.getGraph())

    return { manifest, kernel }
  }
}

export class SemanticResolutionPass implements CompilerPass<{ manifest: RouteManifest; kernel: SemanticResolutionKernel }, RouteManifest> {
  readonly id = "semantic-resolver"
  readonly name = "SemanticResolution"
  readonly inputKind = "ResolvedManifest"
  readonly outputKind = "ResolvedManifest"

  run(input: { manifest: RouteManifest; kernel: SemanticResolutionKernel }, context: CompilerContext): RouteManifest {
    const { manifest, kernel } = input

    // 1. Resolve resources assignments
    if (manifest.resources) {
      manifest.resources.forEach(res => {
        const parsedAssignments: Record<string, unknown> = {}
        const resolvedAssignments: Record<string, SemanticNode> = {}
        const resolutionContext: ResolutionContext = {
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
            const resolved = kernel.resolve(ast, resolutionContext)
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
              const resolved = kernel.resolve(ast, resolutionContext)
              if (resolved && resolved.status !== 'unknown') {
                field.resolved = resolved
              }
            }
          }
        }

        Object.values(res.fields).forEach((field: unknown) => {
          patchField(field as RuntimeAugmented)
        })
      })
    }

    // 2. Resolve routes assignments
    if (manifest.routes) {
      manifest.routes.forEach(route => {
        const parsedAssignments: Record<string, unknown> = {}
        const resolvedAssignments: Record<string, SemanticNode> = {}
        const resolutionContext: ResolutionContext = {
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
            const resolved = kernel.resolve(ast, resolutionContext)
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
                const resolved = kernel.resolve(ast, resolutionContext)
                if (resolved && resolved.status !== 'unknown') {
                  augmentedField.resolved = resolved
                }
              }
              resolveResponse(field)
            })
          }
        }
        resolveResponse(route.response)
      })
    }

    return manifest
  }
}

export class NormalizationPass implements CompilerPass<RouteManifest, NormalizedManifest> {
  readonly id = "normalizer"
  readonly name = "Normalization"
  readonly inputKind = "ResolvedManifest"
  readonly outputKind = "NormalizedManifest"

  private kernel: SemanticResolutionKernel

  constructor(kernel: SemanticResolutionKernel) {
    this.kernel = kernel
  }

  run(manifest: RouteManifest, context: CompilerContext): NormalizedManifest {
    const resources = normalizeResources(manifest, this.kernel)
    const models = normalizeModels(manifest, this.kernel)
    const routes = normalizeRoutes(manifest, this.kernel)

    return {
      irVersion: 1,
      version: manifest.version,
      baseURL: manifest.baseURL,
      routes,
      models,
      resources
    }
  }
}

export class ValidationPass implements CompilerPass<NormalizedManifest, NormalizedManifest> {
  readonly id = "validator"
  readonly name = "Validation"
  readonly inputKind = "NormalizedManifest"
  readonly outputKind = "NormalizedManifest"

  run(manifest: NormalizedManifest, context: CompilerContext): NormalizedManifest {
    // 1. Validate route symbols and actions
    manifest.routes.forEach(route => {
      if (!route.controllerName) {
        context.reportDiagnostic({
          severity: "warning",
          message: `Route "${route.uri}" does not specify a controller name.`,
          loc: route.loc
        })
      }
    })

    // 2. Validate resource models exist
    const modelNames = new Set(manifest.models.map(m => m.name))
    manifest.resources.forEach(res => {
      const modelName = res.name.replace(/Resource$/, '')
      if (modelName && !modelNames.has(modelName)) {
        context.reportDiagnostic({
          severity: "info",
          message: `Resource "${res.name}" does not have a matching Eloquent model "${modelName}".`,
          loc: res.loc
        })
      }
    })

    return manifest
  }
}
