/**
 * Generated Mapper Artifact
 *
 * Represents mapper functions (API response -> frontend model, form values
 * -> API payload) generated from RequestTypesArtifact. Output of
 * MapperGeneratorPass.
 *
 * Single code output (1 pass = 1 artifact):
 *   - `code` -> mappers/api-mapper.ts (toXRead / toXReadList / toApiXCreate / toApiXUpdate)
 *
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';

export interface GeneratedMapperArtifact {
    readonly typeId: 'GeneratedMapper';
    readonly metadata: ArtifactMetadata;

    /** mappers/api-mapper.ts contents: read + form mapper functions. */
    readonly code: string;
}
