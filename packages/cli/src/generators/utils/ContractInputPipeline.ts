/**
 * ContractInputPipeline.ts
 *
 * Structured Pipeline Orchestrator for converting RouteManifest into RequestTypesArtifact for Contract Generation.
 * Pure Zero-Cost Direct Artifact Emission (0 graph scanning, 0 runtime inferencing, 0 'new').
 *
 * @module cli/generators/utils
 */

import type { RouteManifest } from '../../../../core/src/types/route';
import type { RequestTypesArtifact } from '../../../../core/src/compiler/artifacts/RequestTypesArtifact';
import { ArtifactMetadataFactory, ArtifactProducer, ArtifactTypeId, PipelineFlowChannel } from './ArtifactMetadataFactory';

export class ContractInputPipeline {
    /**
     * Executes the Contract Input generation pipeline for Contract Generation (api-contract.ts).
     * Pure Zero-Cost Direct Artifact Emission (0 loop, 0 .map, 0 .filter, 0 heap allocations).
     */
    static execute(manifest: RouteManifest): RequestTypesArtifact {
        return {
            typeId: ArtifactTypeId.RequestTypes,
            requestTypes: manifest.requestTypes,
            metadata: ArtifactMetadataFactory.create(ArtifactProducer.CompilerBridge, PipelineFlowChannel.ContractInput)
        };
    }
}