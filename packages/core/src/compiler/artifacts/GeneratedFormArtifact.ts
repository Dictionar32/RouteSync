/**
 * Generated Form Artifact
 * 
 * Represents form types generated from validation rules.
 * Output of FormGeneratorPass.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';

/**
 * Form action definition (create/update)
 */
export interface GeneratedFormAction {
    /** Action name (create, update) */
    readonly name: string;

    /** Field count dalam action ini */
    readonly fieldCount: number;

    /** Line range dalam generated code */
    readonly lineRange: readonly [number, number];
}

/**
 * Form type declaration dalam generated code
 */
export interface GeneratedFormType {
    /** Form type name (e.g., 'CartItemsForm') */
    readonly name: string;

    /** Actions yang available (create, update) */
    readonly actions: readonly GeneratedFormAction[];

    /** Source line range dalam generated code */
    readonly lineRange: readonly [number, number];
}

/**
 * Extended metadata untuk form generation
 */
export interface FormGenerationMetadata {
    /** Generator version */
    readonly generatorVersion: string;

    /** Jumlah request types yang di-generate */
    readonly requestTypeCount: number;

    /** Jumlah form types yang di-generate */
    readonly formTypeCount: number;

    /** Total actions across all forms */
    readonly totalActions: number;

    /** Total lines of code */
    readonly linesOfCode: number;

    /** Warnings during generation */
    readonly warnings: readonly string[];
}

/**
 * Generated Form artifact
 * 
 * Artifact ini berisi complete generated form types dari validation rules.
 * Compatible dengan CompilerArtifact pipeline.
 * 
 * Output path: forms/api-form.ts
 */
export interface GeneratedFormArtifact {
    /** Artifact type ID */
    readonly typeId: 'GeneratedForm';

    /** Standard artifact metadata (hash, producer, dependencies, etc) */
    readonly metadata: ArtifactMetadata;

    /** Generated form TypeScript source code */
    readonly code: string;

    /** Form type declarations yang di-generate */
    readonly formTypes: readonly GeneratedFormType[];

    /** Extended metadata with generation-specific info */
    readonly generationMetadata: FormGenerationMetadata;

    /** Source map jika available */
    readonly sourceMap?: string;
}

/**
 * Type guard untuk GeneratedFormArtifact
 */
export function isGeneratedFormArtifact(
    artifact: unknown
): artifact is GeneratedFormArtifact {
    if (typeof artifact !== 'object' || artifact === null) {
        return false;
    }

    const a = artifact as Partial<GeneratedFormArtifact>;

    return (
        a.typeId === 'GeneratedForm' &&
        typeof a.code === 'string' &&
        Array.isArray(a.formTypes) &&
        typeof a.generationMetadata === 'object' &&
        a.generationMetadata !== null &&
        typeof a.metadata === 'object' &&
        a.metadata !== null
    );
}
