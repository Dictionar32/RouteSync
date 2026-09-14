/**
 * artifact.ts
 *
 * Closed contracts and types for generated artifacts and their metadata.
 * Conforms to Level 6/7 Correct-by-Construction: Zero porous undefined, 0 Record.
 *
 * @module core/compiler/writers/contracts
 */

export interface ArtifactMetadataContract {
    readonly generatedAt: Date;
    readonly generatorVersion: string;
    readonly sourceFile: string;
    readonly contentHash: string;
    readonly artifactType: string;
    readonly linesOfCode: number;
    readonly custom: ReadonlyMap<string, unknown>;
}

export type ArtifactMetadata = {
    readonly generatedAt?: Date;
    readonly generatorVersion?: string;
    readonly sourceFile?: string;
    readonly contentHash?: string;
    readonly artifactType?: string;
    readonly linesOfCode?: number;
    readonly custom?: Readonly<Record<string, unknown>>;
};

/**
 * Level 7 Complete Contract for GeneratedArtifact (0 undefined, 0 null, 0 ?:).
 */
export interface GeneratedArtifactContract {
    readonly filePath: string;
    readonly fileName: string;
    readonly content: string;
    readonly metadata: ArtifactMetadataContract;
}

export type GeneratedArtifact = {
    readonly filePath: string;
    readonly fileName?: string;
    readonly content: string;
    readonly metadata?: ArtifactMetadata;
};
