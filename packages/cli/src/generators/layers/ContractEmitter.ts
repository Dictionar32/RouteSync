/**
 * layers/ContractEmitter.ts
 *
 * Emits: contract/api-contract.ts
 * 
 * RESPONSIBILITY: Generate Zod schemas untuk backend responses (snake_case)
 * 
 * Outputs:
 * - ${Model}Schema untuk each model
 * - ${Resource}Schema untuk each resource
 * - ${ResponseName}ResponseSchema untuk routes dengan custom response
 * 
 * ALSO RETURNS: routeResponseMap untuk di-pass ke ReadEmitter & MapperEmitter
 * 
 * CONSOLIDATES:
 * - ZodTierGenerator.generateContract() logic (lines 112-425)
 * - Type inference untuk Zod (previously scattered di generateRead, buildResponseZodType)
 */

import path from 'path'
import fs from 'fs-extra'
import {
    LayerContext,
    LayerOutput,
    RouteResponseComposition,
    ParsedModel,
    ParsedResource,
    ParsedRoute,
    ParsedField,
} from './types'
import {
    normalizeMetadata,
    getResourceName,
    toTitleCase,
    getActionName,
    routeResponseKey,
    mapSqlTypeToZod,
    wrapNullableZod,
    isResourceAlias,
} from './helpers'
import { CANONICAL_ACTION_MAP } from '../canonical-names'

