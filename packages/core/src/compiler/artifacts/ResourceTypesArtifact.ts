/**
 * ResourceTypesArtifact.ts
 *
 * Upstream Intermediate Representation of resolved resource schemas.
 * Produced by upstream semantic analysis passes, consumed by TypeScriptGeneratorPass.
 *
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import type { ResolvedObjectType } from '../domain/common/ResolvedSemanticType';

export interface ResourceTypeDefinition {
    readonly resourceName: string;
    readonly schema: ResolvedObjectType;
}

export interface ResourceTypesArtifact {
    readonly typeId: 'ResourceTypes';
    readonly resources: readonly ResourceTypeDefinition[];
    readonly metadata: ArtifactMetadata;
}