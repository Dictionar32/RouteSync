/**
 * Pass Descriptor
 * 
 * Describes what artifacts a compiler pass consumes and produces.
 * Used for dependency resolution and pass ordering.
 * 
 * @module compiler/passes
 */

import type { ArtifactKey } from '../artifacts/types';

/**
 * Describes the input/output contract of a compiler pass
 */
export interface PassDescriptor {
    /** Artifact keys this pass requires as input */
    readonly consumes: readonly ArtifactKey[];

    /** Artifact keys this pass produces as output */
    readonly produces: readonly ArtifactKey[];
}

/**
 * Dependency specification for a pass
 */
export interface PassDependency {
    /** Optional specific producer name */
    readonly producer?: string;

    /** Artifact key this pass depends on */
    readonly artifact: ArtifactKey;
}
