/**
 * SemanticTypesPipeline.ts
 *
 * Structured Pipeline Orchestrator for converting RouteManifest into SemanticTypesArtifact for TypeScript Types.
 * Pure Structured Pipeline.
 *
 * @module cli/generators/utils
 */

import type { RouteManifest } from '../../../../core/src/types/route';
import type { SemanticTypesArtifact } from '../../../../core/src/compiler/artifacts/SemanticTypesArtifact';
import type { ObjectType } from '../../../../core/src/compiler/types/SemanticType';
import { ArtifactMetadataFactory, ArtifactProducer, ArtifactTypeId, PipelineFlowChannel } from './ArtifactMetadataFactory';

export class SemanticTypesArtifactFactory {
    static create(types: readonly ObjectType[]): SemanticTypesArtifact {
        return Object.freeze({
            typeId: ArtifactTypeId.SemanticTypes,
            types: Object.freeze(types),
            metadata: ArtifactMetadataFactory.create(ArtifactProducer.CompilerBridge, PipelineFlowChannel.Manifest)
        });
    }
}

export class SemanticTypesPipeline {
    /**
     * Executes the Semantic Types generation pipeline for TypeScript Pass (api-read.ts).
     * Pure Zero-Cost Continuous Stream (0 fragmentation, 0 array stitching, 0 'new').
     */
    static execute(manifest: RouteManifest): SemanticTypesArtifact {
        return {
            typeId: ArtifactTypeId.SemanticTypes,
            types: manifest.semanticTypes,
            metadata: ArtifactMetadataFactory.create(ArtifactProducer.CompilerBridge, PipelineFlowChannel.SemanticTypes)
        };
    }
}