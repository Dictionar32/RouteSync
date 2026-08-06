import type { Writer, WrittenFile, FileToWrite, WriterOptions } from './Writer';
import { DEFAULT_WRITER_OPTIONS } from './Writer';

/**
 * In-memory writer implementation
 * 
 * Stores generated code in memory instead of disk.
 * Useful for testing, preview, or temporary operations.
 */
export class MemoryWriter implements Writer {
    private readonly files = new Map<string, string>();
    private readonly options: Required<WriterOptions>;

    constructor(options: WriterOptions = {}) {
        this.options = {
            ...DEFAULT_WRITER_OPTIONS,
            ...options
        } as Required<WriterOptions>;
    }

    /**
     * Write file to memory
     */
    public async write(path: string, content: string): Promise<WrittenFile> {
        // Check overwrite option
        if (!this.options.overwrite && this.files.has(path)) {
            throw new Error(`File already exists in memory: ${path}`);
        }

        // Store in memory
        this.files.set(path, content);

        return {
            path,
            content,
            byteSize: Buffer.byteLength(content, this.options.encoding),
            timestamp: new Date()
        };
    }

    /**
     * Write multiple files to memory
     */
    public async writeMany(files: FileToWrite[]): Promise<WrittenFile[]> {
        const results: WrittenFile[] = [];

        for (const file of files) {
            const written = await this.write(file.path, file.content);
            results.push(written);
        }

        return results;
    }

    /**
     * Check if file exists in memory
     */
    public async exists(path: string): Promise<boolean> {
        return this.files.has(path);
    }

    /**
     * Delete file from memory
     */
    public async delete(path: string): Promise<void> {
        this.files.delete(path);
    }

    /**
     * Get writer options
     */
    public getOptions(): WriterOptions {
        return { ...this.options };
    }

    /**
     * Get file content from memory
     */
    public getFile(path: string): string | undefined {
        return this.files.get(path);
    }

    /**
     * Get all files from memory
     */
    public getAllFiles(): Map<string, string> {
        return new Map(this.files);
    }

    /**
     * Clear all files from memory
     */
    public clear(): void {
        this.files.clear();
    }

    /**
     * Get number of files in memory
     */
    public size(): number {
        return this.files.size;
    }

    /**
     * Get all file paths in memory
     */
    public getPaths(): string[] {
        return Array.from(this.files.keys());
    }

    /**
     * Export all files as array
     */
    public toArray(): Array<{ path: string; content: string }> {
        return Array.from(this.files.entries()).map(([path, content]) => ({
            path,
            content
        }));
    }
}
