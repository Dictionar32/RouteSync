/**
 * layers/MapperEmitter.ts
 *
 * Emits: mappers/api-mapper.ts
 * 
 * RESPONSIBILITY: Generate transform functions between API (snake_case) and Frontend (camelCase)
 * 
 * Outputs:
 * - to${Model}Read: snake_case API response → camelCase frontend model
 * - to${Model}ReadList: transform array
 * - toApi${Action}: form data → API payload (for mutations)
 * 
 * RECEIVES: routeResponseMap from ContractEmitter (DO NOT RE-COMPUTE!)
 * 
 * CONSOLIDATES:
 * - ZodTierGenerator.generateMapper() logic (lines 1180-1529)
 * - Nested field transformation logic
 */

import path from 'path'
import fs from 'fs-extra'
import {
    LayerContext,
    LayerOutput,
    RouteResponseComposition,
    ParsedModel,
    ParsedField,
    ParsedRoute,
} from './types'
import {
    normalizeMetadata,
    getResourceName,
    toTitleCase,
    toCamelCase,
    routeResponseKey,
    getActionName,
} from './helpers'
import { CANONICAL_ACTION_MAP } from '../canonical-names'

export class MapperEmitter {
    /**
     * Main entry point
     * 
     * PENTING: Accept routeResponseMap dari ContractEmitter
     * DO NOT re-compute atau re-infer!
     */
    static async generate(
        mappersDir: string,
        context: LayerContext,
        routeResponseMap: Map<string, RouteResponseComposition>,
    ): Promise<LayerOutput> {
        const lines: string[] = []
        const generatedMappers = new Set<string>()

        // Phase 1: Generate read mappers (response transform)
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    const mapperName = `to${model.name}Read`
                    const listMapperName = `to${model.name}ReadList`

                    if (!generatedMappers.has(mapperName)) {
                        generatedMappers.add(mapperName)
                        lines.push(this.generateReadMapper(model))
                        lines.push('')
                    }

                    if (!generatedMappers.has(listMapperName)) {
                        generatedMappers.add(listMapperName)
                        lines.push(this.generateReadListMapper(model))
                        lines.push('')
                    }
                } catch (error) {
                    console.warn(`[MapperEmitter] Error generating mapper for model ${model.name}:`, error)
                }
            }
        }

        // Phase 2: Generate API mappers (form transform)
        const routes = context.manifest.routes || []

        for (const route of routes) {
            if (!route.response || !route.schema) continue

            try {
                const groupName = getResourceName(route)
                const titleCase = toTitleCase(groupName)
                const actionName = getActionName(route, CANONICAL_ACTION_MAP as Record<string, string>)

                // Only emit untuk POST/PUT/PATCH (mutations)
                if (['Create', 'Update'].includes(actionName)) {
                    const mapperName = `toApi${titleCase}${actionName}`
                    if (!generatedMappers.has(mapperName)) {
                        generatedMappers.add(mapperName)
                        lines.push(this.generateApiMapper(route, titleCase, actionName))
                        lines.push('')
                    }
                }
            } catch (error) {
                console.warn(`[MapperEmitter] Error processing route ${route.name}:`, error)
            }
        }

        // Write file
        const filePath = path.join(mappersDir, 'api-mapper.ts')
        await fs.ensureDir(mappersDir)
        await fs.writeFile(filePath, lines.join('\n'))

        return { lines }
    }

    /**
     * Generate read mapper: API response → Frontend model
     * 
     * Input: raw API response dengan snake_case
     * Output: Frontend model dengan camelCase
     * 
     * Example:
     *   export const toProductRead = (raw: Product): ProductTransformed => ({
     *     id: raw.id,
     *     firstName: raw.first_name,
     *     createdAt: raw.created_at,
     *   })
     */
    private static generateReadMapper(model: ParsedModel): string {
        const mappings: string[] = []

        if (!model.fields) {
            return `export const to${model.name}Read = (raw: ${model.name}): ${model.name}Transformed => raw as ${model.name}Transformed`
        }

        for (const [dbName, fieldDef] of Object.entries(model.fields)) {
            const field = fieldDef as ParsedField
            const camelName = toCamelCase(dbName)
            mappings.push(`    ${camelName}: raw.${dbName} as unknown as typeof raw.${dbName},`)
        }

        return `export const to${model.name}Read = (raw: ${model.name}): ${model.name}Transformed => ({
${mappings.join('\n')}
  })`
    }

    /**
     * Generate list mapper: transform array of responses
     * 
     * Example:
     *   export const toProductReadList = (raw: Product[]): ProductTransformed[] =>
     *     raw.map(toProductRead)
     */
    private static generateReadListMapper(model: ParsedModel): string {
        return `export const to${model.name}ReadList = (raw: ${model.name}[]): ${model.name}Transformed[] =>
  raw.map(to${model.name}Read)`
    }

    /**
     * Generate API mapper: Form input → API payload
     * 
     * Used untuk mutations (POST/PUT/PATCH)
     * 
     * Input: Form data (camelCase, from frontend)
     * Output: API payload (snake_case, untuk backend)
     * 
     * Example:
     *   export const toApiProductCreate = (form: ProductForm['create']): ProductCreatePayload => ({
     *     first_name: form.firstName,
     *     email: form.email,
     *   })
     */
    private static generateApiMapper(
        route: ParsedRoute,
        titleCase: string,
        actionName: string,
    ): string {
        // Get form schema dari route.schema.rules
        const formMappings: string[] = []

        if (route.schema?.rules) {
            for (const [fieldName] of Object.entries(route.schema.rules)) {
                const snakeName = fieldName
                const camelName = toCamelCase(fieldName)
                formMappings.push(`    ${snakeName}: form.${camelName} as unknown,`)
            }
        }

        const actionLower = actionName[0].toLowerCase() + actionName.slice(1)
        const formTypeName = `${titleCase}Form['${actionLower}']`
        const payloadTypeName = `${titleCase}${actionName}Payload`

        return `export const toApi${titleCase}${actionName} = (form: ${formTypeName}): ${payloadTypeName} => ({
${formMappings.join('\n')}
  })`
    }
}

