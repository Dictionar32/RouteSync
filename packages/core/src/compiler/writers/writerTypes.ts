/**
 * writerTypes.ts
 *
 * Data models and options for compiler writers.
 *
 * @module compiler/writers
 */

export interface WrittenFile {
    readonly path: string;
    readonly content: string;
    readonly byteSize: number;
    readonly timestamp: Date;
}

export interface FileToWrite {
    readonly path: string;
    readonly content: string;
}

export interface WriterOptions {
    readonly baseDir?: string;
    readonly overwrite?: boolean;
    readonly createDirs?: boolean;
    readonly encoding?: BufferEncoding;
    readonly dryRun?: boolean;
}

export const DEFAULT_WRITER_OPTIONS: WriterOptions = {
    baseDir: process.cwd(),
    overwrite: true,
    createDirs: true,
    encoding: 'utf-8',
    dryRun: false
};

export interface WriteResult {
    readonly written: WrittenFile[];
    readonly skipped: string[];
    readonly errors: Array<{ path: string; error: Error }>;
    readonly totalBytes: number;
    readonly durationMs: number;
}
