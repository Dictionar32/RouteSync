import type { Template } from '../Template';

/**
 * Template data for TypeScript type alias
 */
export interface TypeAliasTemplateData {
    /**
     * Type alias name
     */
    name: string;

    /**
     * Type definition
     */
    type: string;

    /**
     * Type comment/description
     */
    comment?: string;

    /**
     * Export modifier
     */
    exported?: boolean;

    /**
     * Generic parameters
     */
    generics?: string[];
}

/**
 * Template for generating TypeScript type aliases
 * 
 * Example output:
 * ```typescript
 * export type UserID = number;
 * export type Result<T> = T | null;
 * export type UserRole = 'admin' | 'user' | 'guest';
 * ```
 */
export class TypeAliasTemplate implements Template {
    public readonly name = 'typescript/type-alias';

    public render(data: TypeAliasTemplateData): string {
        const parts: string[] = [];

        // Add comment
        if (data.comment) {
            parts.push(`/**`);
            parts.push(` * ${data.comment}`);
            parts.push(` */`);
        }

        // Type declaration
        const exportModifier = data.exported !== false ? 'export ' : '';
        const generics = data.generics && data.generics.length > 0
            ? `<${data.generics.join(', ')}>`
            : '';

        parts.push(`${exportModifier}type ${data.name}${generics} = ${data.type};`);

        return parts.join('\n');
    }
}
