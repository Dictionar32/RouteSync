/**
 * SemanticTypesArtifact.ts — First-Class Output Artifact for Semantic Type Generation.
 */

import type { ArtifactMetadata } from './Artifact';
import type { ObjectType } from '../types/SemanticType';

export interface SemanticTypesArtifact {
    readonly typeId: 'SemanticTypes';
    readonly types: readonly ObjectType[];
    readonly metadata: ArtifactMetadata;
}