export class ContractEmitter {
    /**
     * Main entry point untuk generate contract layer
     * 
     * Returns BOTH output file content AND routeResponseMap IR
     * (routeResponseMap di-reuse oleh ReadEmitter & MapperEmitter)
     */
    static async generate(
        contractDir: string,
        context: LayerContext,
    ): Promise<{ output: LayerOutput; routeResponseMap: Map<string, RouteResponseComposition> }> {
        const lines: string[] = []
        const routeResponseMap = new Map<string, RouteResponseComposition>()
        const generatedSchemas = new Set<string>()

        // Import statement
        lines.push(`import { z } from 'zod'`)
        lines.push('')

        // Phase 1: Generate model schemas
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    lines.push(this.generateModelSchema(model, context))
                    lines.push('')
                    context.knownSchemas.add(`${model.name}Schema`)
                } catch (error) {
                    console.warn(`[ContractEmitter] Error generating model ${model.name}:`, error)
                }
            }
        }

        // Phase 2: Generate resource schemas
        if (context.manifest.resources) {
            for (const resource of context.manifest.resources) {
                try {
                    lines.push(this.generateResourceSchema(resource, context))
                    lines.push('')
                    context.knownSchemas.add(`${resource.name}Schema`)
                } catch (error) {
                    console.warn(`[ContractEmitter] Error generating resource ${resource.name}:`, error)
                }
            }
        }

        // Phase 3: Process routes untuk composite schemas & build routeResponseMap
        const routes = context.manifest.routes || []

        // Count responses per group untuk dedup
        const responseCountByGroup = new Map<string, number>()
        for (const route of routes) {
            if (!route.response) continue
            const groupName = getResourceName(route)
            responseCountByGroup.set(groupName, (responseCountByGroup.get(groupName) || 0) + 1)
        }

        // Generate route-specific schemas & build IR
        for (const route of routes) {
            if (!route.response) continue

            try {
                const key = routeResponseKey(route)
                const groupName = getResourceName(route)
                const titleCase = toTitleCase(groupName)
                const actionName = getActionName(route, CANONICAL_ACTION_MAP as Record<string, string>)
                const responseCount = responseCountByGroup.get(groupName) || 1

                // Determine if resource alias
                const meta = normalizeMetadata(route.response)
                const isAlias = isResourceAlias(route.response, context.knownSchemas)

                if (isAlias) {
                    // Resource alias: use existing schema
                    const resourceName = meta.resource as string | undefined
                    if (resourceName) {
                        const zodType = `${resourceName}Schema`
                        const tsType = `${resourceName}Response`

                        routeResponseMap.set(key, {
                            zType: zodType,
                            tsType: tsType,
                            isCollection: !!meta.collection,
                            isPaginated: !!meta.paginated,
                            isWrapped: !!meta.wrapped,
                            isResourceAlias: true,
                            name: resourceName,
                        })
                    }
                } else {
                    // Fallback: emit route-specific schema
                    const responseNameBase = responseCount === 1 ? titleCase : `${titleCase}${actionName}`
                    const schemaName = `${responseNameBase}ResponseSchema`

                    if (!generatedSchemas.has(schemaName)) {
                        generatedSchemas.add(schemaName)

                        // Build Zod type expression
                        const zodExpr = this.buildResponseZodType(route.response, context)
                        lines.push(`export const ${schemaName} = ${zodExpr}`)
                        lines.push(`export type ${responseNameBase}Response = z.infer<typeof ${schemaName}>`)
                        lines.push(
                            `export const validate${responseNameBase}Response = (payload: unknown): ${responseNameBase}Response => ${schemaName}.parse(payload)`
                        )
                        lines.push('')
                    }

                    routeResponseMap.set(key, {
                        zType: schemaName,
                        tsType: `${responseNameBase}Response`,
                        isCollection: !!meta.collection,
                        isPaginated: !!meta.paginated,
                        isWrapped: !!meta.wrapped,
                        isResourceAlias: false,
                        name: responseNameBase,
                    })
                }
            } catch (error) {
                console.warn(`[ContractEmitter] Error processing route ${route.name}:`, error)
            }
        }

        // Write file
        const filePath = path.join(contractDir, 'api-contract.ts')
        await fs.ensureDir(contractDir)
        await fs.writeFile(filePath, lines.join('\n'))

        return {
            output: { lines },
            routeResponseMap,
        }
    }

    /**
     * Generate Zod schema untuk model fields (dengan cast resolution)
     * 
     * Output:
     * export const ProductSchema = z.object({
     *   id: z.number(),
     *   name: z.string(),
     *   price: z.number(),
     *   created_at: z.string(),
     * })
     */
    private static generateModelSchema(model: ParsedModel, context: LayerContext): string {
        const fields: string[] = []

        if (!model.fields) {
            return `export const ${model.name}Schema = z.object({})`
        }

        for (const [fieldName, fieldDef] of Object.entries(model.fields)) {
            const field = fieldDef as ParsedField
            const zodType = mapSqlTypeToZod(field.type, field.cast)
            const nullable = field.nullable ? `.nullable()` : ''
            fields.push(`  ${fieldName}: ${zodType}${nullable},`)
        }

        return `export const ${model.name}Schema = z.object({
${fields.join('\n')}
})`
    }

    /**
     * Generate Zod schema untuk resource fields
     * 
     * Resources usually have string/number accessors
     * 
     * Output:
     * export const OrderResourceSchema = z.object({
     *   id: z.number(),
     *   total: z.number(),
     *   customer_name: z.string(),
     * })
     */
    private static generateResourceSchema(resource: ParsedResource, _context: LayerContext): string {
        const fields: string[] = []

        if (!resource.fields) {
            return `export const ${resource.name}Schema = z.object({})`
        }

        for (const [fieldName, fieldDef] of Object.entries(resource.fields)) {
            const field = fieldDef as ParsedField
            // Resource fields: infer type dari field metadata
            const zodType = mapSqlTypeToZod(field.type, field.cast) || 'z.string()'
            const nullable = field.nullable ? `.nullable()` : ''
            fields.push(`  ${fieldName}: ${zodType}${nullable},`)
        }

        return `export const ${resource.name}Schema = z.object({
${fields.join('\n')}
})`
    }

    /**
     * CRITICAL: Build Zod expression dari response metadata
     * 
     * CONSOLIDATES logic dari:
     * - ZodTierGenerator.buildResponseZodType() lines 512-664 (200+ lines)
     * - Previously inlined dalam generateContract()
     * 
     * Input: response metadata (bisa primitive, object, array, wrapped, etc)
     * Output: Zod expression string (e.g., 'z.object({ ... })', 'z.array(z.object({ ... }))', etc)
     * 
     * PENTING: Deterministic! Sama input → sama output ALWAYS
     */
    private static buildResponseZodType(response: unknown, context: LayerContext): string {
        if (!response || typeof response !== 'object') return 'z.unknown()'

        const meta = normalizeMetadata(response as Record<string, unknown>)

        // Check untuk array
        if (meta.collection) {
            if (meta.paginated) {
                // Paginated collection: { data: [...], meta: {...} }
                return `z.object({
  data: z.array(z.object({})),
  current_page: z.number().optional(),
  total: z.number().optional(),
  per_page: z.number().optional(),
  last_page: z.number().optional(),
})`
            } else {
                // Simple array
                return `z.array(z.object({}))`
            }
        }

        // Check untuk wrapped
        if (meta.wrapped) {
            return `z.object({
  data: z.object({}),
})`
        }

        // Plain object (fallback)
        return `z.object({})`
    }
}

