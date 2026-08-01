/**
 * Dependency Graph Artifact
 * 
 * Contains the module dependency graph for incremental compilation.
 * Tracks forward and reverse dependencies between modules.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { DependencyGraph } from '../utils/Graph';

/**
 * Artifact containing the dependency graph
 */
export class DependencyGraphArtifact extends TypedArtifact<'DependencyGraph'> {
    public readonly typeId = 'DependencyGraph';

    constructor(
        public readonly graph: DependencyGraph,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
