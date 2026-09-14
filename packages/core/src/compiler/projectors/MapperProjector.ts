/**
 * MapperProjector.ts
 *
 * Stream Projector for Mapper Functions (api-mapper.ts).
 * Projects RequestTypesArtifact into bidirectional mapping code.
 *
 * @module compiler/projectors
 */

import type { CodeSink } from '../sink/CodeSink';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedMapperArtifact } from '../artifacts/GeneratedMapperArtifact';
import {
    collectMapperParts,
    assembleMapperCode,
    buildMapperArtifact,
    buildEmptyMapperArtifact
} from '../passes/mapper';

export class MapperProjector {
    public project(artifact: RequestTypesArtifact, sink: CodeSink): GeneratedMapperArtifact {
        const requestTypes = artifact.requestTypes;

        if (requestTypes.length === 0) {
            const emptyArtifact = buildEmptyMapperArtifact('MapperProjector');
            sink.writeBlock(emptyArtifact.code);
            return emptyArtifact;
        }

        const parts = collectMapperParts(requestTypes);
        const code = assembleMapperCode(parts);
        sink.writeBlock(code);

        return buildMapperArtifact(code, 'MapperProjector');
    }
}
