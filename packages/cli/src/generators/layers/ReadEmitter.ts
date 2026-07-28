/**
 * layers/ReadEmitter.ts
 *
 * Emits: types/api-read.ts
 * 
 * RESPONSIBILITY: Generate TypeScript interfaces untuk read responses (camelCase, frontend-friendly)
 * 
 * NEW CONTRACT IR ARCHITECTURE:
 * - Consumes ContractIR.resources untuk generate interfaces
 * - All transformations (snake_case → camelCase) sudah done di IR
 * - Emitter hanya projection function yang thin
 * 
 * Outputs:
 * - ${Resource}Transformed interfaces (dari ResourceIR.variants.read)
 * - ${Resource}Show, ${Resource}Index aliases (dari ResourceIR.aliases)
 */

import path from 'path'
import fs from 'fs-extra'
import { ContractIR, ResourceIR, ResourceVariantIR, ResourceAliasIR, GeneratedFile, IREmitter, TypeIR, PrimitiveTypeIR, InlineObjectTypeIR } from '../../../../core/src/types/ir'
import { SemanticType } from '../../../../core/src/types/semantic'

export class ReadEmitter implements IREmitter {
    /**
     * Contract IR Architecture - Thin Emitter
     * 
     * Input: Complete ContractIR dengan all transformations done
     * Output: TypeScript interface files
     * 
     * NO MORE:
     * - Name transformations (sudah di IR)
     * - Type inference (sudah di IR) 
     * - Field mapping (sudah di IR)
     */
    emit(ir: ContractIR): GeneratedFile[] {
        const files: GeneratedFile[] = []
        const lines: string[] = []

        // Generate TypeScript interfaces from ResourceIR
        for (const resource of ir.resources) {
            const readVariant = resource.variants.find(v => v.kind === 'read')
            if (!readVariant) continue

            // Generate main transformed interface
            lines.push(this.generateResourceInterface(resource, readVariant))
            lines.push('')

            // Generate aliases (Show, Index, Collection)
            for (const alias of resource.aliases) {
                lines.push(this.generateResourceAlias(alias))
            }
            lines.push('')
        }

        files.push({
            path: 'types/api-read.ts',
            content: lines.join('\n'),
            metadata: {
                emitter: 'ReadEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: []
            }
        })

        return files
    }

    /**
     * Generate TypeScript interface dari ResourceIR read variant
     * 
     * Input: ResourceIR dengan semua transformations sudah done
     * Output: Clean TypeScript interface
     * 
     * SUDAH TIDAK ADA:
     * - snake_case → camelCase (sudah di IR)
     * - Type inference (sudah di IR)
     * - Null handling (sudah di IR)
     */
    private generateResourceInterface(resource: ResourceIR, variant: ResourceVariantIR): string {
        if (!variant.fields.length) {
            return `export interface ${resource.name}Transformed {}`
        }

        const fields = variant.fields.map(field => {
            // Use TypeIR projection instead of manual nullable/optional handling
            const tsType = this.emitTypeIRToTypeScript(field.type.read)

            return `  readonly ${field.transformedName}: ${tsType}`
        })

        return `export interface ${resource.name}Transformed {
${fields.join('\n')}
}`
    }

    /**
     * Emit TypeIR to TypeScript interface types  
     * This replaces mapSemanticTypeToTs() and manual nullable/optional logic
     * 
     * FIXED: Better type resolution, avoid defaulting to 'unknown'
     */
    private emitTypeIRToTypeScript(type: TypeIR): string {
        switch (type.kind) {
            case 'primitive':
                return this.emitPrimitiveToTypeScript(type)

            case 'reference':
                return type.target.replace('Schema', 'Transformed')

            case 'array':
                return `${this.emitTypeIRToTypeScript(type.items)}[]`

            case 'inline_object':
                return this.emitInlineObjectToTypeScript(type)

            case 'nullable':
                return `${this.emitTypeIRToTypeScript(type.inner)} | null`

            case 'optional':
                return `${this.emitTypeIRToTypeScript(type.inner)} | undefined`

            case 'union':
                const unionTypes = type.types.map((t: TypeIR) => this.emitTypeIRToTypeScript(t))
                return unionTypes.join(' | ')

            case 'literal':
                return JSON.stringify(type.value)

            default:
                console.warn(`ReadEmitter: Unknown type kind '${(type as any).kind}', falling back to 'unknown'`)
                return 'unknown'
        }
    }

    private emitPrimitiveToTypeScript(type: PrimitiveTypeIR): string {
        switch (type.type) {
            case 'string': return 'string'
            case 'number': return 'number'
            case 'boolean': return 'boolean'
            case 'date': return 'string'  // ISO date strings
            case 'json': return 'unknown'
            default: return 'unknown'
        }
    }

    private emitInlineObjectToTypeScript(type: InlineObjectTypeIR): string {
        const properties = Object.entries(type.properties).map(([key, valueType]) => {
            const valueTypeStr = this.emitTypeIRToTypeScript(valueType)
            return `  ${key}: ${valueTypeStr};`
        })

        return `{\n${properties.join('\n')}\n}`
    }

    /**
     * Generate type alias dari ResourceAliasIR
     * 
     * FIXED: Only generate standard Show/Index aliases, skip redundant ones
     * 
     * Input: ResourceAliasIR dengan metadata sudah resolved
     * Output: Type alias definition for Show/Index only
     * 
     * Examples:
     * - export type OrderShow = OrderTransformed
     * - export type OrderIndex = OrderTransformed[]
     */
    private generateResourceAlias(alias: ResourceAliasIR): string {
        // FILTER: Only generate Show and Index aliases
        // Skip: Collection, Paginated, dan aliases lain yang redundant
        if (!alias.name.endsWith('Show') && !alias.name.endsWith('Index')) {
            return '' // Skip redundant aliases
        }

        const target = alias.isArray ? `${alias.target}[]` : alias.target
        return `export type ${alias.name} = ${target}`
    }
}

