/**
 * Lowered Type Artifact
 * 
 * Contains lowered type representations after high-level type features
 * have been desugared into simpler forms.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { SemanticType } from '../types/SemanticType';

/**
 * Artifact containing lowered types
 */
export class LoweredTypeArtifact extends TypedArtifact<'LoweredTypeGraph'> {
    public readonly typeId = 'LoweredTypeGraph';

    constructor(
        public readonly types: ReadonlyMap<string, SemanticType>,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
