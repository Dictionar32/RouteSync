import * as fs from 'fs/promises';
import * as path from 'path';
import type { IWriter, GeneratedArtifact, WriterConfig } from './IWriter';
import { WriterError } from './IWriter';

/**
 * Default writer configuration
 */
const DEFAULT_CONFIG: Required<WriterConfig> = {
    outputDir: './output',
    overwrite: true,
    backup: false,
    permissions: '0644',
    dryRun: false
};

/**
 * File system writer implementation
 * 
 * Writes generated code to actual files on disk.
 * Implements IWriter interface dari pipeline architecture.
 */
export class FileWriter implements IWriter {
    private readonly config: Required<WriterConfig>;

    constructor(config: WriterConfig = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        Object.freeze(this);
    }

    /**
     * Write single artifact to disk
     * 
     * Implementation:
     * 1. Resolve full path (relative to outputDir)
     * 2. Check overwrite policy
     * 3. Create directories if needed
     * 4. Write file atomically
     * 5. Set permissions
     * 
     * @param artifact - GeneratedArtifact to write
     * @throws WriterError if write fails
     */
    public async write(artifact: GeneratedArtifact): Promise<void> {
        const fullPath = this.resolvePath(artifact.filePath);

        try {
            // Dry run - don't actually write
            if (this.config.dryRun) {
                console.log(`[DryRun] Would write: ${fullPath} (${Buffer.byteLength(artifact.content)} bytes)`);
                return;
            }

            // Check if file exists dan overwrite policy
            const fileExists = await this.fileExists(fullPath);
            if (fileExists && !this.config.overwrite) {
                throw new WriterError(
                    `File already exists and overwrite is disabled`,
                    fullPath
                );
            }

            // Backup existing file jika enabled
            if (fileExists && this.config.backup) {
                await this.backupFile(fullPath);
            }

            // Create directory if needed
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });

            // Write file atomically (write to temp, then rename)
            const tempPath = `${fullPath}.tmp`;
            await fs.writeFile(tempPath, artifact.content, { encoding: 'utf-8' });
            await fs.rename(tempPath, fullPath);

            // Set permissions if specified
            if (this.config.permissions) {
                await fs.chmod(fullPath, this.config.permissions);
            }

            console.log(`[FileWriter] Written: ${fullPath} (${Buffer.byteLength(artifact.content)} bytes)`);

        } catch (error) {
            if (error instanceof WriterError) {
                throw error;
            }
            throw new WriterError(
                `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
                fullPath,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Write multiple artifacts to disk
     * 
     * Writes files sequentially to avoid race conditions.
     * Could be optimized untuk parallel writes in future.
     * 
     * @param artifacts - Array of GeneratedArtifact to write
     * @throws WriterError if any write fails
     */
    public async writeAll(artifacts: readonly GeneratedArtifact[]): Promise<void> {
        console.log(`[FileWriter] Writing ${artifacts.length} file(s)...`);

        for (const artifact of artifacts) {
            await this.write(artifact);
        }

        console.log(`[FileWriter] Successfully wrote ${artifacts.length} file(s)`);
    }

    /**
     * Check if file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Backup existing file sebelum overwrite
     */
    private async backupFile(filePath: string): Promise<void> {
        const backupPath = `${filePath}.backup`;
        await fs.copyFile(filePath, backupPath);
        console.log(`[FileWriter] Created backup: ${backupPath}`);
    }

    /**
     * Resolve file path relative to base output directory
     */
    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }

        return path.join(this.config.outputDir, filePath);
    }
}
