/**
 * layers/FieldEmitter.ts
 *
 * Emits: contract/api-fields.ts (optional, per-field metadata)
 * 
 * RESPONSIBILITY: Generate field-level metadata exports untuk advanced use cases
 * 
 * Outputs:
 * - Field definitions (per-field type info, validation rules, etc)
 * - Useful untuk dynamic form generation, autocomplete, etc
 * 
 * CONSOLIDATES:
 * - ZodTierGenerator.generateField() logic (lines 770-815)
 * - Per-field metadata that can be reused across layers
 */

import path from 'path'
import fs from 'fs-extra'
import {
    LayerContext,
    LayerOutput,
    ParsedField,
} from './types'
import {
    toTitleCase,
    toCamelCase,
    mapSqlTypeToZod,
    mapSqlTypeToTs,
} from './helpers'

export class FieldEmitter {
    /**
     * Main entry point
     */
    static async generate(
        contractDir: string,
        context: LayerContext,
    ): Promise<LayerOutput> {
        const lines: string[] = []

        // Import statement
        lines.push(`/**`)
        lines.push(` * Field definitions dengan metadata`)
        lines.push(` * Useful untuk dynamic form generation, autocomplete, etc`)
        lines.push(` */`)
        lines.push('')

        // Generate field definitions untuk models
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    lines.push(this.generateModelFieldDefinitions(model))
                    lines.push('')
                } catch (error) {
                    console.warn(`[FieldEmitter] Error processing model ${model.name}:`, error)
                }
            }
        }

        // Generate field definitions untuk resources
        if (context.manifest.resources) {
            for (const resource of context.manifest.resources) {
                try {
                    lines.push(this.generateResourceFieldDefinitions(resource))
                    lines.push('')
                } catch (error) {
                    console.warn(`[FieldEmitter] Error processing resource ${resource.name}:`, error)
                }
            }
        }

        // Write file
        const filePath = path.join(contractDir, 'api-fields.ts')
        await fs.ensureDir(contractDir)
        await fs.writeFile(filePath, lines.join('\n'))

        return { lines }
    }

    /**
     * Generate field definitions object untuk model
     * 
     * Example:
     *   export const ProductFields = {
     *     id: {
     *       name: 'id',
     *       snakeName: 'id',
     *       camelName: 'id',
     *       type: 'number',
     *       nullable: false,
     *       zodType: 'z.number()',
     *       tsType: 'number',
     *     },
     *     first_name: {
     *       name: 'firstName',
     *       snakeName: 'first_name',
     *       camelName: 'firstName',
     *       type: 'string',
     *       nullable: false,
     *       zodType: 'z.string()',
     *       tsType: 'string',
     *     },
     *   } as const
     */
    private static generateModelFieldDefinitions(model: unknown): string {
        const fields: string[] = []

        if (!model || typeof model !== 'object') {
            return `export const UnknownFields = {} as const`
        }

        const m = model as { name?: string; fields?: Record<string, unknown> }

        if (!m.fields || !m.name) {
            return `export const UnknownModelFields = {} as const`
        }

        for (const [snakeName, fieldDef] of Object.entries(m.fields)) {
            if (!fieldDef || typeof fieldDef !== 'object') continue

            const f = fieldDef as { type?: string; cast?: string; nullable?: boolean }
            const camelName = toCamelCase(snakeName)
            const zodType = mapSqlTypeToZod(f.type || '', f.cast)
            const tsType = mapSqlTypeToTs(f.type || '', f.cast)
            const type = this.parseFieldType(f.type || '', f.cast)

            fields.push(`  ${snakeName}: {
    name: '${camelName}',
    snakeName: '${snakeName}',
    camelName: '${camelName}',
    type: '${type}',
    nullable: ${f.nullable ?? false},
    zodType: '${zodType}',
    tsType: '${tsType}',
  },`)
        }

        return `export const ${m.name}Fields = {
${fields.join('\n')}
} as const`
    }

    /**
     * Generate field definitions object untuk resource
     */
    private static generateResourceFieldDefinitions(resource: unknown): string {
        const fields: string[] = []

        if (!resource || typeof resource !== 'object') {
            return `export const UnknownFields = {} as const`
        }

        const r = resource as { name?: string; fields?: Record<string, unknown> }

        if (!r.fields || !r.name) {
            return `export const UnknownResourceFields = {} as const`
        }

        for (const [snakeName, fieldDef] of Object.entries(r.fields)) {
            if (!fieldDef || typeof fieldDef !== 'object') continue

            const f = fieldDef as { type?: string; cast?: string; nullable?: boolean }
            const camelName = toCamelCase(snakeName)
            const zodType = mapSqlTypeToZod(f.type || '', f.cast) || 'z.string()'
            const tsType = mapSqlTypeToTs(f.type || '', f.cast) || 'string'
            const type = this.parseFieldType(f.type || '', f.cast)

            fields.push(`  ${snakeName}: {
    name: '${camelName}',
    snakeName: '${snakeName}',
    camelName: '${camelName}',
    type: '${type}',
    nullable: ${f.nullable ?? false},
    zodType: '${zodType}',
    tsType: '${tsType}',
  },`)
        }

        return `export const ${r.name}Fields = {
${fields.join('\n')}
} as const`
    }

    /**
     * Parse field type dari SQL type atau cast
     */
    private static parseFieldType(
        sqlType: string,
        cast: string | undefined,
    ): 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unknown' {
        const typeStr = (cast || sqlType || '').toLowerCase()

        if (typeStr.includes('string') || typeStr.includes('text') || typeStr.includes('char')) {
            return 'string'
        }
        if (typeStr.includes('int') || typeStr.includes('float') || typeStr.includes('decimal') || typeStr.includes('number')) {
            return 'number'
        }
        if (typeStr.includes('bool')) {
            return 'boolean'
        }
        if (typeStr.includes('json') || typeStr.includes('object')) {
            return 'object'
        }
        if (typeStr.includes('array') || typeStr.includes('collection')) {
            return 'array'
        }

        return 'unknown'
    }
}

