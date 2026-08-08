/**
 * ContractSchemaMapper.ts
 * 
 * Maps SemanticType to complete Zod schema strings.
 * Delegates to PrimitiveTypeRegistry and ZodModifierBuilder.
 * 
 * Responsibility: Transform type system to Zod schemas
 * 
 * @module compiler/generators/contract-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import {
    PrimitiveType,
    ObjectType,
    ReadonlyCollectionType,
    UnionType,
    ReferenceType
} from '../../types/SemanticType';
import { PrimitiveTypeRegistry } from './PrimitiveTypeRegistry';
import { ZodModifierBuilder, type ModifierConfig } from './ZodModifierBuilder';

/**
 * Field configuration for schema mapping
 */
export interface FieldConfig {
    readonly fieldName: string;
    readonly required: boolean;
    readonly nullable: boolean;
}

/**
 * Mapped schema result
 */
export interface MappedSchema {
    readonly zodSchema: string;
    readonly needsImport: boolean;
    readonly referencedTypes: readonly string[];
}

/**
 * ContractSchemaMapper - Transform SemanticType to Zod schemas
 * 
 * Delegates to:
 * - PrimitiveTypeRegistry for primitive types
 * - ZodModifierBuilder for modifiers
 * 
 * Handles:
 * - Primitive types (string, number, boolean, etc.)
 * - Object types with nested fields
 * - Array/collection types
 * - Union types
 * - Reference types
 * 
 * @example
 * ```typescript
 * const mapper = new ContractSchemaMapper(
 *   new PrimitiveTypeRegistry(),
 *   new ZodModifierBuilder()
 * );
 * 
 * const result = mapper.mapToZodSchema(
 *   new PrimitiveType(PrimitiveKind.STRING),
 *   { fieldName: 'nama', required: true, nullable: false }
 * );
 * // result.zodSchema = "z.string()"
 * ```
 */
export class ContractSchemaMapper {
    constructor(
        private readonly primitiveRegistry: PrimitiveTypeRegistry = new PrimitiveTypeRegistry(),
        private readonly modifierBuilder: ZodModifierBuilder = new ZodModifierBuilder()
    ) { }

    /**
     * Map SemanticType to complete Zod schema string
     * 
     * @param type - Semantic type to map
     * @param config - Field configuration
     * @returns Mapped schema with metadata
     */
    mapToZodSchema(type: SemanticType, config: FieldConfig): MappedSchema {
        // Get base schema without modifiers
        const baseSchema = this.mapBaseType(type);

        // Add modifiers if needed
        const modifiers = this.modifierBuilder.buildModifiers({
            required: config.required,
            nullable: config.nullable
        });

        return {
            zodSchema: baseSchema + modifiers,
            needsImport: this.needsImport(type),
            referencedTypes: this.getReferencedTypes(type)
        };
    }

    /**
     * Map base type (without modifiers)
     */
    private mapBaseType(type: SemanticType): string {
        if (type instanceof PrimitiveType) {
            return this.primitiveRegistry.getZodSchema(type);
        }

        if (type instanceof ObjectType) {
            return this.mapObjectType(type);
        }

        if (type instanceof ReadonlyCollectionType) {
            return this.mapCollectionType(type);
        }

        if (type instanceof UnionType) {
            return this.mapUnionType(type);
        }

        if (type instanceof ReferenceType) {
            return this.mapReferenceType(type);
        }

        // Default fallback for unsupported types
        return 'z.unknown()';
    }

    /**
     * Map object type with nested fields
     */
    private mapObjectType(type: ObjectType): string {
        const fields: string[] = [];

        // ImmutableMap requires .entries() for iteration
        for (const [fieldName, fieldType] of type.properties.entries()) {
            const isRequired = type.requiredProperties.has(fieldName);
            const isNullable = false; // Objects don't have nullable flag by default

            const fieldSchema = this.mapToZodSchema(fieldType, {
                fieldName,
                required: isRequired,
                nullable: isNullable
            });

            fields.push(`${fieldName}: ${fieldSchema.zodSchema}`);
        }

        if (fields.length === 0) {
            return 'z.object({})';
        }

        return `z.object({ ${fields.join(', ')} })`;
    }

    /**
     * Map collection type (array)
     */
    private mapCollectionType(type: ReadonlyCollectionType): string {
        const elementSchema = this.mapBaseType(type.elementType);
        return `z.array(${elementSchema})`;
    }

    /**
     * Map union type
     */
    private mapUnionType(type: UnionType): string {
        // ImmutableSet requires .values() for iteration
        const memberSchemas = type.members.values().map(member =>
            this.mapBaseType(member)
        );

        if (memberSchemas.length === 0) {
            return 'z.never()';
        }

        if (memberSchemas.length === 1) {
            return memberSchemas[0];
        }

        return `z.union([${memberSchemas.join(', ')}])`;
    }

    /**
     * Map reference type (named type)
     */
    private mapReferenceType(type: ReferenceType): string {
        // For now, treat references as unknown
        // In future, could resolve to actual type
        return 'z.unknown()';
    }

    /**
     * Check if type needs Zod import
     */
    private needsImport(type: SemanticType): boolean {
        // All Zod schemas need 'z' import
        return true;
    }

    /**
     * Get referenced type names
     */
    private getReferencedTypes(type: SemanticType): readonly string[] {
        if (type instanceof ReferenceType) {
            return [type.name];
        }

        if (type instanceof ObjectType) {
            const refs: string[] = [];
            // ImmutableMap requires .entries() for iteration
            for (const [, fieldType] of type.properties.entries()) {
                refs.push(...this.getReferencedTypes(fieldType));
            }
            return refs;
        }

        if (type instanceof ReadonlyCollectionType) {
            return this.getReferencedTypes(type.elementType);
        }

        if (type instanceof UnionType) {
            const refs: string[] = [];
            // ImmutableSet requires .values() for iteration
            for (const member of type.members.values()) {
                refs.push(...this.getReferencedTypes(member));
            }
            return refs;
        }

        return [];
    }
}
