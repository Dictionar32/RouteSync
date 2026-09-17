/**
 * ResourceMappersArtifact.ts
 *
 * Upstream Intermediate Representation for API Read Mappers.
 * Produced by upstream semantic analysis passes, consumed by MapperGeneratorPass.
 * Complete Contract (0 '?', 0 '??', 0 'undefined').
 *
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import type { ResolvedProperty } from '../domain/common/ResolvedSemanticType';

export interface ResourceMapperDefinition {
    readonly resourceName: string;
    readonly functionName: string;
    readonly apiType: string;
    readonly transformedType: string;
    readonly body: string;
    readonly fields: readonly ResolvedProperty[];
}

export interface ResourceMappersArtifact {
    readonly typeId: 'ResourceMappers';
    readonly mappers: readonly ResourceMapperDefinition[];
    readonly metadata: ArtifactMetadata;
}