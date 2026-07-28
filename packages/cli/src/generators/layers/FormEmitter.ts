/**
 * layers/FormEmitter.ts
 *
 * Emits: forms/api-form.ts
 * 
 * RESPONSIBILITY: Generate form type definitions untuk input validation
 * 
 * NEW CONTRACT IR ARCHITECTURE:
 * - Consumes ContractIR.requests untuk generate form types
 * - All transformations sudah computed di RequestIR
 * - Emitter hanya projection function yang thin
 * 
 * NOTE: Sesuai Engine.Fix.md §20, api-form.ts dan api-schema.ts memiliki struktur
 * yang sangat mirip dan berpotensi duplikasi. Namun tetap dipertahankan karena:
 * 1. api-schema.ts: Zod schemas + types + defaults untuk react-hook-form integration 
 * 2. api-form.ts: Pure TypeScript type definitions dengan struktur per-action
 * 
 * Outputs:
 * - ${Request}Form types dengan per-action field definitions
 * - Form validation metadata
 */

import { ContractIR, RequestIR, RequestActionIR, ResourceIR, GeneratedFile, IREmitter, TypeIR, PrimitiveTypeIR, InlineObjectTypeIR } from '../../../../core/src/types/ir'
import { SemanticType } from '../../../../core/src/types/semantic'

export class FormEmitter implements IREmitter {
    /**
     * Contract IR Architecture - Thin Emitter
     * 
     * Input: ContractIR dengan RequestIR sudah resolved
     * Output: Form type definition files
     * 
     * NO MORE:
     * - Field extraction dari routes (sudah di RequestIR)
     * - Name transformations (sudah di RequestIR)  
     * - Validation rule parsing (sudah di RequestIR)
     */
    emit(ir: ContractIR): GeneratedFile[] {
        const files: GeneratedFile[] = []
        const lines: string[] = []

        // Header
        lines.push('/**')
        lines.push(' * Form type definitions untuk input validation')
        lines.push(' * Generated dari RequestIR - Contract IR Architecture')
        lines.push(' * ')
        lines.push(' * Note: Struktur mirip dengan api-schema.ts tapi untuk pure TypeScript types')
        lines.push(' */')
        lines.push('')

        // Generate form types dari RequestIR
        for (const request of ir.requests) {
            lines.push(this.generateRequestFormType(request))
            lines.push('')
        }

        files.push({
            path: 'forms/api-form.ts',
            content: lines.join('\n'),
            metadata: {
                emitter: 'FormEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: []
            }
        })

        return files
    }

    /**
     * Generate form type dari RequestIR
     * 
     * Input: RequestIR dengan actions sudah resolved
     * Output: Form type definition
     * 
     * Example:
     * export type CartItemsForm = {
     *   create: {
     *     productId: number
     *     quantity: number
     *   }
     *   update: {
     *     quantity?: number
     *   }
     * }
     */
    private generateRequestFormType(request: RequestIR): string {
        if (!request.actions.length) {
            return `export type ${this.getFormTypeName(request)} = {}`
        }

        const actions: string[] = []

        for (const action of request.actions) {
            const actionName = action.name.toLowerCase()
            const fields = this.generateActionFields(action)

            actions.push(`  ${actionName}: {
${fields}
  }`)
        }

        return `export type ${this.getFormTypeName(request)} = {
${actions.join('\n')}
}`
    }

    /**
     * Generate fields untuk specific action
     */
    private generateActionFields(action: RequestActionIR): string {
        if (!action.fields.length) {
            return '    // No fields'
        }

        return action.fields.map(field => {
            // Use TypeIR projection instead of manual nullable/optional handling
            const tsType = this.emitTypeIRToTypeScript(field.type.form)

            return `    ${field.transformedName}: ${tsType}`
        }).join('\n')
    }

    /**
     * Emit TypeIR to TypeScript form types
     * This replaces mapSemanticTypeToTs() and manual nullable/optional logic
     */
    private emitTypeIRToTypeScript(type: TypeIR): string {
        switch (type.kind) {
            case 'primitive':
                return this.emitPrimitiveToTypeScript(type)

            case 'reference':
                return type.target.replace('Schema', 'Form')

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
     * Get form type name dari RequestIR name
     */
    private getFormTypeName(request: RequestIR): string {
        return request.name.replace('Request', 'Form')
    }
}