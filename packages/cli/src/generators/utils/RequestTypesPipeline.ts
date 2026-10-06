/**
 * RequestTypesPipeline.ts
 *
 * Structured Pipeline Orchestrator for converting RouteManifest into RequestTypesArtifact for Form Generation.
 * Pure Structured Pipeline.
 *
 * @module cli/generators/utils
 */

import type { RouteManifest, RequestTypesArtifact } from '@routesync/core';
import { ArtifactMetadataFactory, ArtifactProducer, ArtifactTypeId, PipelineFlowChannel } from './ArtifactMetadataFactory';

export class RequestTypesPipeline {
    /**
     * Executes the Request Types generation pipeline for Form Generation.
     * Pure Zero-Cost Direct Artifact Emission (0 loop, 0 .map, 0 .filter, 0 heap allocations).
     */
    static execute(manifest: RouteManifest): RequestTypesArtifact {
        return {
            typeId: ArtifactTypeId.RequestTypes,
            requestTypes: manifest.requestTypes,
            metadata: ArtifactMetadataFactory.create(ArtifactProducer.CompilerBridge, PipelineFlowChannel.RequestTypes)
        };
    }
}