/**
 * ArtifactMetadataFactory.ts
 *
 * Standardized Domain Factory for Compiler Artifact Metadata.
 * Pure Deterministic Value Object (0 duplicated literals).
 *
 * @module cli/generators/utils
 */

import type { ArtifactMetadata } from '../../../../core/src/compiler/artifacts/Artifact';

/**
 * ArtifactProducer
 *
 * Canonical Domain Vocabulary identifying the compiler component producing artifacts.
 */
export const ArtifactProducer = Object.freeze({
    CompilerBridge: 'CompilerBridge',
    StaticLaravelScanner: 'StaticLaravelScanner',
    TypeScriptGenerator: 'TypeScriptGenerator',
    ContractGenerator: 'ContractGenerator',
    FormGenerator: 'FormGenerator',
    MapperGenerator: 'MapperGenerator'
} as const);

export type ArtifactProducer = typeof ArtifactProducer[keyof typeof ArtifactProducer];

/**
 * ArtifactRevision
 *
 * Explicit Model representing compiler artifact schema evolution version.
 */
export const ArtifactRevision = Object.freeze({
    Initial: '1.0.0'
} as const);

export type ArtifactRevision = typeof ArtifactRevision[keyof typeof ArtifactRevision];

/**
 * ArtifactTypeId
 *
 * Canonical Domain Vocabulary identifying the artifact payload type in compiler passes.
 */
export const ArtifactTypeId = Object.freeze({
    SemanticTypes: 'SemanticTypes',
    RequestTypes: 'RequestTypes',
    GeneratedTypeScript: 'GeneratedTypeScript',
    GeneratedForm: 'GeneratedForm',
    GeneratedContract: 'GeneratedContract',
    GeneratedMapper: 'GeneratedMapper',
    ResourceTypes: 'ResourceTypes',
    ResourceMappers: 'ResourceMappers',
    RouteManifest: 'RouteManifest'
} as const);

export type ArtifactTypeId = typeof ArtifactTypeId[keyof typeof ArtifactTypeId];

/**
 * PipelineFlowChannel
 *
 * Canonical Domain Vocabulary identifying the pipeline channel/target of artifact emission.
 */
export const PipelineFlowChannel = Object.freeze({
    ContractInput: 'contract-input',
    RequestTypes: 'request-types',
    SemanticTypes: 'semantic-types',
    Manifest: 'manifest',
    Scan: 'scan'
} as const);

export type PipelineFlowChannel = typeof PipelineFlowChannel[keyof typeof PipelineFlowChannel];

export class ArtifactMetadataFactory {
    static create(
        producer: ArtifactProducer = ArtifactProducer.CompilerBridge,
        channel: PipelineFlowChannel = PipelineFlowChannel.Manifest
    ): ArtifactMetadata {
        const timestamp = Date.now();
        return Object.freeze({
            hash: `${channel}-${timestamp}`,
            producer,
            dependencies: Object.freeze([]),
            timestamp,
            revision: ArtifactRevision.Initial
        });
    }
}