/**
 * @file IWriter.ts
 * @description Interface contracts untuk Writer layer
 * 
 * Writer layer bertanggung jawab persist generated code ke destination (file system, memory, etc).
 * Writer HANYA write files - NO formatting, NO code generation.
 */

/**
 * Generated artifact untuk persist
 * 
 * Represents satu file yang akan di-generate dengan metadata.
 */
export interface GeneratedArtifact {
    /** Target file path (relative atau absolute) */
    readonly filePath: string;

    /** Generated content (already formatted, ready to write) */
    readonly content: string;

    /** Optional metadata about artifact */
    readonly metadata?: ArtifactMetadata;
}

/**
 * Metadata about generated artifact
 */
export interface ArtifactMetadata {
    /** Generation timestamp */
    readonly generatedAt?: Date;

    /** Generator version */
    readonly generatorVersion?: string;

    /** Source file yang di-generate dari */
    readonly sourceFile?: string;

    /** Content hash untuk change detection */
    readonly contentHash?: string;

    /** Additional custom metadata */
    readonly custom?: Readonly<Record<string, unknown>>;
}

/**
 * Base interface untuk writers
 * 
 * Writers bertanggung jawab persist GeneratedArtifact ke destination.
 * Implementation bisa filesystem, memory, network, dll.
 * 
 * @example
 * ```typescript
 * class FileWriter implements IWriter {
 *   async write(artifact: GeneratedArtifact): Promise<void> {
 *     await fs.writeFile(artifact.filePath, artifact.content, 'utf-8');
 *   }
 * }
 * ```
 */
export interface IWriter {
    /**
     * Write single artifact ke destination
     * 
     * REQUIREMENTS:
     * - Async operation (may involve I/O)
     * - Create directories jika belum ada
     * - Handle file permissions
     * - Type-safe (no any types)
     * 
     * @param artifact - Artifact to write
     * @throws WriterError jika write fails
     */
    write(artifact: GeneratedArtifact): Promise<void>;

    /**
     * Write multiple artifacts
     * 
     * Implementation bisa optimize dengan parallel writes.
     * 
     * @param artifacts - Array of artifacts to write
     * @throws WriterError jika any write fails
     */
    writeAll(artifacts: readonly GeneratedArtifact[]): Promise<void>;
}

/**
 * Writer configuration options
 */
export interface WriterConfig {
    /** Base output directory */
    readonly outputDir?: string;

    /** Overwrite existing files */
    readonly overwrite?: boolean;

    /** Create backup sebelum overwrite */
    readonly backup?: boolean;

    /** File permissions (chmod style) */
    readonly permissions?: string;

    /** Dry run mode (don't actually write) */
    readonly dryRun?: boolean;
}

/**
 * Writer error untuk type-safe error handling
 */
export class WriterError extends Error {
    constructor(
        message: string,
        public readonly filePath: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'WriterError';
        Object.freeze(this);
    }
}

/**
 * Result type untuk write operations
 */
export interface WriteResult {
    /** Files successfully written */
    readonly written: readonly string[];

    /** Files skipped (already exist, etc) */
    readonly skipped: readonly string[];

    /** Errors occurred during writing */
    readonly errors: readonly WriteError[];

    /** Metadata about write process */
    readonly metadata: Readonly<{
        readonly totalFiles: number;
        readonly totalBytes: number;
        readonly durationMs: number;
    }>;
}

/**
 * Individual write error
 */
export interface WriteError {
    readonly filePath: string;
    readonly error: Error;
}

/**
 * In-memory writer untuk testing
 */
export interface IMemoryWriter extends IWriter {
    /**
     * Get file content dari memory
     */
    getFile(path: string): string | undefined;

    /**
     * Get all files dalam memory
     */
    getAllFiles(): ReadonlyMap<string, string>;

    /**
     * Clear all files dari memory
     */
    clear(): void;
}

