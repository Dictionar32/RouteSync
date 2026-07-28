/**
 * layers/SchemaEmitter.ts
 *
 * Emits: schemas/api-schema.ts
 * 
 * RESPONSIBILITY: Generate Zod schemas + types + defaults untuk react-hook-form integration ONLY
 * 
 * NEW CONTRACT IR ARCHITECTURE:
 * - Consumes ContractIR.requests untuk generate form schemas
 * - Uses RequestIR actions untuk build resource-action schemas  
 * - Output: 3 exports yang saling melengkapi (ApiSchema, ApiFormValues, ApiDefaultValues)
 * 
 * IMPORTANT: Sesuai Engine.Fix.md §21 bug fix - SchemaEmitter TIDAK menghasilkan
 * form mappers (toApiXCreate, toApiXUpdate). Form mappers adalah tanggung jawab
 * MapperEmitter dan ke-generate di mappers/api-mapper.ts.
 * 
 * Outputs:
 * - ApiSchema: Zod schemas untuk useForm resolver
 * - ApiFormValues: TypeScript types dari z.infer
 * - ApiDefaultValues: Default values untuk form initialization
 * 
 * DOES NOT OUTPUT:
 * - Form mappers (toApiXCreate, toApiXUpdate) → MapperEmitter responsibility
 * - Runtime transformation functions → MapperEmitter responsibility
 */

import { ContractIR, ResourceIR, ResourceVariantIR, RequestIR, RequestActionIR, GeneratedFile, IREmitter, TypeIR, PrimitiveTypeIR, InlineObjectTypeIR } from '../../../../core/src/types/ir'

export class SchemaEmitter implements IREmitter {
    /**
     * Contract IR Architecture - Thin Emitter
     * 
     * Generate complete react-hook-form integration package:
     * 1. ApiSchema - Zod schemas untuk validation
     * 2. ApiFormValues - TypeScript types dari z.infer  
     * 3. ApiDefaultValues - Default form state
     * 
     * Format sesuai spek: resource-action keys (RegisterCreate, LoginCreate, etc.)
     */
    emit(ir: ContractIR): GeneratedFile[] {
        const files: GeneratedFile[] = []
        const lines: string[] = []

        // Import Zod
        lines.push("import { z } from 'zod'")
        lines.push('')

        // Generate ApiSchema object
        lines.push('export const ApiSchema = {')
        const schemaEntries: string[] = []
        const typeEntries: string[] = []
        const defaultEntries: string[] = []

        // Process RequestIR untuk generate schemas  
        for (const request of ir.requests) {
            for (const action of request.actions) {
                const resourceName = request.name.replace('Request', '')
                const actionName = action.name
                const schemaKey = `${resourceName}${actionName}`  // RegisterCreate, LoginCreate

                // Generate Zod schema
                const zodSchema = this.generateZodSchema(action)
                schemaEntries.push(`  ${schemaKey}: ${zodSchema},`)

                // Prepare type dan default entries
                typeEntries.push(`  ${schemaKey}: z.infer<typeof ApiSchema.${schemaKey}>`)
                defaultEntries.push(`  ${this.toCamelCase(schemaKey)}: {} as ApiFormValues['${schemaKey}'],`)
            }
        }

        // Add schema entries
        lines.push(...schemaEntries)
        lines.push('}')
        lines.push('')

        // Generate ApiFormValues types
        lines.push('export type ApiFormValues = {')
        lines.push(...typeEntries)
        lines.push('}')
        lines.push('')

        // Generate ApiDefaultValues
        lines.push('export const ApiDefaultValues = {')
        lines.push(...defaultEntries)
        lines.push('}')

        files.push({
            path: 'schemas/api-schema.ts',
            content: lines.join('\n'),
            metadata: {
                emitter: 'SchemaEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: ['zod']
            }
        })

        return files
    }

