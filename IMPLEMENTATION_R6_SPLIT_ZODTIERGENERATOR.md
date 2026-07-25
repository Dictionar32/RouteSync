# IMPLEMENTATION: R6 Split ZodTierGenerator

**Requirement:** R6: Split ZodTierGenerator ke Modul Terpisah — HARUS  
**Complexity:** Very High  
**Estimated Effort:** 5-10 hari  
**Status:** Implementation Plan

---

## OVERVIEW

Refactor `ZodTierGenerator.ts` (1890 baris, 83KB) jadi 6 modul terpisah:
- `ContractLayer.ts` (400-500 baris)
- `SchemaLayer.ts` (150-200 baris)
- `FieldLayer.ts` (100-150 baris)
- `ReadLayer.ts` (300-400 baris)
- `FormLayer.ts` (100-150 baris)
- `MapperLayer.ts` (400-500 baris)
- `ZodTierGenerator.ts` (orchestrator, <100 baris)

---

## PHASE 1: Ekstrak Shared Utilities

Sebelum split, kita perlu extract shared utilities yang dipakai semua layer.

### 1.1 types.ts (Shared Type Definitions)

```typescript
// packages/cli/src/generators/layers/types.ts

import { RouteManifest, camelCase, SemanticResolutionKernel } from '@routesync/core'

// Shared interfaces untuk IR antar layer
export interface ResolvedResponseType {
  kind: 'primitive' | 'object' | 'model' | 'resource'
  nullable: boolean
  collection: boolean
  paginated: boolean
  wrapped: boolean
  // Untuk primitive
  primitiveType?: 'string' | 'number' | 'boolean' | 'null' | 'unknown'
  // Untuk object/model/resource
  modelName?: string
  resourceName?: string
  fields?: Record<string, ResolvedResponseType>
}

// Parsed model structure dari manifest
export interface ParsedModel {
  name: string
  tableName: string
  fields: Record<string, ParsedField>
}

export interface ParsedField {
  name: string
  type: string
  cast?: string
  nullable: boolean
  default?: unknown
}

// Parsed resource structure
export interface ParsedResource {
  name: string
  fields: Record<string, ParsedField>
}

// Parsed route structure
export interface ParsedRoute {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  actionName: string
  controllerName: string
  response?: RuntimeAugmented<Record<string, unknown>>
  schema?: { rules: Record<string, unknown> }
  groupName?: string
}

export type RuntimeAugmented<T = unknown> = T & {
  resolved?: SemanticNode
  semantic?: SemanticNode
  kind?: string
  type?: string
  collection?: boolean
  paginated?: boolean
  wrapped?: boolean
  fields?: Record<string, unknown>
}

export interface SemanticNode {
  status: string
  type: string
  model?: string
  resource?: string
  collection?: boolean
  paginated?: boolean
  nullable?: boolean
  fields?: Record<string, unknown>
  kind?: string
}

// RouteResponseComposition dari ZodTierGenerator (tetap sama)
export interface RouteResponseComposition {
  zType: string
  tsType: string
  isCollection: boolean
  isPaginated: boolean
  isWrapped: boolean
  isResourceAlias: boolean
  name?: string
}

// Context yang di-pass ke tiap layer
export interface LayerContext {
  manifest: RouteManifest
  knownModels: Set<string>
  knownResources: Set<string>
  kernel: SemanticResolutionKernel
}

// Output dari each layer
export interface LayerOutput {
  lines: string[]
  // Layer-specific IR jika ada
  metadata?: Record<string, unknown>
}
```

### 1.2 helpers.ts (Shared Helper Functions)

