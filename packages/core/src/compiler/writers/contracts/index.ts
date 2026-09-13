/**
 * index.ts
 *
 * Writer contracts domain exports.
 *
 * @module core/compiler/writers/contracts
 */

export type {
    ArtifactMetadata,
    GeneratedArtifact
} from './artifact';

export {
    WriterError,
    type WriteError,
    type WriteResult
} from './errors';

export type {
    WriterConfig,
    IWriter,
    IMemoryWriter
} from './writer';
