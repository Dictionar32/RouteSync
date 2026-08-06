import type { Template } from '../Template';

/**
 * Template data for TypeScript interface
 */
export interface InterfaceTemplateData {
    /**
     * Interface name
     */
    name: string;

    /**
     * Interface properties
     */
    properties: Array<{
        name: string;
        type: string;
        optional?: boolean;
        readonly?: boolean;
        comment?: string;
    }>;

    /**
     * Import statements
     */
    imports?: Array<{
        name: string;
        from: string;
    }>;

    /**
     * Extends clause
     */
    extends?: string[];

    /**
     * Interface comment/description
     */
    comment?: string;

    /**
     * Export modifier
     */
    exported?: boolean;
}

/**
 * Template for generating TypeScript interfaces
 * 
 * Example output:
 * ```typescript
 * import { BaseEntity } from './BaseEntity';
 * 
 * export interface User extends BaseEntity {
 *   readonly id: number;
 *   name: string;
 *   email?: string;
 * }
 * ```
 */
export class InterfaceTemplate implements Template {
    public readonly name = 'typescript/interface';

    public render(data: InterfaceTemplateData): string {
        const parts: string[] = [];

        // Add imports
        if (data.imports && data.imports.length > 0) {
            const importStatements = data.imports
                .map(imp => `import { ${imp.name} } from '${imp.from}';`)
                .join('\n');
            parts.push(importStatements);
            parts.push(''); // Empty line after imports
        }

        // Add interface comment
        if (data.comment) {
            parts.push(`/**`);
            parts.push(` * ${data.comment}`);
            parts.push(` */`);
        }

        // Interface declaration
        const exportModifier = data.exported !== false ? 'export ' : '';
        const extendsClause = data.extends && data.extends.length > 0
            ? ` extends ${data.extends.join(', ')}`
            : '';

        parts.push(`${exportModifier}interface ${data.name}${extendsClause} {`);

        // Add properties
        for (const prop of data.properties) {
            // Property comment
            if (prop.comment) {
                parts.push(`/** ${prop.comment} */`);
            }

            // Property declaration
            const readonly = prop.readonly ? 'readonly ' : '';
            const optional = prop.optional ? '?' : '';
            parts.push(`${readonly}${prop.name}${optional}: ${prop.type};`);
        }

        parts.push('}');

        return parts.join('\n');
    }
}
