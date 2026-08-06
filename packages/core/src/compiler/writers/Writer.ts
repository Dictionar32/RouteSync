/**
 * Represents a file that was written
 */
export interface WrittenFile {
    /**
     * File path (absolute or relative)
     */
    readonly path: string;

    /**
     * File content
     */
    readonly content: string;

    /**
     * File size in bytes
     */
    readonly byteSize: number;

    /**
     * Timestamp when file was written
     */
    readonly timestamp: Date;
}

/**
 * File to be written
 */
export interface FileToWrite {
    /**
     * File path (relative to base directory)
     */
    readonly path: string;

    /**
     * File content
     */
    readonly content: string;
}

/**
 * Writer configuration options
 */
export interface WriterOptions {
    /**
     * Base directory for file operations
     */
    readonly baseDir?: string;

    /**
     * Overwrite existing files
     */
    readonly overwrite?: boolean;

    /**
     * Create directories if they don't exist
     */
    readonly createDirs?: boolean;

    /**
     * File encoding
     */
    readonly encoding?: BufferEncoding;

    /**
     * Dry run (don't actually write files)
     */
    readonly dryRun?: boolean;
}

/**
 * Default writer options
 */
export const DEFAULT_WRITER_OPTIONS: WriterOptions = {
    baseDir: process.cwd(),
    overwrite: true,
    createDirs: true,
    encoding: 'utf-8',
    dryRun: false
};

/**
 * Base interface for code writers
 * 
 * Responsibilities:
 * - Persist generated code to storage
 * - Handle file system operations
 * - Provide write feedback/stats
 * 
 * Does NOT handle:
 * - Code generation (handled by Emitter)
 * - Code formatting (handled by Formatter)
 * - Template rendering (handled by Template)
 */
export interface Writer {
    /**
     * Write single file
     * @param path - File path
     * @param content - File content
     * @returns Promise with written file info
     */
    write(path: string, content: string): Promise<WrittenFile>;

    /**
     * Write multiple files
     * @param files - Array of files to write
     * @returns Promise with array of written file info
     */
    writeMany(files: FileToWrite[]): Promise<WrittenFile[]>;

    /**
     * Check if file exists
     * @param path - File path
     * @returns Promise with existence check result
     */
    exists(path: string): Promise<boolean>;

    /**
     * Delete file
     * @param path - File path
     * @returns Promise that resolves when file is deleted
     */
    delete(path: string): Promise<void>;

    /**
     * Get writer options
     */
    getOptions(): WriterOptions;
}

/**
 * Write result with statistics
 */
export interface WriteResult {
    /**
     * Files that were written successfully
     */
    readonly written: WrittenFile[];

    /**
     * Files that were skipped
     */
    readonly skipped: string[];

    /**
     * Files that failed to write
     */
    readonly errors: Array<{ path: string; error: Error }>;

    /**
     * Total bytes written
     */
    readonly totalBytes: number;

    /**
     * Execution duration in milliseconds
     */
    readonly durationMs: number;
}
