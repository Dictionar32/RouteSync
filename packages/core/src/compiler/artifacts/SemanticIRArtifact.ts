/**
 * Semantic IR Artifact
 * 
 * Contains the semantic intermediate representation of the program.
 * This is a lowered, typed representation used for optimization and code generation.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { SemanticIRNode } from '../ir/SemanticIR';

/**
 * Artifact containing semantic IR nodes
 */
export class SemanticIRArtifact extends TypedArtifact<'SemanticIR'> {
    public readonly typeId = 'SemanticIR';

    constructor(
        public readonly rootNodes: readonly SemanticIRNode[],
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
