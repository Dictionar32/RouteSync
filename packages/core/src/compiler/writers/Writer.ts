/**
 * Writer.ts
 *
 * Active Consumer: Core Writer interface definition.
 *
 * @module compiler/writers
 */

import {
    type WrittenFile,
    type FileToWrite,
    type WriterOptions,
    type WriteResult,
    DEFAULT_WRITER_OPTIONS
} from './writerTypes';

export type {
    WrittenFile,
    FileToWrite,
    WriterOptions,
    WriteResult
};

export { DEFAULT_WRITER_OPTIONS };

/**
 * Base interface for code writers
 * 
 * Responsibilities:
 * - Persist generated code to storage
 * - Handle file system operations
 * - Provide write feedback/stats
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