```typescript
// packages/cli/src/generators/layers/helpers.ts

import { camelCase } from '@routesync/core'

/**
 * Get semantic node dari response metadata
 */
export function getSemanticNode(v: unknown): SemanticNode | undefined {
  if (!v || typeof v !== 'object') return undefined
  const obj = v as Record<string, unknown>
  if (obj.resolved && typeof obj.resolved === 'object') return obj.resolved as SemanticNode
  if (obj.semantic && typeof obj.semantic === 'object') return obj.semantic as SemanticNode
  if (obj.status || obj.type || obj.kind) return obj as unknown as SemanticNode
  return undefined
}

/**
 * Normalize metadata dengan fallback dari resolved/semantic
 */
export function normalizeMetadata(raw: RuntimeAugmented<Record<string, unknown>>): Record<string, unknown> {
  return {
    ...(raw.resolved || raw.semantic || raw),
    collection: raw.collection ?? (raw.resolved as Record<string, unknown> | undefined)?.collection ?? (raw.semantic as Record<string, unknown> | undefined)?.collection,
    paginated: raw.paginated ?? (raw.resolved as Record<string, unknown> | undefined)?.paginated ?? (raw.semantic as Record<string, unknown> | undefined)?.paginated,
    wrapped: raw.wrapped ?? (raw.resolved as Record<string, unknown> | undefined)?.wrapped ?? (raw.semantic as Record<string, unknown> | undefined)?.wrapped,
  }
}

/**
 * Derive group name dari route path atau groupName
 */
export function getResourceName(route: ParsedRoute): string {
  return route.groupName || deriveGroupName(route.path)
}

/**
 * Convert resource name → TitleCase
 */
export function toTitleCase(str: string): string {
  return str
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Get action name dari HTTP method
 */
export function getActionName(route: ParsedRoute, actionMap: Record<string, string>): string {
  const raw = route.actionName || route.method?.toLowerCase()
  return actionMap[raw] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Get')
}

/**
 * Derive group name dari path (copy dari route-classifier)
 */
function deriveGroupName(path: string): string {
  // /users → users
  // /api/v1/products → products
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] || 'api'
}
```

---

## PHASE 2: Contract Layer

### 2.1 ContractLayer.ts (Backend Responses - Snake_case)

```typescript
// packages/cli/src/generators/layers/ContractLayer.ts

import path from 'path'
import fs from 'fs-extra'
import { 
  RouteManifest, 
  camelCase, 
  SemanticResolutionKernel 
} from '@routesync/core'
import {
  RouteResponseComposition,
  LayerContext,
  LayerOutput,
} from './types'
import {
  getSemanticNode,
  normalizeMetadata,
  getResourceName,
  toTitleCase,
  getActionName,
} from './helpers'
import { ACTION_MAP } from '../names'

export class ContractLayer {
  /**
   * Generate api-contract.ts
   * 
   * Responsibility:
   * - Emit ${model}Schema + ${resource}Schema untuk setiap model/resource
   * - Emit ${respName}ResponseSchema untuk routes yang fallback
   * - Return routeResponseMap untuk dikonsumsi ReadLayer/MapperLayer
   */
  static async generate(
    dir: string,
    context: LayerContext,
  ): Promise<{ output: LayerOutput; routeResponseMap: Map<string, RouteResponseComposition> }> {
    const lines: string[] = []
    const routeResponseMap = new Map<string, RouteResponseComposition>()
    const generatedSchemas = new Set<string>()

    // Emit model schemas
    if (context.manifest.models) {
      for (const model of context.manifest.models) {
        context.knownModels.add(`${model.name}Schema`)
        lines.push(this.generateModelSchema(model))
        lines.push('')
      }
    }

    // Emit resource schemas
    if (context.manifest.resources) {
      for (const resource of context.manifest.resources) {
        context.knownResources.add(`${resource.name}Schema`)
        lines.push(this.generateResourceSchema(resource))
        lines.push('')
      }
    }

    // Process routes untuk composite schemas
    const routes = context.manifest.routes || []
    const contractResponseCount = new Map<string, number>()

    // Hitung response per resource
    for (const route of routes) {
      if (route.response) {
        const resourceName = getResourceName(route)
        contractResponseCount.set(resourceName, (contractResponseCount.get(resourceName) || 0) + 1)
      }
    }

    // Generate route-specific schemas
    for (const route of routes) {
      if (!route.response) continue

      const resourceName = getResourceName(route)
      const titleCase = toTitleCase(resourceName)
      const actionName = getActionName(route, ACTION_MAP)
      const keyName = titleCase + actionName

      // Determine if resource alias or fallback
      const baseMeta = getSemanticNode(route.response)
      const respMeta = normalizeMetadata(route.response)

      const resourceRef = baseMeta?.resource || respMeta?.resource
      const isResourceAlias = 
        (baseMeta?.type === 'resource' || baseMeta?.kind === 'resource' ||
         respMeta?.type === 'resource' || respMeta?.kind === 'resource')
        && !!resourceRef && context.knownResources.has(`${resourceRef}Schema`)

      if (isResourceAlias) {
        // Resource alias — tidak perlu emit schema baru
        const zType = `${resourceRef}Schema`
        const tsType = `${resourceRef}Response`
        routeResponseMap.set(this.routeResponseKey(route), {
          zType, tsType,
          isCollection: !!respMeta.collection,
          isPaginated: !!respMeta.paginated,
          isWrapped: !!respMeta.wrapped,
          isResourceAlias: true,
        })
      } else {
        // Fallback — emit route-named schema
        const count = contractResponseCount.get(resourceName) || 1
        const respName = count === 1 ? titleCase : keyName
        const schemaName = `${respName}ResponseSchema`

        if (!generatedSchemas.has(schemaName)) {
          generatedSchemas.add(schemaName)
          const zType = this.buildResponseZodType(route.response, context)
          lines.push(`export const ${schemaName} = ${zType}`)
          lines.push(`export type ${respName}Response = z.infer<typeof ${schemaName}>`)
          lines.push(`export const validate${respName}Response = (payload: unknown): ${respName}Response => ${schemaName}.parse(payload)`)
          lines.push('')
        }

        routeResponseMap.set(this.routeResponseKey(route), {
          zType: schemaName,
          tsType: `${respName}Response`,
          isCollection: !!respMeta.collection,
          isPaginated: !!respMeta.paginated,
          isWrapped: !!respMeta.wrapped,
          isResourceAlias: false,
          name: respName,
        })
      }
    }

    // Write file
    const filePath = path.join(dir, 'api-contract.ts')
    if (lines.length > 0) {
      await fs.writeFile(filePath, lines.join('\n'))
    }

    return {
      output: { lines },
      routeResponseMap,
    }
  }

  private static generateModelSchema(model: ParsedModel): string {
    // Generate Zod schema untuk model
    // Ini re-use logic dari existing ZodTierGenerator.buildResponseZodType
    // untuk columns → z.string(), z.number(), etc
    const fields = Object.entries(model.fields)
      .map(([name, field]: [string, ParsedField]) => {
        const zType = this.mapSqlTypeToZod(field.type, field.cast)
        const nullable = field.nullable ? `.nullable()` : ``
        return `  ${name}: ${zType}${nullable},`
      })
      .join('\n')

    return `export const ${model.name}Schema = z.object({
${fields}
})`
  }

  private static generateResourceSchema(resource: ParsedResource): string {
    // Generate Zod schema untuk resource fields
    const fields = Object.entries(resource.fields)
      .map(([name, field]: [string, ParsedField]) => {
        // Resource fields biasanya string/number dari accessor
        const zType = 'z.string()' // simplified, real: resolve dari accessor type
        return `  ${name}: ${zType},`
      })
      .join('\n')

    return `export const ${resource.name}Schema = z.object({
${fields}
})`
  }

  private static buildResponseZodType(response: RuntimeAugmented<Record<string, unknown>>, context: LayerContext): string {
    // Re-use logic dari existing ZodTierGenerator
    // Build Zod expression dari response metadata
    // ...implementation...
    return 'z.object({})' // placeholder
  }

  private static mapSqlTypeToZod(sqlType: string, cast?: string): string {
    // Map SQL type → Zod validator
    // if (sqlType.includes('int')) return 'z.number()'
    // if (sqlType.includes('varchar')) return 'z.string()'
    // ...dst...
    return 'z.unknown()' // placeholder
  }

  private static routeResponseKey(route: ParsedRoute): string {
    return route.name || `${route.method}:${route.path}`
  }
}
```

