/**
 * Generated Contract Artifact
 * 
 * Represents contract schemas generated with Zod for runtime validation.
 * Output of ContractGeneratorPass.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';

/**
 * Contract action information (create, update, etc.)
 */
export interface ContractActionInfo {
    /** Action name (create, update, delete, etc.) */
    readonly name: string;

    /** Zod schema string for this action */
    readonly zodSchema: string;

    /** Validator function name */
    readonly validatorName: string;

    /** Field count dalam action ini */
    readonly fieldCount: number;
}

/**
 * Contract resource information
 */
export interface GeneratedContractInfo {
    /** Resource name (e.g., 'Order', 'Payment') */
    readonly name: string;

    /** Schema constant name (e.g., 'OrderContractSchema') */
    readonly schemaName: string;

    /** Actions available for this contract */
    readonly actions: readonly ContractActionInfo[];

    /** Line range dalam generated code */
    readonly lineRange: readonly [number, number];
}

/**
 * Extended metadata untuk contract generation
 */
export interface ContractGenerationMetadata {
    /** Generator version */
    readonly generatorVersion: string;

    /** Jumlah request types yang di-generate */
    readonly requestTypeCount: number;

    /** Jumlah contract resources yang di-generate */
    readonly contractCount: number;

    /** Total actions across all contracts */
    readonly totalActions: number;

    /** Total Zod schemas generated */
    readonly zodSchemasCount: number;

    /** Total validator functions generated */
    readonly validatorsCount: number;

    /** Total lines of code */
    readonly linesOfCode: number;

    /** Warnings during generation */
    readonly warnings: readonly string[];
}

/**
 * Generated Contract artifact
 * 
 * Artifact ini berisi complete generated contract schemas dengan Zod.
 * Compatible dengan CompilerArtifact pipeline.
 * 
 * Output path: contracts/api-contract.ts
 * 
 * Contains 4 sections:
 * 1. Zod Schemas - Runtime validation schemas
 * 2. Inferred Types - TypeScript types from schemas
 * 3. Validators - Validation helper functions
 * 4. Exports - Centralized exports object
 */
export interface GeneratedContractArtifact {
    /** Artifact type ID */
    readonly typeId: 'GeneratedContract';

    /** Standard artifact metadata (hash, producer, dependencies, etc) */
    readonly metadata: ArtifactMetadata;

    /** Generated contract TypeScript source code */
    readonly code: string;

    /** Contract resource information */
    readonly contracts: readonly GeneratedContractInfo[];

    /** Extended metadata with generation-specific info */
    readonly generationMetadata: ContractGenerationMetadata;

    /** Source map jika available */
    readonly sourceMap?: string;
}

/**
 * Type guard untuk GeneratedContractArtifact
 */
export function isGeneratedContractArtifact(
    artifact: unknown
): artifact is GeneratedContractArtifact {
    if (typeof artifact !== 'object' || artifact === null) {
        return false;
    }

    const a = artifact as Partial<GeneratedContractArtifact>;

    return (
        a.typeId === 'GeneratedContract' &&
        typeof a.code === 'string' &&
        Array.isArray(a.contracts) &&
        typeof a.generationMetadata === 'object' &&
        a.generationMetadata !== null &&
        typeof a.metadata === 'object' &&
        a.metadata !== null
    );
}
