/**
 * layers/MapperEmitter.ts
 *
 * Emits: mappers/api-mapper.ts
 * 
 * RESPONSIBILITY: Generate transform functions between API (snake_case) and Frontend (camelCase)
 * 
 * NEW CONTRACT IR ARCHITECTURE:
 * - Consumes ContractIR.resources untuk read mappers (API → Frontend)
 * - Consumes ContractIR.requests untuk form mappers (Frontend → API)
 * - All transformations sudah computed di IR
 * 
 * Sesuai Engine.Fix.md §18 dan §21:
 * - Read mappers: toCategoryRead, toCategoryReadList (response → frontend)
 * - Form mappers: toApiRegisterCreate, toApiCartItemsUpdate (form → payload)
 * - Uses ApiApiField untuk consistent snake_case keys
 * 
 * Outputs:
 * - Read mappers: API response → Frontend model (snake_case → camelCase)
 * - List mappers: Array transformations via .map()
 * - Form mappers: Frontend form → API payload (camelCase → snake_case via ApiApiField)
 */

import { ContractIR, ResourceIR, RequestIR, RequestActionIR, GeneratedFile, IREmitter } from '../../../../core/src/types/ir'
import { isNullableType, isOptionalType } from '../../../../core/src/utils/type-guards'

export class MapperEmitter implements IREmitter {

    /**
     * Contract IR Architecture - Thin Emitter
     * 
     * Generates both read and form mappers:
     * 1. Read mappers (§18): API response → Frontend (snake_case → camelCase)
     * 2. Form mappers (§21): Frontend form → API payload (camelCase → snake_case)
     * 
     * NO MORE:
     * - Field-by-field computation (sudah di IR)
     * - Duplicate name transformations
     * - Mixed responsibilities dengan schema generation
     */
    emit(ir: ContractIR): GeneratedFile[] {
        const files: GeneratedFile[] = []
        const lines: string[] = []

        // Header dan imports
        lines.push('/**')
        lines.push(' * Runtime mapper functions untuk transformasi data')
        lines.push(' * Generated dari Contract IR - domain-centric architecture')
        lines.push(' */')
        lines.push('')
        lines.push('// Import types untuk type safety')
        lines.push("import { ApiApiField } from '../fields/api-field'")
        lines.push('')

        // Generate read mappers dari ResourceIR (§18)
        lines.push('// ==== READ MAPPERS (API Response → Frontend Model) ====')
        lines.push('// Transforms snake_case API responses to camelCase frontend models')
        lines.push('')

        for (const resource of ir.resources) {
            lines.push(this.generateReadMapper(resource))
            lines.push('')
            lines.push(this.generateReadListMapper(resource))
            lines.push('')
        }

        // Generate form mappers dari RequestIR (§21)
        lines.push('// ==== FORM MAPPERS (Frontend Form → API Payload) ====')
        lines.push('// Transforms camelCase form data to snake_case API payloads using ApiApiField')
        lines.push('')

        for (const request of ir.requests) {
            for (const action of request.actions) {
                lines.push(this.generateFormMapper(request, action))
                lines.push('')
            }
        }

        files.push({
            path: 'mappers/api-mapper.ts',
            content: lines.join('\n'),
            metadata: {
                emitter: 'MapperEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: ['api-field']
            }
        })

        return files
    }

    /**
     * Generate read mapper sesuai format Engine.Fix.md §18
     * 
     * Format: toCategoryRead, toOrderRead, etc.
     * Input: API response (snake_case)
     * Output: Frontend model (camelCase)
     * 
     * Example:
     * export const toCategoryRead = (api: CategoryApiResponse): CategoryTransformed => ({
     *   id: api.id,
     *   nama: api.nama,
     *   createdAt: api.created_at,
     *   updatedAt: api.updated_at,
     * })
     */
    private generateReadMapper(resource: ResourceIR): string {
        if (!resource.fields.length) {
            const resourceName = resource.name.replace('Resource', '')
            return `export const to${resourceName}Read = (api: ${resource.name}Response): ${resource.name}Transformed => api as ${resource.name}Transformed`
        }

        const mappings = resource.fields.map(field => {
            // Simplified mapping - handle semantic type safely
            // TODO: Implement proper nested resource handling when SemanticType is clarified

            // Check if field type supports nullable/optional through type projections
            const mapperType = field.type.mapper

            // Safe type checking untuk nested optional-nullable dengan type assertion yang aman
            const isOptionalWithNullableInner = mapperType?.kind === 'optional' &&
                isOptionalType(mapperType) &&
                mapperType.inner && isNullableType(mapperType.inner)

            const isNullable = mapperType?.kind === 'nullable' || isOptionalWithNullableInner
            const isOptional = mapperType?.kind === 'optional' || isNullable

            // Handle optional chaining untuk nullable/optional fields
            if (isNullable || isOptional) {
                return `    ${field.transformedName}: api.${field.name},`
            }

            // Simple field mapping (most common case)
            return `    ${field.transformedName}: api.${field.name},`
        })

        const resourceName = resource.name.replace('Resource', '')
        return `export const to${resourceName}Read = (api: ${resource.name}Response): ${resource.name}Transformed => ({
${mappings.join('\n')}
  })`
    }

    /**
     * Generate read list mapper sesuai format Engine.Fix.md §18
     * 
     * Format: toCategoryReadList, toOrderReadList, etc.
     * Always uses .map(toXRead) - no duplicate logic
     * 
     * Example:
     * export const toCategoryReadList = (api: CategoryApiResponse[]): CategoryTransformed[] => 
     *   api.map(toCategoryRead)
     */
    private generateReadListMapper(resource: ResourceIR): string {
        const resourceName = resource.name.replace('Resource', '')
        return `export const to${resourceName}ReadList = (api: ${resource.name}Response[]): ${resource.name}Transformed[] =>
  api.map(to${resourceName}Read)`
    }

    /**
     * Generate form mapper sesuai format Engine.Fix.md §21
     * 
     * Format: toApiRegisterCreate, toApiCartItemsUpdate, etc.
     * Input: Frontend form (camelCase)
     * Output: API payload (snake_case via ApiApiField)
     * 
     * Example:
     * export const toApiRegisterCreate = (form: RegisterForm['Create']): RegisterCreatePayload => ({
     *   [ApiApiField.NAME]: form.name,
     *   [ApiApiField.EMAIL]: form.email,
     *   [ApiApiField.PASSWORD]: form.password,
     * })
     */
    private generateFormMapper(request: RequestIR, action: RequestActionIR): string {
        const requestName = request.name.replace('Request', '')
        const actionName = action.name

        if (!action.fields.length) {
            return `export const toApi${requestName}${actionName} = (form: ${requestName}Form['${actionName.toLowerCase()}']): ${requestName}${actionName}Payload => ({})`
        }

        const mappings = action.fields.map(field => {
            // Simplified form mapping - use ApiApiField for consistent snake_case keys
            // TODO: Handle nested arrays when SemanticType is clarified

            // Simple field mapping using ApiApiField
            return `    [ApiApiField.${this.toConstantCase(field.name)}]: form.${field.transformedName},`
        })

        return `export const toApi${requestName}${actionName} = (form: ${requestName}Form['${actionName.toLowerCase()}']): ${requestName}${actionName}Payload => ({
${mappings.join('\n')}
  })`
    }

    /**
     * Convert field name ke CONSTANT_CASE untuk ApiApiField keys
     * Example: shippingNama → SHIPPINGNAMA, productId → PRODUCTID
     */
    private toConstantCase(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
    }
}