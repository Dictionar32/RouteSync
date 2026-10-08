/**
 * Closed upstream mapper contract artifact.
 *
 * The artifact carries semantic mapping meaning, not generated source code.
 * Downstream mapper generation is a projection only.
 */
import type { ArtifactMetadata } from './Artifact';
import type { MapperConsumerInterface } from '../../types/upstream/semanticMapping';
import type { MapperProjectionTarget } from '../../types/interfaces/mapperProjectionInterface';

export interface ResourceMappersArtifact extends MapperProjectionTarget {
    readonly typeId: 'ResourceMappers';
    readonly mapping: MapperConsumerInterface;
    readonly metadata: ArtifactMetadata;
}
