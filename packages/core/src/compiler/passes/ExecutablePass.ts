/**
 * ExecutablePass.ts
 * 
 * Defines the interface for executable compiler passes.
 * ExecutablePass is the runtime representation of a pass that can be executed
 * by the PassManager. It provides a uniform interface regardless of the underlying
 * pass implementation (typed vs untyped).
 */

import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { CompilationState } from './CompilationState';
import type { CompilationContext } from './CompilationContext';
import type { ArtifactCache } from '../cache/ArtifactCache';

/**
 * ExecutablePass interface.
 * 
 * A pass that can be executed by the PassManager. Each pass has:
 * - name: unique identifier for the pass
 * - descriptor: declares input/output artifacts
 * - requires: declares dependencies on other passes
 * - execute: performs the actual transformation
 * 
 * ExecutablePass instances are typically created by wrapping typed CompilerPass
 * instances with TypedPassAdapter, which handles artifact marshalling and caching.
 */
export interface ExecutablePass {
    /**
     * Unique name identifying this pass.
     * Must be unique across all registered passes.
     */
    readonly name: string;

    /**
     * Pass descriptor declaring consumed and produced artifacts.
     */
    readonly descriptor: PassDescriptor;

    /**
     * Pass dependencies.
     * Declares which artifacts this pass requires and which passes must
     * execute before this pass.
     */
    readonly requires: readonly PassDependency[];

    /**
     * Execute the pass.
     * 
     * @param state - Current compilation state containing input artifacts
     * @param context - Compilation context (diagnostics, options, etc.)
     * @param cache - Optional artifact cache for incremental compilation
     * @returns Promise resolving to updated compilation state with output artifacts
     */
    execute(
        state: CompilationState,
        context: CompilationContext,
        cache?: ArtifactCache
    ): Promise<CompilationState>;
}
