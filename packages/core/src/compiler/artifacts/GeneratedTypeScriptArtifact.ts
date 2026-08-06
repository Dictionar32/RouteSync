/**
 * Generated TypeScript Artifact
 * 
 * Represents TypeScript code generated from semantic types.
 * Output of TypeScriptGeneratorPass.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';

/**
 * Import statement dalam generated code
 */
export interface GeneratedImport {
    /** Module yang di-import (e.g., './types') */
    readonly from: string;

    /** Named imports (e.g., ['User', 'Product']) */
    readonly names: readonly string[];

    /** Type-only import flag */
    readonly typeOnly: boolean;
}

/**
 * Interface declaration dalam generated code
 */
export interface GeneratedInterface {
    /** Interface name (e.g., 'User') */
    readonly name: string;

    /** Jumlah properties */
    readonly propertyCount: number;

    /** Extends clause jika ada */
    readonly extends?: readonly string[];

    /** Source line range dalam generated code */
    readonly lineRange: readonly [number, number];
}

/**
 * Extended metadata untuk generation-specific info
 */
export interface GenerationMetadata {
    /** Generator version */
    readonly generatorVersion: string;

    /** Jumlah types yang di-generate */
    readonly typeCount: number;

    /** Jumlah interfaces yang di-generate */
    readonly interfaceCount: number;

    /** Jumlah imports */
    readonly importCount: number;

    /** Total lines of code */
    readonly linesOfCode: number;

    /** Warnings during generation */
    readonly warnings: readonly string[];
}

/**
 * Generated TypeScript artifact
 * 
 * Artifact ini berisi complete generated TypeScript code dengan metadata.
 * Compatible dengan CompilerArtifact pipeline.
 */
export interface GeneratedTypeScriptArtifact {
    /** Artifact type ID */
    readonly typeId: 'GeneratedTypeScript';

    /** Standard artifact metadata (hash, producer, dependencies, etc) */
    readonly metadata: ArtifactMetadata;

    /** Generated TypeScript source code */
    readonly code: string;

    /** Import statements yang di-generate */
    readonly imports: readonly GeneratedImport[];

    /** Interface declarations yang di-generate */
    readonly interfaces: readonly GeneratedInterface[];

    /** Extended metadata with generation-specific info */
    readonly generationMetadata: GenerationMetadata;

    /** Source map jika available */
    readonly sourceMap?: string;
}

/**
 * Type guard untuk GeneratedTypeScriptArtifact
 */
export function isGeneratedTypeScriptArtifact(
    artifact: unknown
): artifact is GeneratedTypeScriptArtifact {
    if (typeof artifact !== 'object' || artifact === null) {
        return false;
    }

    const a = artifact as Partial<GeneratedTypeScriptArtifact>;

    return (
        a.typeId === 'GeneratedTypeScript' &&
        typeof a.code === 'string' &&
        Array.isArray(a.imports) &&
        Array.isArray(a.interfaces) &&
        typeof a.generationMetadata === 'object' &&
        a.generationMetadata !== null &&
        typeof a.metadata === 'object' &&
        a.metadata !== null
    );
}
