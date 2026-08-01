/**
 * PassManager.ts
 * 
 * Orchestrates compiler pass registration and execution.
 * PassManager is the entry point for running the compiler pipeline.
 */

import type { ArtifactKey, ArtifactRegistry } from '../artifacts/types';
import type { CompilerPass } from './CompilerPass';
import type { ExecutablePass } from './ExecutablePass';
import type { CompilationResult } from '../result/CompilationResult';
import { TypedPassAdapter } from './TypedPassAdapter';
import { PassGraph } from './PassGraph';
import { CompilationState } from './CompilationState';
import { CompilationContext } from './CompilationContext';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';

/**
 * PassManager manages pass registration and orchestrates pipeline execution.
 * 
 * Key responsibilities:
 * - Register typed passes (automatically adapts to ExecutablePass)
 * - Resolve pass execution order using PassGraph
 * - Execute passes in topologically-sorted or wave-based order
 * - Provide compilation result
 * 
 * Usage:
 * ```typescript
 * const manager = new PassManager(['AST']);
 * manager.registerPass(parsePass);
 * manager.registerPass(typeCheckPass);
 * manager.registerPass(codeGenPass);
 * const result = await manager.execute('AST', astArtifact);
 * ```
 */
export class PassManager {
    private passes: ExecutablePass[] = [];

    /**
     * Create a PassManager.
     * 
     * @param externalInputs - Artifact keys provided externally (not by passes)
     */
    constructor(
        private readonly externalInputs: readonly ArtifactKey[] = []
    ) { }

    /**
     * Register a typed compiler pass.
     * 
     * The pass is automatically adapted to ExecutablePass and added to the pipeline.
     * After registration, the pass list is re-sorted to maintain topological order.
     * 
     * @param pass - Typed compiler pass to register
     * @template I - Tuple of input artifact keys
     * @template O - Tuple of output artifact keys
     */
    public registerPass<
        I extends readonly ArtifactKey[],
        O extends readonly ArtifactKey[]
    >(pass: CompilerPass<I, O>): void {
        // Adapt typed pass to executable pass
        this.passes.push(new TypedPassAdapter(pass));

        // Re-resolve pass execution order
        this.passes = [...PassGraph.resolve(this.passes, this.externalInputs)];
    }

    /**
     * Execute the compiler pipeline.
     * 
     * Execution strategy:
     * 1. Initialize compilation state with initial input artifact
     * 2. Create default compilation context
     * 3. Resolve passes into parallel execution layers
     * 4. Execute each layer sequentially:
     *    - Within each layer, execute passes concurrently
     *    - Merge results from all passes in the layer
     * 5. Extract and return final CompilationResult artifact
     * 
     * @param key - Artifact key of the initial input
     * @param initialInput - Initial input artifact
     * @returns Promise resolving to compilation result
     * @template K - Type of the initial input artifact key
     */
    public async execute<K extends keyof ArtifactRegistry>(
        key: K,
        initialInput: ArtifactRegistry[K]
    ): Promise<CompilationResult> {
        // Initialize compilation state with initial input
        let state = CompilationState.empty().put(key, initialInput);

        // Create compilation context
        const context = CompilationContext.default();

        // Resolve passes into parallel execution layers
        const layers = PassGraph.resolveLayers(this.passes, this.externalInputs);

        // Execute each layer sequentially
        for (const layer of layers) {
            // Execute passes in layer concurrently
            const nextStates = await Promise.all(
                layer.map(pass => pass.execute(state, context))
            );

            // Merge results from all passes in the layer
            for (const ns of nextStates) {
                state = state.merge(ns);
            }
        }

        // Extract and return final compilation result
        return state.require(new ArtifactKeyWitness('CompilationResult')).result;
    }
}
