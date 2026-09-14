/**
 * ReadModelProjector.ts
 *
 * Stream Projector for TypeScript Read Models (api-read.ts).
 * Projects SemanticTypesArtifact / ObjectType[] directly to CodeSink.
 *
 * @module compiler/projectors
 */

import type { CodeSink } from '../sink/CodeSink';
import type { SemanticTypesArtifact } from '../artifacts/SemanticTypesArtifact';
import type { GeneratedTypeScriptArtifact } from '../artifacts/GeneratedTypeScriptArtifact';
import { ArtifactTypeId } from '../artifacts/types';
import { TypeScriptCodeBuilder } from '../domain/common/TypeScriptTypeLowerer';

export class ReadModelProjector {
    private readonly codeBuilder: TypeScriptCodeBuilder;

    constructor(codeBuilder: TypeScriptCodeBuilder = new TypeScriptCodeBuilder()) {
        this.codeBuilder = codeBuilder;
    }

    public project(artifact: SemanticTypesArtifact, sink: CodeSink): GeneratedTypeScriptArtifact {
        const result = this.codeBuilder.build(artifact.types);
        sink.writeBlock(result.code);

        return Object.freeze({
            typeId: ArtifactTypeId.GeneratedTypeScript,
            code: result.code,
            imports: Object.freeze([]),
            interfaces: result.interfaces,
            generationMetadata: Object.freeze({
                generatorVersion: '1.0.0',
                typeCount: result.interfaces.length,
                interfaceCount: result.interfaces.length,
                importCount: 0,
                linesOfCode: result.code.length === 0 ? 0 : result.code.split('\n').length,
                warnings: Object.freeze([])
            }),
            metadata: artifact.metadata
        });
    }
}
