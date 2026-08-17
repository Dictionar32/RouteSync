/**
 * Pass Descriptor
 *
 * Describes the typed artifact contract of a compiler pass. The generic input
 * and output tuples keep the descriptor aligned with the CompilerPass contract.
 *
 * @module compiler/passes
 */

import type { ArtifactKey } from '../artifacts/types';

/**
 * Describes a pass dependency constraint.
 *
 * @template K Artifact keys that are valid inputs for the owning pass.
 */
export interface PassDependency<K extends ArtifactKey = ArtifactKey> {
    /** Optional specific producer name. */
    readonly producer?: string;

    /** Artifact key this pass depends on. */
    readonly artifact: K;
}

/**
 * Typed input/output contract for a compiler pass.
 *
 * Defaults keep the runtime ExecutablePass API compatible while typed
 * CompilerPass instances can bind the descriptor directly to I/O tuples.
 */
export interface PassDescriptor<
    I extends readonly ArtifactKey[] = readonly ArtifactKey[],
    O extends readonly ArtifactKey[] = readonly ArtifactKey[],
> {
    /** Artifact keys consumed by the pass. */
    readonly consumes: I;

    /** Artifact keys produced by the pass. */
    readonly produces: O;
}
