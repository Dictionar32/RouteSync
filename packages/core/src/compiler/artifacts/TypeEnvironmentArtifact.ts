/**
 * Type Environment Artifact
 * 
 * Contains the resolved type environment after constraint solving.
 * Maps type variables to their inferred types.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { TypeEnvironment } from '../constraints/TypeEnvironment';

/**
 * Artifact containing the solved type environment
 */
export class TypeEnvironmentArtifact extends TypedArtifact<'TypeEnvironment'> {
    public readonly typeId = 'TypeEnvironment';

    constructor(
        public readonly environment: TypeEnvironment,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
