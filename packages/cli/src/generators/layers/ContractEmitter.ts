/**
 * layers/ContractEmitter.ts
 *
 * Emits: contract/api-contract.ts
 * 
 * RESPONSIBILITY: Generate Zod schemas untuk API contracts (response + payload)
 * 
 * Sesuai Engine.Fix.md §16: api-contract.ts berisi KEDUA arah:
 * - Response schemas (output backend) - PaymentResourceSchema, CategoriesResponseSchema
 * - Payload schemas (input ke backend) - RegisterCreatePayload, etc
 * - Type inference dan validator functions
 * 
 * ENRICHED TYPE IR SYSTEM:
 * - NO MORE semantic compiler knowledge!
 * - Consumes TypeProjections.contract for all type information
 * - Pure renderer: TypeIR → Zod code
 * - Recursive type emission without switches
 * 
 * Outputs:
 * - Zod response schemas (snake_case fields)
 * - Zod payload schemas (snake_case fields) 
 * - Type inference (z.infer)
 * - Validator functions
 */

import {
    ContractIR,
    ResourceIR,
    RequestIR,
    RequestActionIR,
    GeneratedFile,
    IREmitter,
    TypeIR,
    PrimitiveTypeIR,
    ReferenceTypeIR,
    ArrayTypeIR,
    InlineObjectTypeIR,
    NullableTypeIR,
    OptionalTypeIR,
    UnionTypeIR,
    LiteralTypeIR
} from '../../../../core/src/types/ir'
import { hasKind, safeStringCast } from '../../../../core/src/utils/type-guards'

export class ContractEmitter implements IREmitter {
    /**
     * Contract IR Architecture - Ultra Thin Emitter
     * 
     * Generates Zod schemas sesuai Engine.Fix.md §16:
     * 1. Response schemas - PaymentResourceSchema, CategoriesResponseSchema
     * 2. Payload schemas - RegisterCreatePayload, CartItemsUpdatePayload
     * 3. Type inference dan validators
     * 
     * ELIMINATED:
     * - mapSemanticTypeToZod() method
     * - switch (semanticType.kind) statements
     * - nullable/optional field logic
     * - All semantic compiler knowledge
     * 
     * NOW: Pure recursive TypeIR emission
     */
    emit(ir: ContractIR): GeneratedFile[] {
        const files: GeneratedFile[] = []
        const lines: string[] = []

        // Header dan imports
        lines.push('/**')
        lines.push(' * API Contract Zod schemas untuk validation')
        lines.push(' * Generated dari TypeIR - pure type renderer')
        lines.push(' * ')
        lines.push(' * Berisi KEDUA arah sesuai Engine.Fix.md §16:')
        lines.push(' * - Response schemas (output backend)')
        lines.push(' * - Payload schemas (input ke backend)')
        lines.push(' */')
        lines.push('')
        lines.push("import { z } from 'zod'")
        lines.push('')

        // Generate response schemas dari ResourceIR (Engine.Fix.md §16)
        lines.push('// ==== RESPONSE SCHEMAS (Backend Output) ====')
        lines.push('// Validates data coming FROM backend')
        lines.push('')

        for (const resource of ir.resources) {
            lines.push(this.generateResourceSchema(resource))
            lines.push('')
            lines.push(this.generateResourceTypeInference(resource))
            lines.push('')
            lines.push(this.generateResourceValidator(resource))
            lines.push('')
        }

        // Generate collection schemas
        lines.push('// ==== COLLECTION RESPONSE SCHEMAS ====')
        for (const resource of ir.resources) {
            lines.push(this.generateCollectionSchema(resource))
            lines.push('')
        }

        // Generate payload schemas dari RequestIR (Engine.Fix.md §16)
        lines.push('// ==== PAYLOAD SCHEMAS (Backend Input) ====')
        lines.push('// Validates data going TO backend')
        lines.push('')

        for (const request of ir.requests) {
            for (const action of request.actions) {
                lines.push(this.generatePayloadSchema(request, action))
                lines.push('')
                lines.push(this.generatePayloadTypeInference(request, action))
                lines.push('')
            }
        }

        files.push({
            path: 'contract/api-contract.ts',
            content: lines.join('\n'),
            metadata: {
                emitter: 'ContractEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: ['zod']
            }
        })

        return files
    }

