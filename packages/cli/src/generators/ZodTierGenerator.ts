import { RouteManifest, camelCase, SemanticResolutionKernel, ServiceGraphBuilder } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { buildGeneratedRoutes, toTypeName, GeneratedRoute } from './names'
import { deriveGroupName } from './route-classifier'
import { PhpCodeParser } from '../parsers/PhpCodeParser'

export class ZodTierGenerator {
  private static knownSchemas = new Set<string>()

  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    this.knownSchemas.clear()
    if (manifest.models) {
      manifest.models.forEach(m => this.knownSchemas.add(`${m.name}Schema`))
    }
    if (manifest.resources) {
      manifest.resources.forEach(r => this.knownSchemas.add(`${r.name}Schema`))
    }

    const kernel = new SemanticResolutionKernel()
    const graphBuilder = new ServiceGraphBuilder()
    
    // Build a simple graph of models
    if (manifest.models) {
      manifest.models.forEach(m => {
        const modelNode = graphBuilder.buildModelNode(m.name)
        const fields: Record<string, any> = {}
        m.columns.forEach(col => {
          let type = 'string'
          const lower = col.type.toLowerCase()
          if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number'
          else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean'
          fields[col.name] = { type, nullable: !!col.nullable }
        })
        modelNode.fields = fields as any
        if (m.relations) {
          (modelNode as any).relations = m.relations
        }
        if (m.accessors) {
          (modelNode as any).accessors = m.accessors
        }
        graphBuilder.getGraph().models[m.name] = modelNode
      })
    }
    kernel.loadGraph(graphBuilder.getGraph())

    // Patch resources with Kernel
    if (manifest.resources) {
      manifest.resources.forEach(res => {
        const modelName = res.name.replace(/Resource$/, '')
        
        // Pre-parse and resolve assignments sequentially
        const parsedAssignments: Record<string, any> = {};
        const resolvedAssignments: Record<string, any> = {};
        const context = {
          layer: 'resource',
          fileName: res.name,
          modelMap: {},
          relationMap: {},
          assignments: parsedAssignments,
          resolvedAssignments: resolvedAssignments
        } as any;

        if (res.assignments) {
          for (const varName in res.assignments) {
            const code = res.assignments[varName];
            const ast = PhpCodeParser.parseExpression(code, {});
            parsedAssignments[varName] = ast;
            const resolved = kernel.resolve(ast, context);
            if (resolved && resolved.status !== 'unknown') {
              resolvedAssignments[varName] = resolved;
            }
          }
        }

        const patchField = (field: any) => {
          if (!field) return;
          if (field.kind === 'object' && field.fields) {
            Object.values(field.fields).forEach(f => patchField(f));
          } else {
            const meta = field.resolved || field.semantic;
            const ast = field.parsed_ast || (field.node && field.node.parsed_ast)
              // Phase 2 (FieldNode migration): incremental.ts no longer
              // wraps a resolved field in a surviving raw_code node with a
              // nested parsed_ast — the field itself IS the parsed node now.
              || (field.kind && field.kind !== 'object' && field.kind !== 'raw_code' ? field : null);
            if ((!meta || meta.status === 'unknown' || meta.type === 'unknown') && ast) {
              const resolved = kernel.resolve(ast, context)
              if (resolved && resolved.status !== 'unknown') {
                field.resolved = resolved
              }
            }
          }
        }

        Object.values(res.fields).forEach((field: any) => {
          patchField(field);
        })
      })
    }

    // Patch routes with Kernel
    if (manifest.routes) {
      manifest.routes.forEach(route => {
        const parsedAssignments: Record<string, any> = {};
        const resolvedAssignments: Record<string, any> = {};
        const context = {
          layer: 'route',
          fileName: route.name,
          modelMap: {},
          relationMap: {},
          assignments: parsedAssignments,
          resolvedAssignments: resolvedAssignments
        } as any;

        if (route.assignments) {
          for (const varName in route.assignments) {
            const code = route.assignments[varName];
            const ast = PhpCodeParser.parseExpression(code, {});
            parsedAssignments[varName] = ast;
            const resolved = kernel.resolve(ast, context);
            if (resolved && resolved.status !== 'unknown') {
              resolvedAssignments[varName] = resolved;
            }
          }
        }

        const resolveResponse = (meta: any) => {
          if (!meta) return;
          if (meta.kind === 'object' && meta.fields) {
            Object.values(meta.fields).forEach((field: any) => {
              const ast = field.parsed_ast || (field.node && field.node.parsed_ast)
              // Phase 2 (FieldNode migration): incremental.ts no longer
              // wraps a resolved field in a surviving raw_code node with a
              // nested parsed_ast — the field itself IS the parsed node now.
              || (field.kind && field.kind !== 'object' && field.kind !== 'raw_code' ? field : null);
              if (ast) {
                  const resolved = kernel.resolve(ast, context)
                  if (resolved && resolved.status !== 'unknown') {
                    field.resolved = resolved
                  }
              }
              resolveResponse(field);
            });
          }
        };
        resolveResponse(route.response);
      });
    }

    const groupedRoutes = buildGeneratedRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const allRoutes: any[] = []
    for (const group of Object.values(groupedRoutes)) {
      allRoutes.push(...group)
    }
    const allModels = manifest.models || []
    const allResources = manifest.resources || []

    // Ensure output directory exists (src/api/contract)
    const contractDir = path.join(outputDir, 'contract')
    await fs.ensureDir(contractDir)
      
    // Write the 3 unified files directly to contractDir
    await this.generateContract(contractDir, allRoutes, allModels, allResources, kernel)
    await this.generateSchema(contractDir, allRoutes, allModels)
    await this.generateField(contractDir, allRoutes, allModels)

    // Ensure output directory exists (src/api/types)
    const typesDir = path.join(outputDir, 'types')
    await fs.ensureDir(typesDir)

    // Write the 2 type files directly to typesDir
    await this.generateRead(typesDir, allModels, allResources, allRoutes, manifest.routes || [])
    await this.generateForm(typesDir, allRoutes, manifest.routes || [])

    // Ensure output directory exists (src/api/mappers)
    const mappersDir = path.join(outputDir, 'mappers')
    await fs.ensureDir(mappersDir)

