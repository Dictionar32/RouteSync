/**
 * Compiler Pass Interface
 * 
 * Defines a typed compiler pass that transforms artifacts.
 * Passes are composed into a pipeline for multi-stage compilation.
 * 
 * @module compiler/passes
 */

import type { ArtifactKey, ArtifactRegistry } from '../artifacts/types';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { ArtifactKeyWitness, ResolveArtifacts } from './ArtifactKeyWitness';
import type { CompilationContext } from './CompilationContext';

/**
 * Typed compiler pass interface
 * 
 * @template I - Tuple of input artifact keys
 * @template O - Tuple of output artifact keys
 */
export interface CompilerPass<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[]
> {
    /** Unique name for this pass */
    readonly name: string;

    /** Type witnesses for input artifacts */
    readonly inputWitnesses: { [K in keyof I]: ArtifactKeyWitness<I[K]> };

    /** Output artifact keys this pass produces */
    readonly outputKeys: O;

    /** Pass descriptor for dependency resolution */
    readonly descriptor: PassDescriptor;

    /** Specific artifact dependencies */
    readonly requires: readonly PassDependency[];

    /** Names of passes this produces (for ordering) */
    readonly producesPass: readonly string[];

    /**
     * Execute the pass transformation
     * 
     * @param inputs - Tuple of input artifacts
     * @param context - Compilation context
     * @returns Tuple of output artifacts
     */
    run(
        inputs: ResolveArtifacts<I>,
        context: CompilationContext
    ): ResolveArtifacts<O> | Promise<ResolveArtifacts<O>>;
}
