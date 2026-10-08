/**
 * MapperProjector.ts
 *
 * Stream Projector for Mapper Functions (api-mapper.ts).
 * Projects RequestTypesArtifact into bidirectional mapping code.
 *
 * @module compiler/projectors
 */

import type { CodeSink } from '../sink/CodeSink';
import type { ResourceMappersArtifact } from '../artifacts/ResourceMappersArtifact';
import type { GeneratedMapperArtifact } from '../artifacts/GeneratedMapperArtifact';
import {
    collectMapperParts,
    assembleMapperCode,
    buildMapperArtifact,
    buildEmptyMapperArtifact
} from '../passes/mapper';

export class MapperProjector {
    public project(artifact: ResourceMappersArtifact, sink: CodeSink): GeneratedMapperArtifact {
        const mapping = artifact.mapping;

        if (mapping.read.length === 0 && mapping.write.length === 0) {
            const emptyArtifact = buildEmptyMapperArtifact('MapperProjector');
            sink.writeBlock(emptyArtifact.code);
            return emptyArtifact;
        }

        const parts = collectMapperParts(mapping);
        const code = assembleMapperCode(parts);
        sink.writeBlock(code);

        return buildMapperArtifact(code, 'MapperProjector');
    }
}
