/**
 * ContractActionGenerator.ts
 * 
 * Groups schemas by action (create/update) and generates action blocks.
 * 
 * Responsibility: Generate action-scoped Zod schemas and TypeScript types
 * 
 * @module compiler/generators/contract-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { FileValidationConstraints } from '../../artifacts/RequestTypesArtifact';
import { ContractSchemaMapper } from './ContractSchemaMapper';

/**
 * Contract field definition
 */
export interface ContractField {
    readonly name: string;
    readonly type: SemanticType;
    readonly fileConstraints?: FileValidationConstraints;
    readonly required: boolean;
    readonly nullable: boolean;
}

/**
 * Generated action with schemas and types
 */
export interface GeneratedContractAction {
    readonly name: string;
    readonly schemaLines: readonly string[];
    readonly typeLines: readonly string[];
    readonly fieldCount: number;
}

/**
 * ContractActionGenerator - Generate action blocks with Zod schemas
 * 
 * Delegates to ContractSchemaMapper for individual field schemas
 * 
 * Generates both:
 * - Zod schema: `create: z.object({ ... })`
 * - TypeScript type: `create: { ... }`
 * 
 * @example
 * ```typescript
 * const generator = new ContractActionGenerator(
 *   new ContractSchemaMapper()
 * );
 * 
 * const action = generator.generateAction('create', [
 *   { name: 'nama', type: stringType, required: true, nullable: false }
 * ]);
 * // action.schemaLines = ["  create: z.object({", "    nama: z.string()", "  })"]
 * // action.typeLines = ["  create: {", "    nama: string", "  }"]
 * ```
 */
export class ContractActionGenerator {
    constructor(
        private readonly schemaMapper: ContractSchemaMapper = new ContractSchemaMapper()
    ) { }

    /**
     * Generate action block with Zod schemas and TypeScript types
     * 
     * @param actionName - Action name (e.g., 'create', 'update')
     * @param fields - Fields for this action
     * @returns Generated action with schema and type lines
     */
    generateAction(
        actionName: string,
        fields: readonly ContractField[]
    ): GeneratedContractAction {
        if (fields.length === 0) {
            return {
                name: actionName,
                schemaLines: this.generateEmptySchemaLines(actionName),
                typeLines: this.generateEmptyTypeLines(actionName),
                fieldCount: 0
            };
        }

        return {
            name: actionName,
            schemaLines: this.generateSchemaLines(actionName, fields),
            typeLines: this.generateTypeLines(actionName, fields),
            fieldCount: fields.length
        };
    }

    /**
     * Generate Zod schema lines for action
     */
    private generateSchemaLines(
        actionName: string,
        fields: readonly ContractField[]
    ): readonly string[] {
        const lines: string[] = [];

        // Opening line
        lines.push(`  ${this.capitalize(actionName)}: z.object({`);

        // Field lines
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const isLast = i === fields.length - 1;

            const mapped = this.schemaMapper.mapToZodSchema(field.type, {
                fieldName: field.name,
                required: field.required,
                nullable: field.nullable,
                fileConstraints: field.fileConstraints
            });

            const comma = isLast ? '' : ',';
            lines.push(`    ${field.name}: ${mapped.zodSchema}${comma}`);
        }

        // Closing line
        lines.push(`  })`);

        return lines;
    }

    /**
     * Generate TypeScript type lines for action
     */
    private generateTypeLines(
        actionName: string,
        fields: readonly ContractField[]
    ): readonly string[] {
        const lines: string[] = [];

        // Opening line
        lines.push(`  ${this.capitalize(actionName)}: {`);

        // Field lines
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const isLast = i === fields.length - 1;

            const tsType = this.mapToTypeScriptType(field);
            const comma = isLast ? '' : ',';
            lines.push(`    ${field.name}: ${tsType}${comma}`);
        }

        // Closing line
        lines.push(`  }`);

        return lines;
    }

    /**
     * Generate empty schema lines
     */
    private generateEmptySchemaLines(actionName: string): readonly string[] {
        return [`  ${this.capitalize(actionName)}: z.object({})`];
    }

    /**
     * Generate empty type lines
     */
    private generateEmptyTypeLines(actionName: string): readonly string[] {
        return [`  ${this.capitalize(actionName)}: {}`];
    }

    private capitalize(str: string): string {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
    }

    /**
     * Map SemanticType to TypeScript type string
     * 
     * Simplified version for type annotations
     */
    private mapToTypeScriptType(field: ContractField): string {
        // Get base type name
        const baseType = this.getBaseTypeName(field.type);

        // Apply modifiers
        if (!field.required && field.nullable) {
            return `${baseType} | null | undefined`;
        }
        if (field.nullable) {
            return `${baseType} | null`;
        }
        if (!field.required) {
            return `${baseType} | undefined`;
        }

        return baseType;
    }

    /**
     * Get base TypeScript type name from SemanticType
     */
    private getBaseTypeName(type: SemanticType): string {
        // Use discriminated union narrowing

        // Handle primitive types
        if (type.kind === 'primitive') {
            switch (type.type) {
                case 'string':
                    return 'string';
                case 'number':
                    return 'number';
                case 'boolean':
                    return 'boolean';
                case 'datetime':
                    return 'string';  // Datetime represented as ISO string
                case 'file':
                    return 'File';
                case 'unknown':
                default:
                    return 'unknown';
            }
        }

        // Handle readonly collection types
        if (type.kind === 'readonly_collection') {
            const elementType = this.getBaseTypeName(type.elementType);
            return `${elementType}[]`;
        }

        // Handle mutable collection types
        if (type.kind === 'mutable_collection') {
            const elementType = this.getBaseTypeName(type.elementType);
            return `${elementType}[]`;
        }

        // Handle object types
        if (type.kind === 'object') {
            return 'object';
        }

        // Handle reference types (named types like User, Product, etc.)
        if (type.kind === 'reference') {
            return type.name;  // Use the referenced type name
        }

        // Handle union types - return first member type
        if (type.kind === 'union') {
            const firstMember = Array.from(type.members.values())[0];
            return firstMember ? this.getBaseTypeName(firstMember) : 'unknown';
        }

        // Handle never and error types
        if (type.kind === 'never') {
            return 'never';
        }

        if (type.kind === 'error') {
            return 'unknown';  // Error types fallback to unknown
        }

        // Default fallback
        return 'unknown';
    }
}