---

## PHASE 3: ReadLayer.ts (Read Model - camelCase)

```typescript
// packages/cli/src/generators/layers/ReadLayer.ts

import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'
import {
  RouteResponseComposition,
  LayerContext,
  LayerOutput,
} from './types'
import {
  getSemanticNode,
  normalizeMetadata,
  getResourceName,
  toTitleCase,
} from './helpers'

export class ReadLayer {
  /**
   * Generate api-read.ts
   * 
   * Responsibility:
   * - Emit ${Model}Transformed types (camelCase, readonly)
   * - Emit ${Resource}Index, ${Resource}Show response types
   * - Use routeResponseMap dari ContractLayer (don't re-infer!)
   */
  static async generate(
    dir: string,
    context: LayerContext,
    routeResponseMap: Map<string, RouteResponseComposition>,
  ): Promise<LayerOutput> {
    const lines: string[] = []
    const generatedTypes = new Set<string>()

    // Generate transformed types untuk each model
    if (context.manifest.models) {
      for (const model of context.manifest.models) {
        lines.push(this.generateTransformedType(model))
        lines.push('')
      }
    }

    // Generate response types untuk each route (dari routeResponseMap)
    const routes = context.manifest.routes || []
    for (const route of routes) {
      if (!route.response) continue

      const resourceName = getResourceName(route)
      const titleCase = toTitleCase(resourceName)
      
      // Baca dari routeResponseMap daripada re-infer!
      const composition = routeResponseMap.get(this.routeResponseKey(route))
      if (!composition) continue

      const isCollection = composition.isCollection
      const isPaginated = composition.isPaginated

      // Emit response type berdasarkan composition
      const typeName = this.deriveTypeName(titleCase, isCollection, isPaginated)
      if (!generatedTypes.has(typeName)) {
        generatedTypes.add(typeName)
        lines.push(this.generateResponseType(typeName, composition, isCollection, isPaginated))
        lines.push('')
      }
    }

    // Write file
    const filePath = path.join(dir, 'api-read.ts')
    await fs.writeFile(filePath, lines.join('\n'))

    return { lines }
  }

  private static generateTransformedType(model: ParsedModel): string {
    // Generate interface ${Model}Transformed dengan camelCase fields
    const fields = Object.entries(model.fields)
      .map(([dbName, field]: [string, ParsedField]) => {
        const camelName = this.toCamelCase(dbName)
        const tsType = this.mapSqlTypeToTs(field.type, field.cast)
        return `  readonly ${camelName}: ${tsType}`
      })
      .join('\n')

    return `export interface ${model.name}Transformed {
${fields}
}`
  }

  private static generateResponseType(
    typeName: string,
    composition: RouteResponseComposition,
    isCollection: boolean,
    isPaginated: boolean,
  ): string {
    let typeExpr = composition.tsType

    if (isCollection && isPaginated) {
      typeExpr = `{ data: ${composition.tsType}[]; currentPage?: number; total?: number }`
    } else if (isCollection) {
      typeExpr = `${composition.tsType}[]`
    } else if (composition.isWrapped) {
      typeExpr = `{ data: ${composition.tsType} }`
    }

    return `export interface ${typeName} {
  ${typeExpr}
}`
  }

  private static mapSqlTypeToTs(sqlType: string, cast?: string): string {
    // Map SQL type → TypeScript type
    // PENTING: Harus IDENTIK dengan mapSqlTypeToZod di ContractLayer!
    // if (sqlType.includes('int')) return 'number'
    // if (sqlType.includes('varchar')) return 'string'
    // ...dst...
    return 'unknown' // placeholder
  }

  private static toCamelCase(str: string): string {
    return str
      .split('_')
      .map((part, idx) => 
        idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join('')
  }

  private static deriveTypeName(base: string, isCollection: boolean, isPaginated: boolean): string {
    if (isCollection && isPaginated) return `${base}Index`
    if (isCollection) return `${base}List`
    return `${base}Show`
  }

  private static routeResponseKey(route: ParsedRoute): string {
    return route.name || `${route.method}:${route.path}`
  }
}
```

