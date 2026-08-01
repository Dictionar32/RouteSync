/**
 * Constraint Graph Artifact
 * 
 * Contains type constraints generated during semantic analysis.
 * Used by the constraint solver to infer types.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { Constraint } from '../constraints/Constraint';

/**
 * Artifact containing type constraints for solving
 */
export class ConstraintGraphArtifact extends TypedArtifact<'ConstraintGraph'> {
    public readonly typeId = 'ConstraintGraph';

    constructor(
        public readonly constraints: readonly Constraint[],
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
