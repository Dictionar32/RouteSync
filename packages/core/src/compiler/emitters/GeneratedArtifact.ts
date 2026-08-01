/**
 * @file GeneratedArtifact.ts
 * @description Output artifact types untuk code generation
 */

/**
 * Represents single generated file artifact dari compilation process
 * 
 * @example
 * ```typescript
 * const artifact: GeneratedArtifact = {
 *   filePath: 'src/api/types.ts',
 *   content: 'export interface User { id: number; }'
 * };
 * ```
 */
export interface GeneratedArtifact {
    /** Relative atau absolute path untuk generated file */
    readonly filePath: string;

    /** Content dari generated file */
    readonly content: string;
}
