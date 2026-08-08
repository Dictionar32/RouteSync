/**
 * ResponseStructureBuilder - Build complete response structure tree
 * 
 * Part of Response Contract Generation (Step 2)
 * 
 * Responsibilities:
 * - Build complete structure from all response fields
 * - Analyze structure characteristics (nested, arrays, depth)
 * - Delegate field parsing to ResponseFieldParser
 * 
 * SOC: Structure building only, no Zod generation
 * SOT: Uses ResponseFieldParser for individual field parsing
 */

import type { ResponseFieldData } from './ResponseFieldParser'
import { ResponseFieldParser, type ParsedResponseField } from './ResponseFieldParser'

/**
 * Complete response structure with analysis
 */
export interface ResponseStructure {
    /** All top-level fields parsed */
    fields: ParsedResponseField[]

    /** Whether structure contains nested objects */
    hasNested: boolean

    /** Whether structure contains arrays */
    hasArrays: boolean

    /** Maximum nesting depth (1 = flat, 2+ = nested) */
    maxDepth: number
}

/**
 * Builder for complete response structures
 */
export class ResponseStructureBuilder {
    constructor(
        private fieldParser: ResponseFieldParser
    ) { }

    /**
     * Build complete structure from response fields
     * 
     * @param responseFields All response fields from manifest
     * @returns Complete response structure with analysis
     */
    buildStructure(
        responseFields: Record<string, ResponseFieldData>
    ): ResponseStructure {
        // Parse all fields
        const parsedFields: ParsedResponseField[] = []

        for (const [fieldName, fieldData] of Object.entries(responseFields)) {
            const parsed = this.fieldParser.parseField(fieldName, fieldData)
            parsedFields.push(parsed)
        }

        // Analyze structure characteristics
        const hasNested = this.detectNested(parsedFields)
        const hasArrays = this.detectArrays(parsedFields)
        const maxDepth = this.calculateMaxDepth(parsedFields)

        return {
            fields: parsedFields,
            hasNested,
            hasArrays,
            maxDepth
        }
    }

    /**
     * Detect if structure contains nested objects
     */
    private detectNested(fields: ParsedResponseField[]): boolean {
        for (const field of fields) {
            if (field.kind === 'object') {
                return true
            }

            // Check arrays of objects
            if (field.kind === 'array' && field.itemType?.kind === 'object') {
                return true
            }
        }

        return false
    }

    /**
     * Detect if structure contains arrays
     */
    private detectArrays(fields: ParsedResponseField[]): boolean {
        for (const field of fields) {
            if (field.kind === 'array') {
                return true
            }

            // Check nested objects for arrays
            if (field.kind === 'object' && field.fields) {
                if (this.detectArrays(field.fields)) {
                    return true
                }
            }
        }

        return false
    }

    /**
     * Calculate maximum nesting depth
     * 
     * @param fields Fields to analyze
     * @param currentDepth Current depth (for recursion)
     * @returns Maximum depth found
     */
    private calculateMaxDepth(
        fields: ParsedResponseField[],
        currentDepth: number = 1
    ): number {
        let maxDepth = currentDepth

        for (const field of fields) {
            // Objects increase depth
            if (field.kind === 'object' && field.fields) {
                const objectDepth = this.calculateMaxDepth(field.fields, currentDepth + 1)
                maxDepth = Math.max(maxDepth, objectDepth)
            }

            // Arrays of objects also increase depth
            if (field.kind === 'array' && field.itemType?.kind === 'object' && field.itemType.fields) {
                const arrayDepth = this.calculateMaxDepth(field.itemType.fields, currentDepth + 1)
                maxDepth = Math.max(maxDepth, arrayDepth)
            }
        }

        return maxDepth
    }
}
