/**
 * @file IWriter.ts
 * @description Interface contracts untuk Writer layer
 *
 * Writer layer bertanggung jawab persist generated code ke destination (file system, memory, etc).
 * Writer HANYA write files - NO formatting, NO code generation.
 *
 * @module core/compiler/writers/IWriter
 */

export type {
    ArtifactMetadata,
    GeneratedArtifact,
    WriterConfig,
    IWriter,
    IMemoryWriter,
    WriteError,
    WriteResult
} from './contracts';

export { WriterError } from './contracts';
