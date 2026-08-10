/**
 * @file MemoryWriter.ts
 * @description In-memory writer implementation untuk testing
 * 
 * MemoryWriter stores generated files in memory instead of disk,
 * useful untuk unit tests dan quick validation.
 */

import type { IWriter, IMemoryWriter, GeneratedArtifact } from './IWriter';

/**
 * In-memory writer implementation
 * 
 * Stores files in memory Map untuk fast testing.
 * No actual file I/O performed.
 * 
 * @example
 * ```typescript
 * const writer = new MemoryWriter();
 * 
 * await writer.write({
 *   filePath: 'types/api-read.ts',
 *   content: 'export interface User { ... }'
 * });
 * 
 * const content = writer.getFile('types/api-read.ts');
 * ```
 */
export class MemoryWriter implements IMemoryWriter {
    private readonly files: Map<string, string> = new Map();

    /**
     * Write artifact to memory
     */
    public async write(artifact: GeneratedArtifact): Promise<void> {
        this.files.set(artifact.filePath, artifact.content);
        console.log(`[MemoryWriter] Written: ${artifact.filePath} (${Buffer.byteLength(artifact.content)} bytes)`);
    }

    /**
     * Write multiple artifacts to memory
     */
    public async writeAll(artifacts: readonly GeneratedArtifact[]): Promise<void> {
        for (const artifact of artifacts) {
            await this.write(artifact);
        }
        console.log(`[MemoryWriter] Written ${artifacts.length} file(s) to memory`);
    }

    /**
     * Get file content dari memory
     * 
     * @param path - File path to retrieve
     * @returns File content, atau undefined jika not found
     */
    public getFile(path: string): string | undefined {
        return this.files.get(path);
    }

    /**
     * Get all files dalam memory
     * 
     * @returns ReadonlyMap of all files
     */
    public getAllFiles(): ReadonlyMap<string, string> {
        return new Map(this.files);
    }

    /**
     * Check if file exists dalam memory
     * 
     * @param path - File path to check
     * @returns true if file exists
     */
    public hasFile(path: string): boolean {
        return this.files.has(path);
    }

    /**
     * Get file count
     * 
     * @returns Number of files in memory
     */
    public getFileCount(): number {
        return this.files.size;
    }

    /**
     * Clear all files dari memory
     */
    public clear(): void {
        this.files.clear();
        console.log('[MemoryWriter] Cleared all files from memory');
    }

    /**
     * Get total size of all files dalam bytes
     * 
     * @returns Total size in bytes
     */
    public getTotalSize(): number {
        let total = 0;
        for (const content of this.files.values()) {
            total += Buffer.byteLength(content);
        }
        return total;
    }

    /**
     * List all file paths
     * 
     * @returns Array of file paths
     */
    public listFiles(): readonly string[] {
        return Array.from(this.files.keys());
    }
}