    /**
     * Generate Zod schema dari RequestActionIR fields
     * 
     * Input: RequestActionIR dengan fields untuk form validation
     * Output: Zod schema definition string
     * 
     * Example:
     * z.object({
     *   email: z.string(),
     *   password: z.string(),
     * })
     */
    private generateZodSchema(action: RequestActionIR): string {
        if (!action.fields.length) {
            return 'z.object({})'
        }

        const fieldLines = action.fields.map(field => {
            // Use TypeIR projection instead of manual nullable/optional handling
            const zodType = this.emitTypeIRToZod(field.type.schema)

            return `    ${field.transformedName}: ${zodType},`
        })

        return `z.object({
${fieldLines.join('\n')}
  })`
    }

    /**
     * Emit TypeIR to Zod schema code
     * This replaces mapSemanticTypeToZod() and manual nullable/optional logic
     */
    private emitTypeIRToZod(type: TypeIR): string {
        switch (type.kind) {
            case 'primitive':
                return this.emitPrimitiveToZod(type)

            case 'reference':
                return type.target

            case 'array':
                return `z.array(${this.emitTypeIRToZod(type.items)})`

            case 'inline_object':
                return this.emitInlineObjectToZod(type)

            case 'nullable':
                return `${this.emitTypeIRToZod(type.inner)}.nullable()`

            case 'optional':
                return `${this.emitTypeIRToZod(type.inner)}.optional()`

            case 'union':
                const unionSchemas = type.types.map((t: TypeIR) => this.emitTypeIRToZod(t))
                return `z.union([${unionSchemas.join(', ')}])`

            case 'literal':
                return `z.literal(${JSON.stringify(type.value)})`

            default:
                return 'z.unknown()'
        }
    }

    private emitPrimitiveToZod(type: PrimitiveTypeIR): string {
        switch (type.type) {
            case 'string': return 'z.string()'
            case 'number': return 'z.number()'
            case 'boolean': return 'z.boolean()'
            case 'date': return 'z.string()'  // ISO date strings
            case 'json': return 'z.unknown()'
            default: return 'z.unknown()'
        }
    }

    private emitInlineObjectToZod(type: InlineObjectTypeIR): string {
        if (Object.keys(type.properties).length === 0) {
            return 'z.object({})'
        }

        const properties = Object.entries(type.properties).map(([key, valueType]) => {
            const valueSchema = this.emitTypeIRToZod(valueType)
            return `    ${key}: ${valueSchema},`
        })

        return `z.object({
${properties.join('\n')}
  })`
    }

    /**
     * Convert PascalCase ke camelCase untuk default values
     * RegisterCreate -> registerCreate
     */
    private toCamelCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1)
    }

    /**
     * Map SemanticType ke Zod schema string
     */
    private mapSemanticTypeToZod(semanticType: any): string {
        switch (semanticType.kind) {
            case 'primitive':
                return this.mapPrimitiveTypeToZod(semanticType.type)

            case 'model':
                return `${semanticType.model}Schema`

            case 'resource':
                const baseSchema = `${semanticType.resource}Schema`
                return semanticType.collection ? `z.array(${baseSchema})` : baseSchema

            case 'object':
                return 'z.record(z.unknown())'

            case 'array':
                const itemSchema = this.mapSemanticTypeToZod(semanticType.items)
                return `z.array(${itemSchema})`

            default:
                return 'z.unknown()'
        }
    }

    /**
     * Map primitive types ke Zod schemas with proper validation
     */
    private mapPrimitiveTypeToZod(primitiveType: string): string {
        switch (primitiveType) {
            case 'string':
                return 'z.string()'
            case 'number':
                return 'z.number()'
            case 'boolean':
                return 'z.boolean()'
            case 'date':
                return 'z.string().datetime()' // ISO date strings
            case 'json':
                return 'z.unknown()' // Could be z.record() or z.array() depending on context
            default:
                return 'z.unknown()'
        }
    }
}