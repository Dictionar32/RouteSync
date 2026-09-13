/**
 * errors.ts
 *
 * Error definitions and result interfaces for writer operations.
 *
 * @module core/compiler/writers/contracts
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

export interface WriteError {
    readonly filePath: string;
    readonly error: Error;
}

export interface WriteResult {
    readonly written: readonly string[];
    readonly skipped: readonly string[];
    readonly errors: readonly WriteError[];
    readonly metadata: Readonly<{
        readonly totalFiles: number;
        readonly totalBytes: number;
        readonly durationMs: number;
    }>;
}