    /**
     * Generate resource schema sesuai Engine.Fix.md §16
     * 
     * SIMPLIFIED: Uses TypeIR.contract projection only
     * NO MORE: semantic type switching
     */
    private generateResourceSchema(resource: ResourceIR): string {
        if (!resource.fields.length) {
            return `export const ${resource.name}Schema = z.object({})`
        }

        const fields = resource.fields.map(field => {
            // Pure TypeIR emission - no semantic knowledge needed
            const zodType = this.emitTypeIR(field.type.contract)

            // Use original snake_case name (sesuai Laravel backend)
            return `  ${field.name}: ${zodType},`
        })

        return `export const ${resource.name}Schema = z.object({
${fields.join('\n')}
})`
    }

    /**
     * Nama tipe response tanpa suffix dobel.
     * Resource yang sudah berakhiran 'Response' (mis. RegisterResponse) tidak
     * boleh jadi 'RegisterResponseResponse' — konsisten dengan engine lama.
     */
    private responseTypeName(name: string): string {
        return name.endsWith('Response') ? name : `${name}Response`
    }

    /**
     * Generate type inference dari resource schema
     */
    private generateResourceTypeInference(resource: ResourceIR): string {
        return `export type ${this.responseTypeName(resource.name)} = z.infer<typeof ${resource.name}Schema>`
    }

    /**
     * Generate SHARED validator function untuk resource (⭐ KEY FIX)
     * Digunakan untuk semua CUD operations yang return single resource
     */
    private generateResourceValidator(resource: ResourceIR): string {
        const typeName = this.responseTypeName(resource.name)
        const functionName = `validate${typeName}`
        return `export const ${functionName} = (payload: unknown): ${typeName} =>
  ${resource.name}Schema.parse(payload)`
    }

    /**
     * Generate collection schema sesuai Engine.Fix.md §16
     * Untuk index operations yang return array of resources
     */
    private generateCollectionSchema(resource: ResourceIR): string {
        const resourceName = resource.name.replace('Resource', '')
        const collectionName = `${resourceName}sResponseSchema`
        return `export const ${collectionName} = z.object({
  data: z.array(${resource.name}Schema)
})

export const validate${resource.name}CollectionResponse = (payload: unknown) =>
  ${collectionName}.parse(payload)`
    }

    /**
     * Generate payload schema dari RequestActionIR sesuai Engine.Fix.md §16
     * 
     * SIMPLIFIED: Uses TypeIR.contract projection only
     */
    private generatePayloadSchema(request: RequestIR, action: RequestActionIR): string {
        const requestName = request.name.replace('Request', '')
        const schemaName = `${requestName}${action.name}Payload`

        if (!action.fields.length) {
            return `export const ${schemaName} = z.object({})`
        }

        const fields = action.fields.map(field => {
            // Pure TypeIR emission - no semantic knowledge needed
            const zodType = this.emitTypeIR(field.type.contract)

            // Use original snake_case name (untuk Laravel backend)
            return `  ${field.name}: ${zodType},`
        })

        return `export const ${schemaName} = z.object({
${fields.join('\n')}
})`
    }

    /**
     * Generate type inference dari payload schema
     */
    private generatePayloadTypeInference(request: RequestIR, action: RequestActionIR): string {
        const requestName = request.name.replace('Request', '')
        const schemaName = `${requestName}${action.name}Payload`
        return `export type ${schemaName}Type = z.infer<typeof ${schemaName}>`
    }

