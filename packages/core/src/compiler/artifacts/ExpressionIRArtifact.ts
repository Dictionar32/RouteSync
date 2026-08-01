/**
 * Expression IR Artifact
 * 
 * Contains intermediate representation for expressions.
 * Maps expression IDs to their IR representation.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { Expression } from '../ir/Expression';

/**
 * Artifact containing expression IR
 */
export class ExpressionIRArtifact extends TypedArtifact<'ExpressionIR'> {
    public readonly typeId = 'ExpressionIR';

    constructor(
        public readonly expressions: ReadonlyMap<string, Expression>,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
