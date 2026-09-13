/**
 * artifact.ts
 *
 * Interfaces for generated artifacts and their metadata.
 *
 * @module core/compiler/writers/contracts
 */

export interface ArtifactMetadata {
    readonly generatedAt?: Date;
    readonly generatorVersion?: string;
    readonly sourceFile?: string;
    readonly contentHash?: string;
    readonly artifactType?: string;
    readonly linesOfCode?: number;
    readonly custom?: Readonly<Record<string, unknown>>;
}

export interface GeneratedArtifact {
    readonly filePath: string;
    readonly fileName?: string;
    readonly content: string;
    readonly metadata?: ArtifactMetadata;
}
