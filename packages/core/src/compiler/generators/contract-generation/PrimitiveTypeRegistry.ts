/**
 * PrimitiveTypeRegistry.ts
 * 
 * Small focused class: Maps SemanticType primitives to Zod schema strings.
 * Pure transformation logic with zero side effects.
 * 
 * Responsibility: Convert SemanticType primitives → Zod schema strings
 * 
 * @module compiler/generators/contract-generation
 */

import { PrimitiveType, PrimitiveKind } from '../../types/SemanticType';

/**
 * Error thrown when primitive type is not supported
 */
export class PrimitiveNotFoundError extends Error {
    constructor(
        public readonly primitiveKind: string,
        message: string = `Unsupported primitive type: ${primitiveKind}`
    ) {
        super(message);
        this.name = 'PrimitiveNotFoundError';
    }
}

/**
 * PrimitiveTypeRegistry - Pure transformation logic
 * 
 * Tiny puzzle piece (~50 lines) yang fokus pada satu hal:
 * Map SemanticType primitives ke Zod schema strings.
 * 
 * @example
 * ```typescript
 * const registry = new PrimitiveTypeRegistry();
 * const stringSchema = registry.getZodSchema(
 *   new PrimitiveType(PrimitiveKind.STRING)
 * );
 * // Result: "z.string()"
 * ```
 */
export class PrimitiveTypeRegistry {
    /**
     * Mapping table: PrimitiveKind → Zod schema string
     * 
     * Pure lookup - no logic, just data.
     */
    private readonly mappingTable: ReadonlyMap<PrimitiveKind, string> = new Map([
        [PrimitiveKind.STRING, 'z.string()'],
        [PrimitiveKind.NUMBER, 'z.number()'],
        [PrimitiveKind.BOOLEAN, 'z.boolean()'],
        [PrimitiveKind.DATETIME, 'z.string().datetime()'],
        [PrimitiveKind.UNKNOWN, 'z.unknown()']
    ]);

    /**
     * Get Zod schema for primitive type
     * 
     * Pure function - no side effects, no state mutation.
     * 
     * @param primitiveType - Primitive semantic type
     * @returns Zod schema string
     * @throws PrimitiveNotFoundError if type not supported
     */
    getZodSchema(primitiveType: PrimitiveType): string {
        const schema = this.mappingTable.get(primitiveType.type);

        if (schema === undefined) {
            throw new PrimitiveNotFoundError(primitiveType.type);
        }

        return schema;
    }

    /**
     * Check if primitive type is supported
     * 
     * @param primitiveType - Primitive semantic type
     * @returns true if supported, false otherwise
     */
    supports(primitiveType: PrimitiveType): boolean {
        return this.mappingTable.has(primitiveType.type);
    }
}
