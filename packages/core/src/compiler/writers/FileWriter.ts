import * as fs from 'fs/promises';
import * as path from 'path';
import type { Writer, WrittenFile, FileToWrite, WriterOptions } from './Writer';
import { DEFAULT_WRITER_OPTIONS } from './Writer';

/**
 * File system writer implementation
 * 
 * Writes generated code to actual files on disk
 */
export class FileWriter implements Writer {
    private readonly options: Required<WriterOptions>;

    constructor(options: WriterOptions = {}) {
        this.options = {
            ...DEFAULT_WRITER_OPTIONS,
            ...options
        } as Required<WriterOptions>;
    }

    /**
     * Write single file to disk
     */
    public async write(filePath: string, content: string): Promise<WrittenFile> {
        const fullPath = this.resolvePath(filePath);

        // Dry run - don't actually write
        if (this.options.dryRun) {
            return this.createWrittenFile(fullPath, content);
        }

        // Check if file exists
        if (!this.options.overwrite) {
            const fileExists = await this.exists(filePath);
            if (fileExists) {
                throw new Error(`File already exists and overwrite is disabled: ${fullPath}`);
            }
        }

        // Create directory if needed
        if (this.options.createDirs) {
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
        }

        // Write file
        await fs.writeFile(fullPath, content, { encoding: this.options.encoding });

        // Get file stats
        const stats = await fs.stat(fullPath);

        return {
            path: fullPath,
            content,
            byteSize: stats.size,
            timestamp: new Date()
        };
    }

    /**
     * Write multiple files to disk
     */
    public async writeMany(files: FileToWrite[]): Promise<WrittenFile[]> {
        const results: WrittenFile[] = [];

        // Write files sequentially to avoid race conditions
        for (const file of files) {
            const written = await this.write(file.path, file.content);
            results.push(written);
        }

        return results;
    }

    /**
     * Check if file exists
     */
    public async exists(filePath: string): Promise<boolean> {
        const fullPath = this.resolvePath(filePath);

        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete file
     */
    public async delete(filePath: string): Promise<void> {
        const fullPath = this.resolvePath(filePath);

        if (this.options.dryRun) {
            return;
        }

        try {
            await fs.unlink(fullPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * Get writer options
     */
    public getOptions(): WriterOptions {
        return { ...this.options };
    }

    /**
     * Resolve file path relative to base directory
     */
    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }

        return path.join(this.options.baseDir, filePath);
    }

    /**
     * Create WrittenFile object for dry run
     */
    private createWrittenFile(filePath: string, content: string): WrittenFile {
        return {
            path: filePath,
            content,
            byteSize: Buffer.byteLength(content, this.options.encoding),
            timestamp: new Date()
        };
    }
}
