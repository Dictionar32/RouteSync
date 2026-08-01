/**
 * Contract Graph Artifact
 * 
 * Contains the contract graph representing API contracts and their relationships.
 * This is the final artifact before code generation.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { ContractGraph } from '../../graph/ContractGraph';

/**
 * Artifact containing the contract graph
 */
export class ContractGraphArtifact extends TypedArtifact<'ContractGraph'> {
    public readonly typeId = 'ContractGraph';

    constructor(
        public readonly graph: ContractGraph,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