---

## PHASE 4: MapperLayer.ts (Transform Functions)

```typescript
// packages/cli/src/generators/layers/MapperLayer.ts

import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'
import {
  RouteResponseComposition,
  LayerContext,
  LayerOutput,
} from './types'
import {
  getResourceName,
  toTitleCase,
  getActionName,
} from './helpers'
import { ACTION_MAP } from '../names'

export class MapperLayer {
  /**
   * Generate api-mapper.ts
   * 
   * Responsibility:
   * - Emit to${Model}Read, to${Model}ReadList transform functions
   * - Emit toApi${Action} transform functions untuk form → API
   * - Use routeResponseMap (don't re-count or re-infer!)
   */
  static async generate(
    dir: string,
    context: LayerContext,
    routeResponseMap: Map<string, RouteResponseComposition>,
  ): Promise<LayerOutput> {
    const lines: string[] = []
    const generatedMappers = new Set<string>()

    // Generate read mappers (response transform)
    if (context.manifest.models) {
      for (const model of context.manifest.models) {
        const mapperName = `to${model.name}Read`
        if (!generatedMappers.has(mapperName)) {
          generatedMappers.add(mapperName)
          lines.push(this.generateReadMapper(model))
          lines.push('')
        }

        const listMapperName = `to${model.name}ReadList`
        if (!generatedMappers.has(listMapperName)) {
          generatedMappers.add(listMapperName)
          lines.push(this.generateReadListMapper(model))
          lines.push('')
        }
      }
    }

    // Generate API mappers (form transform)
    const routes = context.manifest.routes || []
    for (const route of routes) {
      if (!route.response || !route.schema) continue

      const resourceName = getResourceName(route)
      const titleCase = toTitleCase(resourceName)
      const actionName = getActionName(route, ACTION_MAP)

      // Hanya emit untuk POST/PUT (create/update)
      if (['Create', 'Update'].includes(actionName)) {
        const mapperName = `toApi${titleCase}${actionName}`
        if (!generatedMappers.has(mapperName)) {
          generatedMappers.add(mapperName)
          lines.push(this.generateApiMapper(route, titleCase, actionName))
          lines.push('')
        }
      }
    }

    // Write file
    const filePath = path.join(dir, 'api-mapper.ts')
    await fs.writeFile(filePath, lines.join('\n'))

    return { lines }
  }

  private static generateReadMapper(model: ParsedModel): string {
    // Generate: export const to${Model}Read = (raw: ${Model}): ${Model}Transformed => ...
    const fields = Object.entries(model.fields)
      .map(([dbName, field]: [string, ParsedField]) => {
        const camelName = this.toCamelCase(dbName)
        return `  ${camelName}: raw.${dbName},`
      })
      .join('\n')

    return `export const to${model.name}Read = (raw: ${model.name}): ${model.name}Transformed => ({
${fields}
})`
  }

  private static generateReadListMapper(model: ParsedModel): string {
    return `export const to${model.name}ReadList = (raw: ${model.name}[]): ${model.name}Transformed[] =>
  raw.map(to${model.name}Read)`
  }

  private static generateApiMapper(route: ParsedRoute, titleCase: string, actionName: string): string {
    // Generate: export const toApi${TitleCase}${Action} = (form: ${Form}): ${Payload} => ...
    // Ini re-use logic dari existing ZodTierGenerator untuk nested field transform
    return `export const toApi${titleCase}${actionName} = (form: ${titleCase}Form['${actionName}']): ${titleCase}${actionName}Payload => ({
  // TODO: implement field transform
})`
  }

  private static toCamelCase(str: string): string {
    return str
      .split('_')
      .map((part, idx) =>
        idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join('')
  }
}
```

