/**
 * Compilation Result Artifact
 * 
 * Final artifact containing the complete compilation result.
 * Aggregates all other artifacts and provides access to the final output.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { CompilationResult } from '../result/CompilationResult';

/**
 * Artifact containing the final compilation result
 */
export class CompilationResultArtifact extends TypedArtifact<'CompilationResult'> {
    public readonly typeId = 'CompilationResult';

    constructor(
        public readonly result: CompilationResult,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
