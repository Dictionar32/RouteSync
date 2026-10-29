/** Shared Laravel source-file acquisition owned by compiler/scanner, not by legacy operations. */
import path from 'node:path';
import * as fs from 'node:fs';

export interface SourceFileAcquisitionInterface {
    readonly collectPhpFiles: (directory: string) => Promise<readonly string[]>;
    readonly readSourceText: (file: string) => Promise<string>;
    readonly readSourceTextSync: (file: string) => string;
}

const phpEntry = (directory: string, entry: fs.Dirent): string => path.join(directory, entry.name);

/** Runtime source-file operations are published through one explicit interface object. */
export const sourceFileAcquisition: SourceFileAcquisitionInterface = Object.freeze({
    collectPhpFiles: async (directory: string): Promise<readonly string[]> => {
        if (!fs.existsSync(directory)) return Object.freeze([]);

        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        const files: string[] = [];
        for (const entry of entries) {
            const fullPath = phpEntry(directory, entry);
            if (entry.isDirectory()) {
                files.push(...await sourceFileAcquisition.collectPhpFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.php')) {
                files.push(fullPath);
            }
        }
        return Object.freeze(files);
    },
    /** Reads source text directly; semantic or source identity caching is not part of this operation. */
    readSourceText: async (file: string): Promise<string> => fs.promises.readFile(file, 'utf-8'),
    readSourceTextSync: (file: string): string => fs.readFileSync(file, 'utf-8'),
});