    /* =========================================================
     *  PURE TYPE IR EMISSION - NO SEMANTIC KNOWLEDGE
     * ========================================================= */

    /**
     * Core TypeIR emitter - recursive, compositional, semantic-free
     * 
     * This replaces mapSemanticTypeToZod() entirely.
     * No switches on semantic kinds, no field modifiers, no Laravel knowledge.
     * Pure structural recursion over TypeIR.
     * 
     * Example:
     * ArrayType { items: NullableType { inner: ReferenceType { target: 'OrderResourceSchema' } } }
     * →  z.array(OrderResourceSchema.nullable())
     */
    private emitTypeIR(type: TypeIR): string {
        switch (type.kind) {
            case 'primitive':
                return this.emitPrimitive(type)

            case 'reference':
                return this.emitReference(type)

            case 'array':
                return this.emitArray(type)

            case 'inline_object':
                return this.emitInlineObject(type)

            case 'nullable':
                return this.emitNullable(type)

            case 'optional':
                return this.emitOptional(type)

            case 'union':
                return this.emitUnion(type)

            case 'literal':
                return this.emitLiteral(type)

            default:
                // Exhaustiveness check - this should never happen if all TypeIR kinds are handled
                const exhaustiveCheck: never = type
                console.warn(`⚠️  Unhandled TypeIR kind:`, exhaustiveCheck)
                return 'z.unknown()'
        }
    }

    /**
     * Emit primitive type - direct Zod mapping
     */
    private emitPrimitive(type: PrimitiveTypeIR): string {
        switch (type.type) {
            case 'string':
                return 'z.string()'
            case 'number':
                return 'z.number()'
            case 'boolean':
                return 'z.boolean()'
            case 'date':
                return 'z.string()' // ISO date strings
            case 'json':
                return 'z.unknown()'
            default:
                return 'z.unknown()'
        }
    }

    /**
     * Emit reference type - direct schema reference
     */
    private emitReference(type: ReferenceTypeIR): string {
        return type.target
    }

    /**
     * Emit array type - recursive items emission
     */
    private emitArray(type: ArrayTypeIR): string {
        const itemsSchema = this.emitTypeIR(type.items)
        return `z.array(${itemsSchema})`
    }

    /**
     * Emit inline object type - recursive properties emission
     * 
     * REPLACES: z.record(z.unknown())
     * WITH: z.object({ name: z.string(), token: z.string() })
     */
    private emitInlineObject(type: InlineObjectTypeIR): string {
        if (Object.keys(type.properties).length === 0) {
            return type.additionalProperties ? 'z.record(z.unknown())' : 'z.object({})'
        }

        const properties = Object.entries(type.properties).map(([key, valueType]) => {
            const valueSchema = this.emitTypeIR(valueType)
            return `  ${key}: ${valueSchema},`
        })

        const objectSchema = `z.object({
${properties.join('\n')}
})`

        return type.additionalProperties ? `${objectSchema}.passthrough()` : objectSchema
    }

    /**
     * Emit nullable type - compositional nullability
     */
    private emitNullable(type: NullableTypeIR): string {
        const innerSchema = this.emitTypeIR(type.inner)
        return `${innerSchema}.nullable()`
    }

    /**
     * Emit optional type - compositional optionality
     */
    private emitOptional(type: OptionalTypeIR): string {
        const innerSchema = this.emitTypeIR(type.inner)
        return `${innerSchema}.optional()`
    }

    /**
     * Emit union type - multiple type alternatives
     */
    private emitUnion(type: UnionTypeIR): string {
        const typeSchemas = type.types.map(t => this.emitTypeIR(t))
        return `z.union([${typeSchemas.join(', ')}])`
    }

    /**
     * Emit literal type - exact value matching
     */
    private emitLiteral(type: LiteralTypeIR): string {
        return `z.literal(${JSON.stringify(type.value)})`
    }
}