    await this.generateMapper(mappersDir, allRoutes, allModels, allResources)
  }

  // 1. api-contract.ts (Backend Responses - Snake Case)
  private static async generateContract(dir: string, routes: GeneratedRoute[], models: any[], resources: any[], kernel?: any): Promise<void> {
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(`import { z } from 'zod'`)
    lines.push(``)

    let hasExports = false

    // Models -> DB Schema in snake_case
    for (const model of models) {
      hasExports = true
      lines.push(`export const ${model.name}Schema = z.object({`)
      
      const hidden = Array.isArray(model.hidden) ? model.hidden : []
      const casts = model.casts || {}

      for (const col of model.columns) {
        const isHidden = hidden.includes(col.name)
        const castType = casts[col.name]
        
        let zType = this.mapSqlTypeToZod(col.type)
        if (castType) zType = this.mapCastToZod(castType, zType)
        if (col.nullable) zType += '.nullable()'
        if (isHidden) zType += '.optional()'

        const safeName = col.name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? col.name : `"${col.name}"`
        lines.push(`  ${safeName}: ${zType},`)
      }
      
      const getZodTypeFromAccessor = (accessor: any): string => {
        const expr = accessor?.expression
        if (!expr) return 'z.unknown()'
        if (expr.type === 'number') return 'z.number()'
        if (expr.type === 'boolean') return 'z.boolean()'
        if (expr.type === 'string') return 'z.string()'
        if (expr.type === 'model' && expr.model) {
          const schemaName = `${expr.model}Schema`
          return this.knownSchemas.has(schemaName) ? schemaName : 'z.unknown()'
        }
        if (expr.type === 'resource' && expr.resource) {
          const schemaName = `${expr.resource}Schema`
          return this.knownSchemas.has(schemaName) ? schemaName : 'z.unknown()'
        }
        return 'z.unknown()'
      }

      const appends = Array.isArray(model.appends) ? model.appends : []
      for (const append of appends) {
        const safeAppend = append.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? append : `"${append}"`
        let zType = 'z.unknown()'
        if (model.accessors) {
          const accessor = model.accessors[append] || model.accessors[camelCase(append)]
          if (accessor) {
            zType = getZodTypeFromAccessor(accessor)
          }
        }
        lines.push(`  ${safeAppend}: ${zType}.optional(), // appended`)
      }

      if (model.accessors) {
        for (const [key, accessor] of Object.entries(model.accessors)) {
          if (hidden.includes(key)) continue
          
          // Skip if key is already output as an appended field (case-insensitive and camel/snake normalized)
          const isAppended = appends.some((a: string) => a.toLowerCase() === key.toLowerCase() || camelCase(a) === camelCase(key))
          if (isAppended) continue

          const safeName = key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? key : `"${key}"`
          const zType = getZodTypeFromAccessor(accessor)
          lines.push(`  ${safeName}: ${zType}.optional(), // accessor attribute`)
        }
      }
      lines.push(`})`)
      lines.push(``)
      
      lines.push(`export type ${model.name}ApiResponse = z.infer<typeof ${model.name}Schema>`)
      lines.push(`export const validate${model.name} = (payload: unknown): ${model.name}ApiResponse => ${model.name}Schema.parse(payload)`)
      lines.push(``)
    }

    // Resources -> Zod Schemas
    // Build dependency map
    const depMap = new Map<string, Set<string>>()
    const knownResourceNames = new Set(resources.map(r => r.name))
    for (const r of resources) {
      const deps = new Set<string>()
      if (r.fields) {
        for (const fieldDef of Object.values(r.fields)) {
          const fieldRefs = this.getReferencedResources(fieldDef, knownResourceNames)
          for (const ref of fieldRefs) {
            deps.add(ref)
          }
        }
      }
      depMap.set(r.name, deps)
    }

    const visited = new Set<string>()
    const recStack = new Set<string>()
    const circularResources = new Set<string>()
    const sortedList: string[] = []

    const dfs = (node: string) => {
      visited.add(node)
      recStack.add(node)

      const neighbors = depMap.get(node) || new Set<string>()
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor)
        } else if (recStack.has(neighbor)) {
          circularResources.add(node)
          circularResources.add(neighbor)
          for (const s of recStack) {
            circularResources.add(s)
          }
        }
      }

      recStack.delete(node)
      sortedList.push(node)
    }

    for (const r of resources) {
      if (!visited.has(r.name)) {
        dfs(r.name)
      }
    }

    const resourceMap = new Map<string, any>()
    for (const r of resources) {
      resourceMap.set(r.name, r)
    }

    for (const rName of sortedList) {
      const resource = resourceMap.get(rName)
      if (!resource) continue
      hasExports = true

      const isCircular = circularResources.has(rName)
      if (isCircular) {
        lines.push(`export const ${resource.name}Schema = z.lazy(() => z.object({`)
      } else {
        lines.push(`export const ${resource.name}Schema = z.object({`)
      }
      
      const parsedAssignments: Record<string, any> = {};
      if (resource.assignments) {
        for (const varName in resource.assignments) {
          const code = resource.assignments[varName];
          parsedAssignments[varName] = PhpCodeParser.parseExpression(code, {});
        }
      }

      for (const [fieldName, fieldDefRaw] of Object.entries(resource.fields as Record<string, any>)) {
        const fieldDef = fieldDefRaw as any
        const safeName = fieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? fieldName : `"${fieldName}"`
        const context = { layer: 'resource', fileName: resource.name, modelMap: {}, relationMap: {}, assignments: parsedAssignments };
        let zType = this.buildResponseZodType(fieldDef, kernel, context, fieldName)
        lines.push(`  ${safeName}: ${zType},`)
      }
      
      if (isCircular) {
        lines.push(`}))`)
      } else {
        lines.push(`})`)
      }
      lines.push(``)
      lines.push(`export type ${resource.name}Response = z.infer<typeof ${resource.name}Schema>`)
      lines.push(`export const validate${resource.name} = (payload: unknown): ${resource.name}Response => ${resource.name}Schema.parse(payload)`)
      lines.push(``)
    }


    // Routes -> ActionPayloads and Response Validators
    // Hitung response per resource untuk naming (single vs multiple)
    const contractResponseCount = new Map<string, number>()
    for (const route of routes) {
      if (route.response) {
        const r = route.groupName || deriveGroupName(route.path)
        contractResponseCount.set(r, (contractResponseCount.get(r) || 0) + 1)
      }
    }

    // Map classifier action → CRUD: post→Create, put/patch→Update, list→List, get→Get, delete→Delete
    const CONTRACT_ACTION_MAP: Record<string, string> = {
      post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
    }

    const generatedRespSchemas = new Set<string>() // dedup (PUT+PATCH → sama)

    for (const route of routes) {
      const resource = route.groupName || deriveGroupName(route.path)
      const TitleCaseResource = toTypeName(resource)
      const rawAction = CONTRACT_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
      const KeyName = TitleCaseResource + rawAction

      if (route.schema && route.schema.rules && Object.keys(route.schema.rules).length > 0) {
        // Skip payload duplikat (e.g., PUT + PATCH → ProfileUpdatePayload)
        if (generatedRespSchemas.has(`${KeyName}Payload`)) continue
        generatedRespSchemas.add(`${KeyName}Payload`)

        hasExports = true
        const ruleTree = this.buildRuleTree(route.schema.rules)
        const rootNode = { children: ruleTree, rules: 'required' }
        lines.push(`export const ${KeyName}PayloadSchema = ${this.generateZodRecursive(rootNode, 'root', false)}`)
        lines.push(`export type ${KeyName}Payload = z.infer<typeof ${KeyName}PayloadSchema>`)
        lines.push(`export const validate${KeyName}Payload = (payload: unknown): ${KeyName}Payload => ${KeyName}PayloadSchema.parse(payload)`)
        lines.push(``)
      }

      if (route.response) {
        // Parse route assignments for variable tracking (e.g., $user = $request->user())
        const routeAssignments: Record<string, any> = {}
        if ((route as any).assignments) {
          const rawAssignments = (route as any).assignments
          for (const [varName, code] of Object.entries(rawAssignments)) {
            try {
              routeAssignments[varName] = PhpCodeParser.parseExpression(code as string, {})
            } catch {}
          }
        }
        let zType = this.buildResponseZodType(route.response, kernel, { layer: 'route', fileName: route.name, modelMap: {}, relationMap: {}, assignments: routeAssignments })

        // Index/list routes return a collection — wrap in z.array() if not already detected as one
        if (route.actionName === 'list' && !zType.startsWith('z.array(') && !zType.includes('data:')) {
          zType = `z.array(${zType})`
        }

        // Naming: LoginResponse (single), ProfileUpdateResponse (multiple)
        const count = contractResponseCount.get(resource) || 1
        const respName = count === 1 ? TitleCaseResource : KeyName

        // Skip jika schema sudah ada (model schema already covers this)
        const schemaName = `${respName}ResponseSchema`
        if (generatedRespSchemas.has(schemaName) || this.knownSchemas.has(zType) && zType === schemaName) continue
        generatedRespSchemas.add(schemaName)

        hasExports = true
        lines.push(`export const ${schemaName} = ${zType}`)
        lines.push(`export type ${respName}Response = z.infer<typeof ${schemaName}>`)
        lines.push(`export const validate${respName}Response = (payload: unknown): ${respName}Response => ${schemaName}.parse(payload)`)
        lines.push(``)
      }
    }

    if (hasExports) {
      await fs.writeFile(path.join(dir, 'api-contract.ts'), lines.join('\n'))
    }
  }

  // Helper: Flatten nested response types (e.g., { data: { user: { id, name } } } -> { dataUserId, dataUserName })
  private static flattenResponseType(objDef: any, prefix: string = '', parentPath: string = ''): Array<{ name: string; type: string; path: string; optional?: boolean }> {
    const flattened: Array<{ name: string; type: string; path: string; optional?: boolean }> = []

    if (!objDef || !objDef.fields) return flattened

    for (const [fieldName, fieldDefRaw] of Object.entries(objDef.fields)) {
      const fieldDef = fieldDefRaw as any
      const fieldMeta = fieldDef.resolved || fieldDef.semantic || fieldDef
      const fieldCamelName = camelCase(fieldName)
      const flatFieldName = prefix
        ? `${prefix}${fieldCamelName.charAt(0).toUpperCase()}${fieldCamelName.slice(1)}`
        : fieldCamelName
      const fullPath = parentPath ? `${parentPath}.${fieldName}` : fieldName

      // If nested object, recursively flatten
      if ((fieldMeta.kind === 'object' || fieldMeta.type === 'object') && fieldMeta.fields) {
        const nestedFlattened = this.flattenResponseType(fieldMeta, flatFieldName, fullPath)
        flattened.push(...nestedFlattened)
      } else if (fieldMeta.type === 'model' && fieldMeta.collection && fieldMeta.paginated) {
        // Flatten paginated collection: reviews → reviewsData, reviewsCurrentPage, reviewsTotal
        const modelType = fieldMeta.model ? `${fieldMeta.model}Transformed` : 'unknown'
        flattened.push({ name: `${flatFieldName}Data`, type: `${modelType}[]`, path: `${fullPath}.data` })
        flattened.push({ name: `${flatFieldName}CurrentPage`, type: 'number', path: `${fullPath}.current_page`, optional: true })
        flattened.push({ name: `${flatFieldName}Total`, type: 'number', path: `${fullPath}.total`, optional: true })
      } else {
        // Regular field
        let tsType = this.mapResolvedToTsType(fieldMeta)
        if (fieldDef.nullable) tsType += ' | null | undefined'
        flattened.push({
          name: flatFieldName,
          type: tsType,
          path: fullPath
        })
      }
    }

    return flattened
  }

  private static getReferencedResources(field: any, knownResourceNames: Set<string>): Set<string> {
    const refs = new Set<string>()
    if (!field) return refs

    const walk = (node: any) => {
      if (!node) return
      
      if (node.kind === 'literal' && typeof node.code === 'string' && node.code.startsWith('{"kind":')) {
        try {
          const parsed = JSON.parse(node.code)
          walk(parsed)
          return
        } catch (e) {}
      }

      let meta = node.resolved || node.semantic || node
      
      if (meta.type === 'model' || meta.kind === 'model') {
        const resourceName = `${meta.model}Resource`
        if (knownResourceNames.has(resourceName)) {
          refs.add(resourceName)
        }
      } else if (meta.type === 'resource' || meta.kind === 'resource') {
        if (knownResourceNames.has(meta.resource)) {
          refs.add(meta.resource)
        }
      } else if (meta.type === 'object' || meta.kind === 'object') {
        if (meta.fields) {
          for (const val of Object.values(meta.fields)) {
            walk(val)
          }
        }
      } else {
        if (meta.model) {
          const resourceName = `${meta.model}Resource`
          if (knownResourceNames.has(resourceName)) {
            refs.add(resourceName)
          }
        }
      }
    }

    walk(field)
    return refs
  }

  private static buildResponseZodType(payload: any, kernel?: any, context?: any, propertyName?: string): string {
    if (!payload) return 'z.unknown()'
    
    // Check if it's already a string like "number", "string", "array" from a simple type map
    if (typeof payload === 'string') {
      if (payload === 'integer' || payload === 'number') return 'z.number()'
      if (payload === 'string') return 'z.string()'
      if (payload === 'boolean') return 'z.boolean()'
      if (payload === 'array') return 'z.array(z.unknown())'
      if (payload === 'object') return 'z.record(z.string(), z.unknown())'
      return 'z.unknown()'
    }

    let meta = payload.resolved || payload.semantic || payload
    
    // Fast path for inline JSON ASTs from PHP extractor
    const node = payload.node || payload;
    if (node && node.kind === 'literal' && typeof node.code === 'string' && node.code.startsWith('{"kind":')) {
      try {
        const parsed = JSON.parse(node.code);
        return this.buildResponseZodType(parsed, kernel, context, propertyName);
      } catch (e) {}
    }

    // Attempt on-the-fly resolution if we have a kernel and an AST
    let astToResolve = node?.parsed_ast || payload?.parsed_ast || (payload?.kind ? payload : null);
    if (kernel && (!meta || !meta.status || meta.status === 'unknown' || meta.type === 'unknown') && astToResolve) {
       const resolved = kernel.resolve(astToResolve, context || { layer: 'route', modelMap: {}, relationMap: {} });
       if (resolved.status === 'resolved' || resolved.status === 'partial') {
          meta = resolved;
          payload.resolved = resolved; // cache it!
       }
    }
    
    if (!meta || meta.status === 'unknown' || meta.type === 'unknown') return 'z.unknown()'
    
    let baseZod = 'z.unknown()'
    let isCollection = !!meta.collection
    let isPaginated = !!meta.paginated

    if (meta.type === 'model' || meta.kind === 'model') {
      const resourceName = `${meta.model}Resource`
      if (this.knownSchemas.has(`${resourceName}Schema`)) {
        baseZod = `${resourceName}Schema`
      } else {
        const schemaName = `${meta.model}Schema`
        baseZod = this.knownSchemas.has(schemaName) ? schemaName : 'z.unknown()'
      }
    } else if (meta.type === 'resource' || meta.kind === 'resource') {
      const schemaName = `${meta.resource}Schema`
      baseZod = this.knownSchemas.has(schemaName) ? schemaName : 'z.unknown()'
    } else if (meta.type === 'number') {
      baseZod = 'z.number()'
    } else if (meta.type === 'string') {
      baseZod = 'z.string()'
    } else if (meta.type === 'boolean') {
      baseZod = 'z.boolean()'
    } else if (meta.type === 'null') {
      baseZod = 'z.null()'
    } else if (meta.type === 'any') {
      baseZod = 'z.any()'
    } else if (meta.type === 'object' || meta.kind === 'object') {
      if (!meta.fields || Object.keys(meta.fields).length === 0) {
        baseZod = 'z.record(z.string(), z.unknown())'
      } else {
        const fields = Object.entries(meta.fields).map(([k, v]) => `${k}: ${this.buildResponseZodType(v, kernel, context, k)}`).join(', ')
        baseZod = `z.object({ ${fields} })`
      }
    } else if (meta.type === 'array' || meta.type === 'any[]' || meta.kind === 'array') {
      baseZod = 'z.unknown()'
      isCollection = true
    } else if (meta.type === 'json-object') {
      // Cast array/json column: shape unknown at compile time, but the value
      // itself is a structured object (never a scalar), so record() is a
      // more accurate contract than z.unknown().
      baseZod = 'z.record(z.string(), z.unknown())'
    } else if (meta.type === 'json-member') {
      // A key reached by descending into a json-object. The kernel tracked
      // the full access chain (see meta.trace), but deliberately leaves the
      // runtime value type undecided — that's an emitter decision, not a
      // resolver one.
      baseZod = 'z.unknown()'
    } else {
      // Check PHP Extractor fields (e.g. #[Response(Order::class)])
      let isModel = false
      let modelName = meta.type
      
      if (meta.type === 'model' && meta.model) {
        isModel = true
        modelName = meta.model
      }
      
      if (node && node.kind === 'literal' && typeof node.code === 'string' && node.code.includes('"kind":"model"')) {
        isModel = true
        if (node.code.includes('"collection":true')) isCollection = true
        if (node.code.includes('"paginated":true')) isPaginated = true
      }
      
      if (isModel) {
        const schemaName = `${modelName}Schema`
        if (this.knownSchemas.has(schemaName)) {
          baseZod = schemaName
        } else {
          baseZod = 'z.unknown()'
        }
      } else if (typeof meta.type === 'string' && meta.type !== 'unknown') {
        const schemaName = `${meta.type}Schema`
        if (this.knownSchemas.has(schemaName)) {
           baseZod = schemaName
        } else {
           baseZod = 'z.unknown()'
        }
      }
    }

    let result = baseZod
    if (isCollection) {
      if (isPaginated) {
         result = `z.object({ data: z.array(${baseZod}), current_page: z.number().optional(), total: z.number().optional() })`
      } else {
         result = `z.array(${baseZod})`
      }
    }
    if (meta && meta.nullable === true) {
      result = `${result}.nullable()`
    }
    return result
  }

  // 2. api-schema.ts (Frontend Forms - Camel Case)
  private static async generateSchema(dir: string, routes: GeneratedRoute[], models: any[]): Promise<void> {
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(`import { z } from 'zod'`)
    lines.push(``)

    let hasExports = false
    const typeName = "Api" // Unified API type prefix

    lines.push(`export const ${typeName}Schema = {`)

    const schemasDefined: { [key: string]: string } = {}

    // CRUD mapping (sama dengan generateForm)
    const SCHEMA_ACTION_MAP: Record<string, string> = {
      post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
    }
    const schemaContents = new Set<string>() // dedup

    for (const route of routes) {
      if (route.schema && route.schema.rules && Object.keys(route.schema.rules).length > 0) {
        hasExports = true
        const resource = route.groupName || deriveGroupName(route.path)

        const TitleCaseResource = toTypeName(resource)
        const rawAction = SCHEMA_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const KeyName = TitleCaseResource + rawAction

        // Skip duplikat (e.g., PUT+PATCH → ProfileUpdate)
        if (schemaContents.has(KeyName)) continue

        const ruleTree = this.buildRuleTree(route.schema.rules)
        const rootNode = { children: ruleTree, rules: 'required' }
        const zodStr = this.generateZodRecursive(rootNode, 'root')
        if (schemaContents.has(`${KeyName}:${zodStr}`)) continue // skip identical content
        schemaContents.add(KeyName)
        schemaContents.add(`${KeyName}:${zodStr}`)

        lines.push(`  ${KeyName}: ${zodStr},`)
        schemasDefined[KeyName] = `${typeName}Schema.${KeyName}`
      }
    }
    lines.push(`}`)
    lines.push(``)

    if (Object.keys(schemasDefined).length > 0) {
      lines.push(`export type ${typeName}FormValues = {`)
      for (const action of Object.keys(schemasDefined)) {
        lines.push(`  ${action}: z.infer<typeof ${schemasDefined[action]}>`)
      }
      lines.push(`}`)
      lines.push(``)

      lines.push(`export const ${typeName}DefaultValues = {`)
      for (const action of Object.keys(schemasDefined)) {
        const camelAction = action.charAt(0).toLowerCase() + action.slice(1)
        lines.push(`  ${camelAction}: {} as ${typeName}FormValues['${action}'],`)
      }
      lines.push(`}`)
      lines.push(``)

      lines.push(`export type ${typeName}FormIndex = keyof ${typeName}FormValues`)
      lines.push(``)

      lines.push(`export const ${typeName}FormValidators = {`)
      for (const action of Object.keys(schemasDefined)) {
        lines.push(`  validate${action}: (data: unknown): ${typeName}FormValues['${action}'] => ${schemasDefined[action]}.parse(data),`)
      }
      lines.push(`}`)
      lines.push(``)

      lines.push(`export type ${typeName}FormErrors<T extends ${typeName}FormIndex> = Partial<Record<keyof ${typeName}FormValues[T], string>>`)
    }

    if (hasExports) {
      await fs.writeFile(path.join(dir, 'api-schema.ts'), lines.join('\n'))
    }
  }

  // 3. api-field.ts (Mappers)
  private static async generateField(dir: string, routes: GeneratedRoute[], models: any[]): Promise<void> {
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(``)

    let hasExports = false
    const typeName = "Api"

    const fieldMap: Record<string, string> = {}

    // Extract fields from routes
    for (const route of routes) {
      if (route.schema && route.schema.rules) {
        for (const field of Object.keys(route.schema.rules)) {
          const parts = field.split('.')
          for (const part of parts) {
            if (part !== '*') {
              fieldMap[camelCase(part)] = part
            }
          }
        }
      }
    }

    // Extract fields from models
    for (const model of models) {
      for (const col of model.columns) {
        fieldMap[camelCase(col.name)] = col.name
      }
    }

    if (Object.keys(fieldMap).length > 0) {
      hasExports = true
      lines.push(`export const ${typeName}ApiField = {`)
      for (const [camel, original] of Object.entries(fieldMap)) {
        const constantKey = camel.toUpperCase()
        const safeKey = constantKey.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? constantKey : `"${constantKey}"`
        lines.push(`  ${safeKey}: "${original}",`)
      }
      lines.push(`} as const`)
    }

    if (hasExports) {
      await fs.writeFile(path.join(dir, 'api-field.ts'), lines.join('\n'))
    }
  }

  private static mapRulesToZod(ruleStr: string): string {
    const inMatch = ruleStr.match(/(?:^|\|)in:([^|]+)/)
    if (inMatch) {
      const isNumeric = ruleStr.includes('numeric') || ruleStr.includes('integer')
      const values = inMatch[1].split(',').map(v => v.trim())
      if (isNumeric) {
        return `z.union([${values.map(v => `z.literal(${v})`).join(', ')}])`
      }
      const stringValues = values.map(v => `'${v}'`)
      return `z.enum([${stringValues.join(', ')}])`
    }
    if (ruleStr.includes('array')) return 'z.array(z.unknown())'
    if (ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('digits')) return 'z.number()'
    if (ruleStr.includes('boolean') || ruleStr.includes('bool')) return 'z.boolean()'
    if (ruleStr.includes('file') || ruleStr.includes('image') || ruleStr.includes('mimes') || ruleStr.includes('mimetypes')) return 'z.instanceof(File)'
    return 'z.string()'
  }

  private static mapSqlTypeToZod(sqlType: string): string {
    const type = sqlType.toLowerCase()
    if (type === 'mixed' || type === 'unknown') {
      return 'z.unknown()'
    }
    if (type.includes('bool') || type.includes('tinyint(1)')) {
      return 'z.boolean()'
    }
    if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) {
      return 'z.number()'
    }
    if (type.includes('json')) {
      return 'z.record(z.string(), z.unknown())'
    }
    const enumMatch = type.match(/^enum\((.*)\)$/)
    if (enumMatch && enumMatch[1]) {
      const values = enumMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''))
      return `z.union([${values.map(v => `z.literal('${v}')`).join(', ')}])`
    }
    return 'z.string()'
  }

  private static mapCastToZod(castType: string, defaultType: string): string {
    const type = castType.toLowerCase()
    if (type.includes('int') || type.includes('float') || type.includes('decimal') || type.includes('double')) return 'z.number()'
    if (type.includes('bool')) return 'z.boolean()'
    if (type.includes('array') || type.includes('json') || type.includes('collection') || type.includes('object')) return 'z.record(z.string(), z.unknown())'
    if (type.includes('date') || type.includes('datetime') || type.includes('string')) return 'z.string()'
    return defaultType
  }

  // 4. api-read.ts (Frontend Read - Camel Case)
  private static async generateRead(dir: string, models: any[], resources: any[], routes: GeneratedRoute[], manifestRoutes: any[] = []): Promise<void> {
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(``)

    let hasExports = false

    for (const model of models) {
      hasExports = true
      lines.push(`export interface ${model.name}Transformed {`)
      
      const hidden = Array.isArray(model.hidden) ? model.hidden : []
      const casts = model.casts || {}

      for (const col of model.columns) {
        if (hidden.includes(col.name)) continue
        
        const castType = casts[col.name]
        let tsType = this.mapSqlTypeToTs(col.type)
        if (castType) tsType = this.mapCastToTs(castType, tsType)
        
        if (col.nullable) tsType += ' | null'
        
        const camelCol = camelCase(col.name)
        const safeName = camelCol.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelCol : `"${camelCol}"`
        lines.push(`  ${safeName}: ${tsType}`)
      }
      
      const getTsTypeFromAccessor = (accessor: any): string => {
        const expr = accessor?.expression
        if (!expr) return 'unknown'
        if (expr.type === 'number') return 'number'
        if (expr.type === 'boolean') return 'boolean'
        if (expr.type === 'string') return 'string'
        if (expr.type === 'model' && expr.model) {
          return `${expr.model}Transformed`
        }
        if (expr.type === 'resource' && expr.resource) {
          return `${expr.resource}Transformed`
        }
        return 'unknown'
      }

      const appends = Array.isArray(model.appends) ? model.appends : []
      for (const append of appends) {
        const camelAppend = camelCase(append)
        const safeAppend = camelAppend.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelAppend : `"${camelAppend}"`
        
        let tsType = 'unknown'
        if (model.accessors) {
          const accessor = model.accessors[append] || model.accessors[camelCase(append)]
          if (accessor) {
            tsType = getTsTypeFromAccessor(accessor)
          }
        }
        lines.push(`  ${safeAppend}?: ${tsType} // appended`)
      }
      lines.push(`}`)
      lines.push(``)
      
      lines.push(`export type ${model.name}Show = ${model.name}Transformed`)
      lines.push(`export type ${model.name}Index = ${model.name}Transformed[]`)
      lines.push(``)
    }

    // Resources -> Transformed (Camel Case) - with FLATTEN strategy for nested resources
    for (const resource of resources) {
      hasExports = true
      lines.push(`export interface ${resource.name}Transformed {`)
      
      for (const [fieldName, fieldDefRaw] of Object.entries(resource.fields as Record<string, any>)) {
        const fieldDef = fieldDefRaw as any
        const camelCol = camelCase(fieldName)
        const meta = fieldDef.resolved || fieldDef.semantic || fieldDef
        const resolvedType = meta.type || meta.kind
        
        // FLATTEN STRATEGY: If nested resource/model/object, flatten fields instead of nested type
        if ((resolvedType === 'resource' || resolvedType === 'model' || resolvedType === 'object') && meta.fields) {
          // Flatten nested fields with prefix
          const nestedFields = meta.fields as Record<string, any>
          for (const [nestedFieldName, nestedFieldDefRaw] of Object.entries(nestedFields)) {
            const nestedFieldDef = nestedFieldDefRaw as any
            const nestedMeta = nestedFieldDef.resolved || nestedFieldDef.semantic || nestedFieldDef
            const nestedCamelName = camelCase(nestedFieldName)
            
            // Prefix with parent field name (e.g., produk + id -> produkId)
            const flatFieldName = camelCol + nestedCamelName.charAt(0).toUpperCase() + nestedCamelName.slice(1)
            const safeFlatName = flatFieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? flatFieldName : `"${flatFieldName}"`
            
            let tsType = this.mapResolvedToTsType(nestedMeta)
            // Nullable if nested field is nullable
            const nestedResolvedType = nestedMeta.type || nestedMeta.kind
            if (nestedFieldDef.nullable || (nestedResolvedType === 'model' || nestedResolvedType === 'resource' || nestedResolvedType === 'object')) {
              tsType += ' | null | undefined'
            }
            lines.push(`  ${safeFlatName}: ${tsType}`)
          }
        } else if (resolvedType === 'array') {
          // Array of items - flatten nested resources dalam array items
          const safeName = camelCol.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelCol : `"${camelCol}"`
          const arrayMeta = meta.items || {}
          const arrayResolvedType = arrayMeta.type || arrayMeta.kind
          
          if ((arrayResolvedType === 'resource' || arrayResolvedType === 'model' || arrayResolvedType === 'object') && arrayMeta.fields) {
            // Generate inline array item type with flattened fields
            const itemFields: string[] = []
            const itemFieldsObj = arrayMeta.fields as Record<string, any>
            for (const [itemFieldName, itemFieldDefRaw] of Object.entries(itemFieldsObj)) {
              const itemFieldDef = itemFieldDefRaw as any
              const itemMeta = itemFieldDef.resolved || itemFieldDef.semantic || itemFieldDef
              const itemResolvedType = itemMeta.type || itemMeta.kind
              const itemCamelName = camelCase(itemFieldName)
              const safeFlatItemName = itemCamelName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? itemCamelName : `"${itemCamelName}"`
              
              // Handle nested resource/model within array item - flatten it
              if ((itemResolvedType === 'resource' || itemResolvedType === 'model' || itemResolvedType === 'object') && itemMeta.fields) {
                // Flatten nested fields within array item
                const nestedInArrayFields = itemMeta.fields as Record<string, any>
                for (const [nestedInArrayFieldName, nestedInArrayFieldDefRaw] of Object.entries(nestedInArrayFields)) {
                  const nestedInArrayFieldDef = nestedInArrayFieldDefRaw as any
                  const nestedInArrayMeta = nestedInArrayFieldDef.resolved || nestedInArrayFieldDef.semantic || nestedInArrayFieldDef
                  const nestedInArrayCamelName = camelCase(nestedInArrayFieldName)
                  const flatArrayItemFieldName = itemCamelName + nestedInArrayCamelName.charAt(0).toUpperCase() + nestedInArrayCamelName.slice(1)
                  const safeFlatArrayItemFieldName = flatArrayItemFieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? flatArrayItemFieldName : `"${flatArrayItemFieldName}"`
                  let nestedItemType = this.mapResolvedToTsType(nestedInArrayMeta)
                  if (nestedInArrayFieldDef.nullable || nestedInArrayMeta.type === 'model' || nestedInArrayMeta.type === 'resource') {
                    nestedItemType += ' | null | undefined'
                  }
                  itemFields.push(`    ${safeFlatArrayItemFieldName}: ${nestedItemType}`)
                }
              } else {
                // Regular field in array item
                let itemType = this.mapResolvedToTsType(itemMeta)
                if (itemFieldDef.nullable) itemType += ' | null'
                itemFields.push(`    ${safeFlatItemName}: ${itemType}`)
              }
            }
            lines.push(`  ${safeName}: Array<{`)
            lines.push(itemFields.join('\n'))
            lines.push(`  }>`)
          } else {
            // Regular array
            let tsType = this.mapResolvedToTsType(meta)
            lines.push(`  ${safeName}: ${tsType}`)
          }
        } else {
          // Regular field (not nested, not array)
          const safeName = camelCol.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelCol : `"${camelCol}"`
          let tsType = this.mapResolvedToTsType(meta)
          let optional = ''
          if (resolvedType === 'model' || resolvedType === 'resource' || resolvedType === 'object') {
            optional = '?'
          }
          if (fieldDef.nullable) tsType += ' | null'
          lines.push(`  ${safeName}${optional}: ${tsType}`)
        }
      }
      lines.push(`}`)
      lines.push(``)
      
      lines.push(`export type ${resource.name}Show = ${resource.name}Transformed`)
      lines.push(`export type ${resource.name}Index = ${resource.name}Transformed[]`)
      lines.push(``)
    }

    // Routes -> Response Transformed Types (GET only, satu per resource: {Resource}Transformed/Show/Index)
    const generatedNames = new Set<string>()

    for (const manifestRoute of manifestRoutes) {
      if (!manifestRoute.response || !manifestRoute.response.fields) continue
      if (manifestRoute.method?.toUpperCase() !== 'GET') continue

      const responseMeta = manifestRoute.response
      const responseKind = responseMeta.kind || responseMeta.type
      if (responseKind !== 'object' && responseKind !== 'literal') continue

      const groupName = deriveGroupName(manifestRoute.path)
      const baseName = toTypeName(groupName)
      const typeName = `${baseName}Transformed`

      if (generatedNames.has(typeName)) continue
      generatedNames.add(typeName)

      hasExports = true
      const flattened = this.flattenResponseType(responseMeta)

      lines.push(`export interface ${typeName} {`)
      for (const field of flattened) {
        const safeName = field.name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? field.name : `"${field.name}"`
        const opt = (field as any).optional ? '?' : ''
        lines.push(`  ${safeName}${opt}: ${field.type}`)
      }
      lines.push(`}`)
      lines.push(``)
      lines.push(`export type ${baseName}Show = ${typeName}`)
      lines.push(`export type ${baseName}Index = ${typeName}[]`)
      lines.push(``)
    }

    if (hasExports) {
      await fs.writeFile(path.join(dir, 'api-read.ts'), lines.join('\n'))
    }
  }

  // ============================================
  // SKIPPED SECTION - was after this point
  // ============================================

  // 5. api-form.ts — Input/Request Body saja (Create/Get/Update/Delete)
  private static async generateForm(dir: string, routes: GeneratedRoute[], _manifestRoutes: any[] = []): Promise<void> {
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(``)

    let hasExports = false

    // Map classifier actionName → CRUD key: post→Create, put/patch→Update, delete→Delete
    const ACTION_TO_CRUD: Record<string, string> = {
      post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
    }

    const resourceForms: Record<string, { actions: string[]; contents: Set<string> }> = {}

    for (const route of routes) {
      if (route.schema && route.schema.rules && Object.keys(route.schema.rules).length > 0) {
        hasExports = true
        const resource = route.groupName || deriveGroupName(route.path)
        const TitleCaseResource = toTypeName(resource)

        // Map ke CRUD name: post→Create, put/patch→Update, dll
        let rawAction = route.actionName
        let TitleCaseAction = ACTION_TO_CRUD[rawAction] || (rawAction.charAt(0).toUpperCase() + rawAction.slice(1))

        if (!resourceForms[TitleCaseResource]) {
          resourceForms[TitleCaseResource] = { actions: [], contents: new Set() }
        }

        const ruleTree = this.buildRuleTree(route.schema.rules)
        const rootNode = { children: ruleTree, rules: 'required' }
        const actionStr = `  ${TitleCaseAction}: ${this.generateTSRecursive(rootNode, 'root', true)}`

        // Skip jika konten identik (e.g., PUT + PATCH dengan rules yang sama)
        if (resourceForms[TitleCaseResource].contents.has(actionStr)) continue
        resourceForms[TitleCaseResource].contents.add(actionStr)
        resourceForms[TitleCaseResource].actions.push(actionStr)
      }
    }

    for (const [resource, data] of Object.entries(resourceForms)) {
      lines.push(`export type ${resource}Form = {`)
      lines.push(data.actions.join('\n\n'))
      lines.push(`}`)
      lines.push(``)
    }

    if (hasExports) {
      await fs.writeFile(path.join(dir, 'api-form.ts'), lines.join('\n'))
    }
  }

  private static mapRulesToTs(ruleStr: string): string {
    const inMatch = ruleStr.match(/(?:^|\|)in:([^|]+)/)
    if (inMatch) {
      const isNumeric = ruleStr.includes('numeric') || ruleStr.includes('integer')
      const values = inMatch[1].split(',').map(v => v.trim())
      if (isNumeric) {
        return values.join(' | ')
      }
      return values.map(v => `'${v}'`).join(' | ')
    }
    if (ruleStr.includes('array')) return 'unknown[]'
    if (ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('digits')) return 'number'
    if (ruleStr.includes('boolean') || ruleStr.includes('bool')) return 'boolean'
    if (ruleStr.includes('file') || ruleStr.includes('image') || ruleStr.includes('mimes') || ruleStr.includes('mimetypes')) return 'File'
    return 'string'
  }

  private static mapSqlTypeToTs(sqlType: string): string {
    const type = sqlType.toLowerCase()
    if (type === 'mixed' || type === 'unknown') {
      return 'unknown'
    }
    if (type.includes('bool') || type.includes('tinyint(1)')) {
      return 'boolean'
    }
    if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) {
      return 'number'
    }
    if (type.includes('json')) {
      return 'Record<string, unknown>'
    }
    const enumMatch = type.match(/^enum\((.*)\)$/)
    if (enumMatch && enumMatch[1]) {
      const values = enumMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''))
      return values.map(v => `"${v}"`).join(' | ')
    }
    return 'string'
  }

  private static mapCastToTs(castType: string, defaultType: string): string {
    const type = castType.toLowerCase()
    if (type.includes('int') || type.includes('float') || type.includes('decimal') || type.includes('double')) return 'number'
    if (type.includes('bool')) return 'boolean'
    if (type.includes('array') || type.includes('json') || type.includes('collection') || type.includes('object')) return 'Record<string, unknown>'
    if (type.includes('date') || type.includes('datetime') || type.includes('string')) return 'string'
    return defaultType
  }

  // 6. api-mapper.ts (Auto-Mapper from contract <-> read/form)
  private static async generateMapper(dir: string, routes: GeneratedRoute[], models: any[], resources: any[]): Promise<void> {
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(``)

    let hasExports = false

    // Imports
    const modelImports: string[] = []
    const readImports: string[] = []
    
    for (const model of models) {
      modelImports.push(`${model.name}ApiResponse`)
      readImports.push(`${model.name}Transformed`)
    }

    for (const resource of resources) {
      modelImports.push(`${resource.name}Response`)
      readImports.push(`${resource.name}Transformed`)
    }

    // CRUD mapping (sama dengan contract block)
    const MAPPER_ACTION_MAP: Record<string, string> = {
      post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
    }

    // Count responses per resource (semua = untuk contract naming, GET-only = untuk read type naming)
    const mapperAllRespCount = new Map<string, number>()
    const mapperGetOnlyCount = new Map<string, number>()
    for (const route of routes) {
      if (route.response) {
        const r = route.groupName || deriveGroupName(route.path || '')
        mapperAllRespCount.set(r, (mapperAllRespCount.get(r) || 0) + 1)
        if (route.method?.toUpperCase() === 'GET') {
          mapperGetOnlyCount.set(r, (mapperGetOnlyCount.get(r) || 0) + 1)
        }
      }
    }

    const payloadImports: string[] = []
    const schemaActions: string[] = []

    for (const route of routes) {
      if (route.schema && route.schema.rules && Object.keys(route.schema.rules).length > 0) {
        const TitleCaseResource = toTypeName(route.groupName || deriveGroupName(route.path || ''))
        const rawAction = MAPPER_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const KeyName = TitleCaseResource + rawAction
        payloadImports.push(`${KeyName}Payload`)
        schemaActions.push(KeyName)
      }

      if (route.response) {
        const TitleCaseResource = toTypeName(route.groupName || deriveGroupName(route.path || ''))
        const rawAction = MAPPER_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const count = mapperAllRespCount.get(route.groupName || deriveGroupName(route.path || '')) || 1
        // Single response → {Resource}Response, Multiple → {Resource}{Action}Response
        const respKey = count === 1 ? TitleCaseResource : `${TitleCaseResource}${rawAction}`

        const meta = {
          ...(route.response.resolved || route.response.semantic || route.response),
          collection: route.response.collection ?? route.response.resolved?.collection ?? route.response.semantic?.collection,
          paginated: route.response.paginated ?? route.response.resolved?.paginated ?? route.response.semantic?.paginated
        }
        const kind = meta.kind || meta.type

        if (kind === 'object' && (this.hasModelOrResource(route.response) || this.hasSnakeCaseFields(route.response))) {
          modelImports.push(`${respKey}Response`)
        }
      }
    }

    if (modelImports.length > 0 || payloadImports.length > 0) {
      lines.push(`import type {`)
      const allImports = [...new Set([...modelImports, ...payloadImports])].sort()
      for (const imp of allImports) {
        lines.push(`  ${imp},`)
      }
      lines.push(`} from '../contract/api-contract'`)
    }

    // Pre-populate readImports dengan GET response types (api-read hanya punya GET)
    for (const route of routes) {
      if (route.response && route.method?.toUpperCase() === 'GET') {
        const kind = (route.response.resolved?.kind || route.response.semantic?.kind || route.response.kind)
        if (kind === 'object' && (this.hasModelOrResource(route.response) || this.hasSnakeCaseFields(route.response))) {
          const r = route.groupName || deriveGroupName(route.path || '')
          const rawAct = MAPPER_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
          const cnt = mapperGetOnlyCount.get(r) || 1
          const respKey = cnt === 1 ? toTypeName(r) : `${toTypeName(r)}${rawAct}`
          readImports.push(`${respKey}Transformed`)
        }
      }
    }

    if (readImports.length > 0) {
      lines.push(`import type {`)
      for (const imp of [...new Set(readImports)].sort()) {
        lines.push(`  ${imp},`)
      }
      lines.push(`} from '../types/api-read'`)
    }

    if (schemaActions.length > 0) {
      lines.push(`import type { ApiFormValues } from '../contract/api-schema'`)
      lines.push(`import { ApiApiField } from '../contract/api-field'`)
    }

    lines.push(``)

    // DB Models -> Read Transformed
    for (const model of models) {
      hasExports = true
      lines.push(`export const to${model.name}Read = (api: ${model.name}ApiResponse): ${model.name}Transformed => ({`)
      
      const hidden = Array.isArray(model.hidden) ? model.hidden : []
      for (const col of model.columns) {
        if (hidden.includes(col.name)) continue
        const camelCol = camelCase(col.name)
        const safeCamel = camelCol.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelCol : `"${camelCol}"`
        const safeOriginal = col.name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? `api.${col.name}` : `api["${col.name}"]`
        lines.push(`  ${safeCamel}: ${safeOriginal},`)
      }

      const appends = Array.isArray(model.appends) ? model.appends : []
      for (const append of appends) {
        const camelAppend = camelCase(append)
        const safeCamel = camelAppend.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelAppend : `"${camelAppend}"`
        const safeOriginal = append.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? `api.${append}` : `api["${append}"]`
        lines.push(`  ${safeCamel}: ${safeOriginal},`)
      }

      lines.push(`})`)
      lines.push(``)
      lines.push(`export const to${model.name}ReadList = (api: ${model.name}ApiResponse[]): ${model.name}Transformed[] => api.map(to${model.name}Read)`)
      lines.push(``)
    }

    // Resources -> Read Transformed - with FLATTEN strategy
    for (const resource of resources) {
      hasExports = true
      lines.push(`export const to${resource.name}Read = (api: ${resource.name}Response): ${resource.name}Transformed => ({`)
      
      for (const [fieldName, fieldDefRaw] of Object.entries(resource.fields as Record<string, any>)) {
        const fieldDef = fieldDefRaw as any
        const camelCol = camelCase(fieldName)
        const safeCamel = camelCol.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelCol : `"${camelCol}"`
        const safeOriginal = fieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? `api.${fieldName}` : `api["${fieldName}"]`
        
        const meta = fieldDef.resolved || fieldDef.semantic || fieldDef
        const resolvedType = meta.type || meta.kind
        
        // FLATTEN STRATEGY: If nested resource/model/object, flatten fields with optional chaining
        if ((resolvedType === 'resource' || resolvedType === 'model' || resolvedType === 'object') && meta.fields) {
          const nestedFields = meta.fields as Record<string, any>
          for (const [nestedFieldName, nestedFieldDefRaw] of Object.entries(nestedFields)) {
            const nestedCamelName = camelCase(nestedFieldName)
            const flatFieldName = camelCol + nestedCamelName.charAt(0).toUpperCase() + nestedCamelName.slice(1)
            const safeFlatName = flatFieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? flatFieldName : `"${flatFieldName}"`
            
            // Use optional chaining for safety: api.produk?.id
            const nestedAccessor = safeOriginal.endsWith(']') 
              ? `${safeOriginal}?.${nestedFieldName}` 
              : `${safeOriginal}?.${nestedFieldName}`
            
            lines.push(`  ${safeFlatName}: ${nestedAccessor},`)
          }
        } else if (resolvedType === 'array') {
          // Array of items - inline mapping with flattened fields (Approach B)
          const arrayMeta = meta.items || {}
          const arrayResolvedType = arrayMeta.type || arrayMeta.kind
          
          if ((arrayResolvedType === 'resource' || arrayResolvedType === 'model' || arrayResolvedType === 'object') && arrayMeta.fields) {
            // Inline definition with fields - generate inline approach B
            const itemFields: string[] = []
            const itemFieldsObj = arrayMeta.fields as Record<string, any>
            
            for (const [itemFieldName, itemFieldDefRaw] of Object.entries(itemFieldsObj)) {
              const itemFieldDef = itemFieldDefRaw as any
              const itemCamelName = camelCase(itemFieldName)
              
              // Handle nested fields in array items too
              const itemMeta = itemFieldDef.resolved || itemFieldDef.semantic || itemFieldDef
              const itemResolvedType = itemMeta.type || itemMeta.kind
              
              if ((itemResolvedType === 'resource' || itemResolvedType === 'model') && itemMeta.fields) {
                // Nested resource in array item - flatten it
                const nestedInArrayFields = itemMeta.fields as Record<string, any>
                for (const [nestedInArrayFieldName, _] of Object.entries(nestedInArrayFields)) {
                  const nestedInArrayCamelName = camelCase(nestedInArrayFieldName)
                  const flatArrayItemFieldName = itemCamelName + nestedInArrayCamelName.charAt(0).toUpperCase() + nestedInArrayCamelName.slice(1)
                  const safeFlatArrayItemFieldName = flatArrayItemFieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? flatArrayItemFieldName : `"${flatArrayItemFieldName}"`
                  const arrayItemAccessor = `item.${itemFieldName}?.${nestedInArrayFieldName}`
                  itemFields.push(`          ${safeFlatArrayItemFieldName}: ${arrayItemAccessor},`)
                }
              } else {
                // Regular field in array item
                const safeItemCamelName = itemCamelName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? itemCamelName : `"${itemCamelName}"`
                itemFields.push(`          ${safeItemCamelName}: item.${itemFieldName},`)
              }
            }
            
            // Approach B: Inline without ? and ?? [] (assumes items always exists)
            lines.push(`  ${safeCamel}: ${safeOriginal}.map(item => ({`)
            lines.push(itemFields.join('\n'))
            lines.push(`        })),`)
          } else {
            // Reference to resource or no fields - use helper with minimal syntax
            const mappedValue = this.generateObjectReadMapper(fieldDef, safeOriginal)
            lines.push(`  ${safeCamel}: ${mappedValue},`)
          }
        } else {
          // Regular field
          const mappedValue = this.generateObjectReadMapper(fieldDef, safeOriginal)
          lines.push(`  ${safeCamel}: ${mappedValue},`)
        }
      }
      lines.push(`})`)
      lines.push(``)
      lines.push(`export const to${resource.name}ReadList = (api: ${resource.name}Response[]): ${resource.name}Transformed[] => api.map(to${resource.name}Read)`)
      lines.push(``)
    }

    // Route Responses -> Read Transformed (GET = Transformed type, mutation = contract type)
    const generatedMapperFns = new Set<string>()
    for (const route of routes) {
      if (route.response) {
        const TitleCaseResource = toTypeName(route.groupName || deriveGroupName(route.path || ''))
        const rawAction = MAPPER_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const isGet = route.method?.toUpperCase() === 'GET'
        // Contract key: pakai all-response count (harus match contract naming)
        const allCount = mapperAllRespCount.get(route.groupName || deriveGroupName(route.path || '')) || 1
        const contractKey = allCount === 1 ? TitleCaseResource : `${TitleCaseResource}${rawAction}`
        // Read key: GET-only (match api-read yang cuma punya GET types)
        const getCount = mapperGetOnlyCount.get(route.groupName || deriveGroupName(route.path || '')) || 1
        const readKey = getCount === 1 ? TitleCaseResource : `${TitleCaseResource}${rawAction}`

        if (generatedMapperFns.has(`resp:${contractKey}`)) continue

        const meta = {
          ...(route.response.resolved || route.response.semantic || route.response),
          collection: route.response.collection ?? route.response.resolved?.collection ?? route.response.semantic?.collection,
          paginated: route.response.paginated ?? route.response.resolved?.paginated ?? route.response.semantic?.paginated
        }
        const kind = meta.kind || meta.type

        if (kind === 'object' && (this.hasModelOrResource(route.response) || this.hasSnakeCaseFields(route.response))) {
          hasExports = true
          generatedMapperFns.add(`resp:${contractKey}`)
          if (isGet) {
            // GET → flattened mapper ke Transformed type dari api-read
            const readType = `${readKey}Transformed`
            const mappedValue = this.generateObjectReadMapper(route.response, 'api')
            lines.push(`export const to${contractKey}ResponseRead = (api: ${contractKey}Response): ${readType} => (${mappedValue})`)
          } else {
            // Mutation → identity mapper (contract type = return type)
            lines.push(`export const to${contractKey}ResponseRead = (api: ${contractKey}Response): ${contractKey}Response => (api)`)
          }
          lines.push(``)
        }
      }
    }

    // Forms -> Action Payloads (pakai CRUD mapping + dedup)
    const generatedFormMapperFns = new Set<string>()
    for (const route of routes) {
      if (route.schema && route.schema.rules && Object.keys(route.schema.rules).length > 0) {
        const TitleCaseResource = toTypeName(route.groupName || deriveGroupName(route.path || ''))
        const rawAction = MAPPER_ACTION_MAP[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const KeyName = TitleCaseResource + rawAction

        if (generatedFormMapperFns.has(KeyName)) continue
        generatedFormMapperFns.add(KeyName)

        hasExports = true
        lines.push(`export const toApi${KeyName} = (form: ApiFormValues['${KeyName}']): ${KeyName}Payload => ({`)
        const ruleTree = this.buildRuleTree(route.schema.rules)
        lines.push(this.generateMapperRecursive({ children: ruleTree }, 'form'))

        lines.push(`})`)
        lines.push(``)
      }
    }

    if (hasExports) {
      await fs.writeFile(path.join(dir, 'api-mapper.ts'), lines.join('\n'))
    }
  }
  // --- Recursive Helpers for Nested Validation ---

  private static buildRuleTree(rules: Record<string, any>): any {
    const tree: any = {}
    for (const [key, rule] of Object.entries(rules)) {
      const parts = key.split('.')
      let current = tree
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (!current[part]) {
          current[part] = { rules: '', children: {} }
        }
        if (i === parts.length - 1) {
          current[part].rules = Array.isArray(rule) ? rule.join('|') : String(rule)
        }
        current = current[part].children
      }
    }
    return tree
  }

  private static generateZodRecursive(node: any, name: string, camelCaseKeys: boolean = true): string {
    if (node.children && node.children['*']) {
      let innerType = this.generateZodRecursive(node.children['*'], '*', camelCaseKeys)
      let zodRule = `z.array(${innerType})`
      if (name !== '*' && !node.rules.includes('required')) zodRule += '.optional()'
      if (node.rules.includes('nullable')) zodRule += '.nullable()'
      return zodRule
    }

    if (node.children && Object.keys(node.children).length > 0) {
      const props: string[] = []
      for (const [childName, childNode] of Object.entries(node.children)) {
        const keyName = camelCaseKeys ? camelCase(childName) : childName
        const safeName = keyName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? keyName : `"${keyName}"`
        props.push(`    ${safeName}: ${this.generateZodRecursive(childNode, childName, camelCaseKeys)},`)
      }
      let zodRule = `z.object({\n${props.join('\n')}\n  })`
      if (name !== '*' && !node.rules.includes('required') && !node.rules.includes('array')) zodRule += '.optional()'
      if (node.rules.includes('nullable')) zodRule += '.nullable()'
      return zodRule
    }

    let zodRule = this.mapRulesToZod(node.rules)
    if (name !== '*' && !node.rules.includes('required')) zodRule += '.optional()'
    if (node.rules.includes('nullable')) zodRule += '.nullable()'
    return zodRule
  }

  private static generateTSRecursive(node: any, name: string, useCamel: boolean = false): string {
    if (node.children && node.children['*']) {
      let innerType = this.generateTSRecursive(node.children['*'], '*', useCamel)
      let tsType = `${innerType}[]`
      if (name !== '*' && !node.rules.includes('required')) tsType = `${tsType} | undefined`
      if (node.rules.includes('nullable')) tsType += ' | null'
      return tsType
    }

    if (node.children && Object.keys(node.children).length > 0) {
      const props: string[] = []
      for (const [childName, childNode] of Object.entries(node.children)) {
        const fieldName = useCamel ? camelCase(childName) : childName
        const safeName = fieldName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? fieldName : `"${fieldName}"`
        let optional = !(childNode as any).rules.includes('required') ? '?' : ''
        props.push(`    ${safeName}${optional}: ${this.generateTSRecursive(childNode, childName, useCamel)}`)
      }
      let tsType = `{\n${props.join('\n')}\n  }`
      if (name !== '*' && !node.rules.includes('required') && !node.rules.includes('array')) tsType = `${tsType} | undefined`
      if (node.rules.includes('nullable')) tsType += ' | null'
      return tsType
    }

    let tsType = this.mapRulesToTs(node.rules)
    if (name !== '*' && !node.rules.includes('required')) tsType = `${tsType} | undefined`
    if (node.rules.includes('nullable')) tsType += ' | null'
    return tsType
  }

  private static generateMapperRecursive(node: any, varName: string, level: number = 1): string {
    const indent = '  '.repeat(level)
    const props: string[] = []
    
    for (const [key, childNode] of Object.entries(node.children)) {
      const camel = camelCase(key)
      const typedChild = childNode as any
      const constantKey = camel.toUpperCase()
      const safeAccessor = constantKey.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? `ApiApiField.${constantKey}` : `ApiApiField["${constantKey}"]`
      const safeCamel = camel.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? `${varName}.${camel}` : `${varName}["${camel}"]`
      
      if (typedChild.children && typedChild.children['*']) {
        const innerNode = typedChild.children['*']
        const innerVar = `item${level}`
        if (Object.keys(innerNode.children).length > 0) {
          let innerMapper = this.generateMapperRecursive({ children: innerNode.children }, innerVar, level + 2)
          props.push(`${indent}[${safeAccessor}]: ${safeCamel}?.map((${innerVar}) => ({\n${innerMapper}\n${indent}  })),`)
        } else {
          props.push(`${indent}[${safeAccessor}]: ${safeCamel},`)
        }
      } else {
        props.push(`${indent}[${safeAccessor}]: ${safeCamel},`)
      }
    }
    return props.join('\n')
  }

  private static mapResolvedToTsType(meta: any): string {
    if (!meta) return 'unknown'
    
    const type = meta.type || meta.kind
    const model = meta.model
    const resource = meta.resource
    const collection = !!meta.collection
    const nullable = !!meta.nullable
    
    let typeStr = 'unknown'

    if (type === 'model') {
      typeStr = model ? `${model}Transformed` : 'unknown'
    } else if (type === 'resource') {
      typeStr = resource ? `${resource}Transformed` : 'unknown'
    } else if (type === 'number') {
      typeStr = 'number'
    } else if (type === 'string') {
      typeStr = 'string'
    } else if (type === 'boolean') {
      typeStr = 'boolean'
    } else if (type === 'null') {
      typeStr = 'null'
    } else if (type === 'any') {
      typeStr = 'any'
    } else if (type === 'object') {
      if (!meta.fields || Object.keys(meta.fields).length === 0) {
        typeStr = 'Record<string, unknown>'
      } else {
        const fields = Object.entries(meta.fields).map(([k, v]) => {
          const subMeta = (v as any).resolved || (v as any).semantic || v
          const camelK = camelCase(k)
          const safeK = camelK.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? camelK : `"${camelK}"`
          return `${safeK}: ${this.mapResolvedToTsType(subMeta)}`
        }).join('; ')
        typeStr = `{ ${fields} }`
      }
    } else if (type === 'array' || type === 'any[]') {
      typeStr = 'unknown'
    } else if (type === 'json-object') {
      typeStr = 'Record<string, unknown>'
    } else if (type === 'json-member') {
      typeStr = 'unknown'
    } else if (meta.kind === 'primitive') {
      if (meta.type === 'number') typeStr = 'number'
      else if (meta.type === 'string') typeStr = 'string'
      else if (meta.type === 'boolean') typeStr = 'boolean'
      else if (meta.type === 'null') typeStr = 'null'
    }

    if (collection) {
      if (meta.paginated) {
        typeStr = `{ data: ${typeStr}[]; currentPage?: number; total?: number }`
      } else {
        typeStr = `${typeStr}[]`
      }
    }

    if (nullable && type !== 'null') {
      typeStr = `(${typeStr}) | null`
    }

    return typeStr
  }

  private static generateObjectReadMapper(fieldDef: any, parentAccessor: string): string {
    const meta = {
      ...(fieldDef.resolved || fieldDef.semantic || fieldDef),
      collection: fieldDef.collection ?? fieldDef.resolved?.collection ?? fieldDef.semantic?.collection,
      paginated: fieldDef.paginated ?? fieldDef.resolved?.paginated ?? fieldDef.semantic?.paginated
    }
    const kind = meta.kind || meta.type
    const isCollection = !!meta.collection
    const isPaginated = !!meta.paginated

    if (kind === 'model') {
      const modelName = meta.model
      if (isCollection) {
        if (isPaginated) {
          return `{ ...${parentAccessor}, data: ${parentAccessor}.data?.map((item: ${modelName}ApiResponse) => to${modelName}Read(item)) ?? [], currentPage: ${parentAccessor}.current_page, total: ${parentAccessor}.total }`
        }
        return `${parentAccessor}.map((item: ${modelName}ApiResponse) => to${modelName}Read(item))`
      } else {
        return `to${modelName}Read(${parentAccessor})`
      }
    } else if (kind === 'resource') {
      const resourceName = meta.resource
      if (isCollection) {
        if (isPaginated) {
          return `{ ...${parentAccessor}, data: ${parentAccessor}.data?.map((item: ${resourceName}Response) => to${resourceName}Read(item)) ?? [], currentPage: ${parentAccessor}.current_page, total: ${parentAccessor}.total }`
        }
        return `${parentAccessor}.map((item: ${resourceName}Response) => to${resourceName}Read(item))`
      } else {
        return `to${resourceName}Read(${parentAccessor})`
      }
    } else if (kind === 'object' && meta.fields) {
      // Generate flattened object mapper with camelCase field access
      const flattened = this.flattenResponseType(fieldDef)
      if (flattened.length === 0) return parentAccessor
      const fieldMappings = flattened.map(f => {
        const pathParts = f.path.split('.')
        let accessor = parentAccessor
        for (const part of pathParts) {
          accessor += `?.${part}`
        }

        // Cek apakah perlu .map() — array of model/resource
        const rootField = pathParts[0]
        const origField = meta.fields?.[rootField]
        const origMeta = origField?.resolved || origField?.semantic || origField

        // Direct model collection: data: ProductReview[]
        if ((origMeta?.type === 'model' || origMeta?.type === 'resource') && origMeta?.collection && pathParts.length === 1) {
          const modelName = origMeta.model || origMeta.resource
          return `    ${f.name}: ${parentAccessor}?.${rootField}?.map((item: ${modelName}ApiResponse) => to${modelName}Read(item))`
        }
        // Paginated model collection: reviews.data → reviewsData
        if ((origMeta?.type === 'model' || origMeta?.type === 'resource') && origMeta?.collection && origMeta?.paginated && f.name.endsWith('Data')) {
          const modelName = origMeta.model || origMeta.resource
          return `    ${f.name}: ${parentAccessor}?.${rootField}?.data?.map((item: ${modelName}ApiResponse) => to${modelName}Read(item))`
        }
        return `    ${f.name}: ${accessor}`
      })
      return `{\n${fieldMappings.join(',\n')}\n  }`
    } else {
      return parentAccessor
    }
  }

  private static hasModelOrResource(rawMeta: any): boolean {
    if (!rawMeta) return false
    const meta = rawMeta.resolved || rawMeta.semantic || rawMeta
    const kind = meta.kind || meta.type
    if (kind === 'model' || kind === 'resource') return true
    if (kind === 'object' && meta.fields) {
      return Object.values(meta.fields).some(f => this.hasModelOrResource(f))
    }
    return false
  }

  // Returns true when a response object (or any nested object) has snake_case field names
  // that need to be camelCased — used to decide if a response mapper should be generated
  private static hasSnakeCaseFields(rawMeta: any): boolean {
    if (!rawMeta) return false
    const meta = rawMeta.resolved || rawMeta.semantic || rawMeta
    const kind = meta.kind || meta.type
    if (kind === 'object' && meta.fields) {
      for (const [k, v] of Object.entries(meta.fields as Record<string, any>)) {
        if (k.includes('_')) return true
        if (this.hasSnakeCaseFields(v)) return true
      }
    }
    return false
  }
}