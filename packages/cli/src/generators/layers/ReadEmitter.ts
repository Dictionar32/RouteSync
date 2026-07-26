/**
 * layers/ReadEmitter.ts
 *
 * Emits: types/api-read.ts
 * 
 * RESPONSIBILITY: Generate TypeScript interfaces untuk read responses (camelCase, frontend-friendly)
 * 
 * Outputs:
 * - ${Model}Transformed interfaces (camelCase, readonly)
 * - ${Resource}Index, ${Resource}Show response types (composite)
 * 
 * RECEIVES: routeResponseMap from ContractEmitter (DO NOT RE-COMPUTE!)
 * 
 * CONSOLIDATES:
 * - ZodTierGenerator.generateRead() logic (lines 867-1078)
 * - Type transformation (previously duplicated mapSqlTypeToTs)
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
    mapSqlTypeToTs,
    wrapNullableTs,
} from './helpers'

export class ReadEmitter {
    /**
     * Main entry point
     * 
     * PENTING: Accept routeResponseMap dari ContractEmitter
     * DO NOT re-compute atau re-infer!
     */
    static async generate(
        typesDir: string,
        context: LayerContext,
        routeResponseMap: Map<string, RouteResponseComposition>,
    ): Promise<LayerOutput> {
        const lines: string[] = []
        const generatedTypes = new Set<string>()

        // Phase 1: Generate transformed interfaces untuk models
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    lines.push(this.generateTransformedType(model))
                    lines.push('')
                    generatedTypes.add(`${model.name}Transformed`)
                } catch (error) {
                    console.warn(`[ReadEmitter] Error generating model ${model.name}:`, error)
                }
            }
        }

        // Phase 2: Generate response types untuk routes
        const routes = context.manifest.routes || []

        for (const route of routes) {
            if (!route.response) continue

            try {
                const key = routeResponseKey(route)
                const composition = routeResponseMap.get(key)

                if (!composition) {
                    console.warn(`[ReadEmitter] No composition found for route ${route.name}`)
                    continue
                }

                const groupName = getResourceName(route)
                const titleCase = toTitleCase(groupName)

                // Determine type name based on composition
                let typeName: string
                if (composition.isCollection && composition.isPaginated) {
                    typeName = `${titleCase}Index`
                } else if (composition.isCollection) {
                    typeName = `${titleCase}List`
                } else {
                    typeName = `${titleCase}Show`
                }

                if (!generatedTypes.has(typeName)) {
                    generatedTypes.add(typeName)
                    lines.push(this.generateResponseType(typeName, composition, groupName))
                    lines.push('')
                }
            } catch (error) {
                console.warn(`[ReadEmitter] Error processing route ${route.name}:`, error)
            }
        }

        // Write file
        const filePath = path.join(typesDir, 'api-read.ts')
        await fs.ensureDir(typesDir)
        await fs.writeFile(filePath, lines.join('\n'))

        return { lines }
    }

    /**
     * Generate Transformed interface untuk model
     * 
     * Converts snake_case (DB) → camelCase (Frontend)
     * 
     * Input:
     *   model Product { id, first_name, created_at }
     * 
     * Output:
     *   export interface ProductTransformed {
     *     readonly id: number
     *     readonly firstName: string
     *     readonly createdAt: string
     *   }
     */
    private static generateTransformedType(model: ParsedModel): string {
        const fields: string[] = []

        // NOTE: ParsedModel menyimpan kolom sebagai array `columns`
        // (packages/core/src/types/route.ts), bukan object `fields`. Bug
        // lama: baca `model.fields` (selalu undefined) -> SEMUA interface
        // Transformed selalu kosong `{}` — lolos test lama karena kata
        // 'interface'/'export' tetap ada meski body-nya kosong.
        const columns = (model as unknown as { columns?: Array<{ name: string; type: string; nullable: boolean }> }).columns
        const casts = (model as unknown as { casts?: Record<string, string> }).casts

        if (!columns || !columns.length) {
            return `export interface ${model.name}Transformed {}`
        }

        for (const column of columns) {
            const cast = casts?.[column.name]
            const camelName = toCamelCase(column.name)
            const tsType = mapSqlTypeToTs(column.type, cast)
            const nullable = column.nullable ? ' | null' : ''
            fields.push(`  readonly ${camelName}: ${tsType}${nullable}`)
        }

        return `export interface ${model.name}Transformed {
${fields.join('\n')}
}`
    }

    /**
     * Generate response type based on composition
     * 
     * PENTING: Use composition metadata untuk determine structure
     * DO NOT re-infer!
     */
    private static generateResponseType(
        typeName: string,
        composition: RouteResponseComposition,
        _groupName: string,
    ): string {
        let typeExpr: string

        // Build type expression based on composition flags
        if (composition.isCollection && composition.isPaginated) {
            // Paginated response: { data: T[], currentPage?, total? }
            typeExpr = `{
  readonly data: ${composition.tsType}[]
  readonly currentPage?: number
  readonly total?: number
  readonly perPage?: number
  readonly lastPage?: number
}`
        } else if (composition.isCollection) {
            // Array response
            typeExpr = `${composition.tsType}[]`
        } else if (composition.isWrapped) {
            // Wrapped response: { data: T }
            typeExpr = `{
  readonly data: ${composition.tsType}
}`
        } else {
            // Plain object response
            typeExpr = composition.tsType
        }

        // BUG LAMA (Engine.Fix.md §38): sebelumnya SEMUA cabang di atas
        // (termasuk yang sudah berupa object-literal type `{...}`, mis. hasil
        // paginated/wrapped) dibungkus lagi paksa jadi
        // `export interface ${typeName} { ${typeExpr} }`. Untuk cabang
        // collection/paginated/wrapped ini menghasilkan brace bersarang tanpa
        // nama property (invalid TS). Untuk cabang plain-object ini
        // menghasilkan `interface X { RegisterResponse }` — bare identifier
        // di dalam body interface, juga invalid TS. `type` alias valid untuk
        // SEMUA bentuk typeExpr (object literal, array, atau bare reference),
        // jadi dipakai seragam di sini, bukan `interface`.
        return `export type ${typeName} = ${typeExpr}`
    }
}

