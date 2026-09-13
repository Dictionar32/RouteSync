/**
 * writer.ts
 *
 * Writer interfaces and configurations.
 *
 * @module core/compiler/writers/contracts
 */

import type { GeneratedArtifact } from './artifact';

export interface WriterConfig {
    readonly outputDir?: string;
    readonly overwrite?: boolean;
    readonly backup?: boolean;
    readonly permissions?: string;
    readonly dryRun?: boolean;
}

export interface IWriter {
    write(artifact: GeneratedArtifact): Promise<void>;
    writeAll(artifacts: readonly GeneratedArtifact[]): Promise<void>;
}

export interface IMemoryWriter extends IWriter {
    getFile(path: string): string | undefined;
    getAllFiles(): ReadonlyMap<string, string>;
    clear(): void;
}
