/**
 * layers/SchemaEmitter.ts
 *
 * Emits: contract/api-schema.ts (or contract/schema.ts)
 * 
 * RESPONSIBILITY: Generate form validation schemas (Zod untuk client-side form validation)
 * 
 * Outputs:
 * - ${Model}${Action}FormSchema untuk each mutation route
 * - Validation rules (min/max length, patterns, etc)
 * 
 * RECEIVES: routeResponseMap (optional, untuk reference types)
 * 
 * CONSOLIDATES:
 * - ZodTierGenerator.generateSchema() logic (lines 666-768)
 */

import path from 'path'
import fs from 'fs-extra'
import {
    LayerContext,
    LayerOutput,
} from './types'
import {
    getResourceName,
    toTitleCase,
    getActionName,
    mapSqlTypeToZod,
    wrapNullableZod,
} from './helpers'
import { CANONICAL_ACTION_MAP } from '../canonical-names'

export class SchemaEmitter {
    /**
     * Main entry point
     */
    static async generate(
        contractDir: string,
        context: LayerContext,
    ): Promise<LayerOutput> {
        const lines: string[] = []

        // Import statement
        lines.push(`import { z } from 'zod'`)
        lines.push('')

        // Generate form schemas untuk mutation routes (POST/PUT/PATCH)
        const routes = context.manifest.routes || []

        for (const route of routes) {
            if (!route.schema || !route.schema.rules) continue

            try {
                const method = (route.method || 'get').toLowerCase()
                const actionName = getActionName(route, CANONICAL_ACTION_MAP as Record<string, string>)

                // Only emit untuk mutations
                if (!['Create', 'Update'].includes(actionName)) continue

                const groupName = getResourceName(route)
                const titleCase = toTitleCase(groupName)
                const actionLower = actionName[0].toLowerCase() + actionName.slice(1)

                const schemaName = `${titleCase}${actionName}FormSchema`
                const typeName = `${titleCase}${actionName}Form`

                lines.push(this.generateFormSchema(schemaName, typeName, route.schema.rules))
                lines.push('')
            } catch (error) {
                console.warn(`[SchemaEmitter] Error processing route ${route.name}:`, error)
            }
        }

        // Write file
        const filePath = path.join(contractDir, 'api-schema.ts')
        await fs.ensureDir(contractDir)
        await fs.writeFile(filePath, lines.join('\n'))

        return { lines }
    }

    /**
     * Generate form schema (Zod object) dari validation rules
     * 
     * Example:
     *   export const ProductCreateFormSchema = z.object({
     *     name: z.string().min(1),
     *     price: z.number().min(0),
     *     description: z.string().optional(),
     *   })
     *   export type ProductCreateForm = z.infer<typeof ProductCreateFormSchema>
     */
    private static generateFormSchema(
        schemaName: string,
        typeName: string,
        rules: Record<string, unknown>,
    ): string {
        const fields: string[] = []

        for (const [fieldName, ruleData] of Object.entries(rules)) {
            // BUG LAMA (Engine.Fix.md §38): kode ini sebelumnya cuma
            // menangani `ruleData` berbentuk object bersarang
            // ({ type/rules/required/nullable: ... }) dan langsung bail ke
            // z.unknown() untuk apapun yang bukan object — padahal bentuk
            // ASLI `route.schema.rules` di manifest nyata adalah flat
            // string per field (mis. `{ name: 'required|string|max:255' }`,
            // dikonfirmasi langsung dari routesync.manifest.json), BUKAN
            // object bersarang. Akibatnya SEMUA field selalu z.unknown(),
            // parseValidationRules() yang sudah benar tidak pernah tercapai.
            if (typeof ruleData === 'string') {
                let zodExpr = this.parseValidationRules(ruleData)
                const isRequired = ruleData.split('|').map((r) => r.trim()).includes('required')
                if (!isRequired) {
                    zodExpr = `${zodExpr}.optional()`
                }
                fields.push(`  ${fieldName}: ${zodExpr},`)
                continue
            }

            if (!ruleData || typeof ruleData !== 'object') {
                fields.push(`  ${fieldName}: z.unknown(),`)
                continue
            }

            const rule = ruleData as Record<string, unknown>

            // Determine base type dari rule
            let zodExpr = 'z.unknown()'

            if (typeof rule.type === 'string') {
                const baseType = mapSqlTypeToZod(rule.type as string)
                zodExpr = baseType
            } else if (typeof rule.rules === 'string') {
                // Laravel validation string (e.g., 'required|string|min:10')
                zodExpr = this.parseValidationRules(rule.rules as string)
            }

            // Apply modifiers berdasarkan rule properties
            const isRequired = rule.required !== false && !rule.nullable
            const isNullable = rule.nullable === true

            if (!isRequired) {
                zodExpr = `${zodExpr}.optional()`
            }

            if (isNullable) {
                zodExpr = wrapNullableZod(zodExpr, true)
            }

            fields.push(`  ${fieldName}: ${zodExpr},`)
        }

        return `export const ${schemaName} = z.object({
${fields.join('\n')}
})

export type ${typeName} = z.infer<typeof ${schemaName}>`
    }

    /**
     * Parse Laravel validation rule string ke Zod expression
     * 
     * Contoh:
     *   'required|string|min:10|max:100' → 'z.string().min(10).max(100)'
     *   'required|integer|min:1' → 'z.number().int().min(1)'
     *   'required|email' → 'z.string().email()'
     */
    private static parseValidationRules(ruleString: string): string {
        const rules = ruleString.split('|').map(r => r.trim())

        // Default z.string() — bukan z.unknown(). Rule seperti `min:6`/`max:255`
        // tanpa keyword tipe eksplisit (string/integer/numeric) secara teknis
        // ambigu di Laravel (bisa berlaku untuk panjang string, nilai numerik,
        // atau jumlah elemen array, tergantung tipe runtime value-nya) — tapi
        // konvensi paling umum untuk form validation TANPA rule tipe eksplisit
        // adalah field string (mis. `required|min:6` untuk password). Default
        // z.unknown() sebelumnya membuat kasus ini SELALU jatuh ke unknown
        // walau konteksnya jelas string di mayoritas kasus nyata.
        let baseType = 'z.string()'
        const modifiers: string[] = []

        for (const rule of rules) {
            if (rule === 'required' || rule === 'filled') {
                // Handled separately (not optional)
                continue
            } else if (rule === 'nullable') {
                // Handled separately
                continue
            } else if (rule === 'string') {
                baseType = 'z.string()'
            } else if (rule === 'integer' || rule === 'int') {
                baseType = 'z.number().int()'
            } else if (rule === 'numeric' || rule === 'number') {
                baseType = 'z.number()'
            } else if (rule === 'email') {
                baseType = 'z.string()'
                modifiers.push('.email()')
            } else if (rule === 'url') {
                baseType = 'z.string()'
                modifiers.push('.url()')
            } else if (rule.startsWith('min:')) {
                const val = rule.substring(4)
                modifiers.push(`.min(${val})`)
            } else if (rule.startsWith('max:')) {
                const val = rule.substring(4)
                modifiers.push(`.max(${val})`)
            } else if (rule.startsWith('regex:')) {
                const pattern = rule.substring(6)
                modifiers.push(`.regex(/${pattern}/)`)
            } else if (rule === 'array') {
                baseType = 'z.array(z.unknown())'
            } else if (rule === 'json') {
                baseType = 'z.record(z.string(), z.unknown())'
            } else if (rule === 'boolean' || rule === 'bool') {
                baseType = 'z.boolean()'
            }
        }

        return baseType + modifiers.join('')
    }
}

