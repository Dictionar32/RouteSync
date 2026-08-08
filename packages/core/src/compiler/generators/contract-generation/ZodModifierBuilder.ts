/**
 * ZodModifierBuilder.ts
 * 
 * Small focused class: Builds Zod modifier chains (.optional(), .nullable()).
 * Pure string building logic with zero side effects.
 * 
 * Responsibility: Generate Zod modifier chains based on field configuration
 * 
 * @module compiler/generators/contract-generation
 */

/**
 * Configuration for field modifiers
 */
export interface ModifierConfig {
    readonly required: boolean;
    readonly nullable: boolean;
}

/**
 * ZodModifierBuilder - Pure string building logic
 * 
 * Tiny puzzle piece (~60 lines) yang fokus pada satu hal:
 * Build Zod modifier chains (.optional(), .nullable()).
 * 
 * @example
 * ```typescript
 * const builder = new ZodModifierBuilder();
 * 
 * // Required, not nullable
 * builder.buildModifiers({ required: true, nullable: false });
 * // Result: ""
 * 
 * // Optional, not nullable
 * builder.buildModifiers({ required: false, nullable: false });
 * // Result: ".optional()"
 * 
 * // Required, nullable
 * builder.buildModifiers({ required: true, nullable: true });
 * // Result: ".nullable()"
 * 
 * // Optional, nullable
 * builder.buildModifiers({ required: false, nullable: true });
 * // Result: ".nullable().optional()"
 * ```
 */
export class ZodModifierBuilder {
    /**
     * Build complete modifier chain
     * 
     * Pure function - no side effects, no state mutation.
     * Order: .nullable() before .optional() (Zod convention)
     * 
     * @param config - Field modifier configuration
     * @returns Modifier chain string (empty if no modifiers needed)
     */
    buildModifiers(config: ModifierConfig): string {
        const modifiers: string[] = [];

        // Add .nullable() first (if needed)
        if (config.nullable) {
            modifiers.push('.nullable()');
        }

        // Add .optional() second (if needed)
        if (!config.required) {
            modifiers.push('.optional()');
        }

        // Join modifiers into single string
        return modifiers.join('');
    }

    /**
     * Check if any modifiers are needed
     * 
     * @param config - Field modifier configuration
     * @returns true if modifiers needed, false otherwise
     */
    hasModifiers(config: ModifierConfig): boolean {
        return config.nullable || !config.required;
    }
}