---

## PHASE 5: ZodTierGenerator.ts (Orchestrator)

```typescript
// packages/cli/src/generators/ZodTierGenerator.ts (REFACTORED)

import path from 'path'
import fs from 'fs-extra'
import { RouteManifest, SemanticResolutionKernel } from '@routesync/core'
import { ContractLayer } from './layers/ContractLayer'
import { SchemaLayer } from './layers/SchemaLayer'
import { FieldLayer } from './layers/FieldLayer'
import { ReadLayer } from './layers/ReadLayer'
import { FormLayer } from './layers/FormLayer'
import { MapperLayer } from './layers/MapperLayer'
import { LayerContext } from './layers/types'

export class ZodTierGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    // Setup context
    const context: LayerContext = {
      manifest,
      knownModels: new Set(),
      knownResources: new Set(),
      kernel: new SemanticResolutionKernel(),
    }

    // Ensure output dirs
    const contractDir = path.join(outputDir, 'contract')
    const typesDir = path.join(outputDir, 'types')
    const mappersDir = path.join(outputDir, 'mappers')

    await fs.ensureDir(contractDir)
    await fs.ensureDir(typesDir)
    await fs.ensureDir(mappersDir)

    // Execute layers in order
    // Phase 1: Contract (generates routeResponseMap IR)
    const { routeResponseMap } = await ContractLayer.generate(contractDir, context)

    // Phase 2: Schema (independent, tapi bisa use routeResponseMap)
    await SchemaLayer.generate(contractDir, context, routeResponseMap)

    // Phase 3: Field (independent)
    await FieldLayer.generate(contractDir, context)

    // Phase 4: Read & Form (use routeResponseMap)
    await ReadLayer.generate(typesDir, context, routeResponseMap)
    await FormLayer.generate(typesDir, context)

    // Phase 5: Mapper (use routeResponseMap)
    await MapperLayer.generate(mappersDir, context, routeResponseMap)
  }
}
```

---

## ACCEPTANCE CRITERIA CHECKLIST

- [ ] 6 layer files buat di `packages/cli/src/generators/layers/`
- [ ] Shared types.ts + helpers.ts ada
- [ ] `ZodTierGenerator.ts` jadi orchestrator (<100 lines)
- [ ] Semua output files 100% identik dengan original
- [ ] Test: diff output before/after → 0 difference
- [ ] Type safety: semua layer punya proper interfaces
- [ ] No duplication: routeResponseMap di-reuse, bukan re-compute
- [ ] Clean imports: layers hanya import dari types.ts + helpers.ts
- [ ] Testability: tiap layer bisa di-test independent

