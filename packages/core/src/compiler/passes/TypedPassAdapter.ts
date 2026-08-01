/**
 * TypedPassAdapter.ts
 * 
 * Adapts a typed CompilerPass to the ExecutablePass interface.
 * Handles artifact marshalling, caching, and type-safe input/output management.
 */

import type { ArtifactKey } from '../artifacts/types';
import type { CompilerPass } from './CompilerPass';
import type { ExecutablePass } from './ExecutablePass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { CompilationState } from './CompilationState';
import type { CompilationContext } from './CompilationContext';
import type { ArtifactCache, CacheDescriptor } from '../cache/ArtifactCache';
import type { CompilerArtifact } from '../artifacts/Artifact';
import { readArtifacts, tupleAt } from './ArtifactKeyWitness';
import { computeFingerprintHash } from '../fingerprint/Fingerprint';

/**
 * TypedPassAdapter wraps a typed CompilerPass and adapts it to ExecutablePass.
 * 
 * Key responsibilities:
 * - Marshalls artifacts from CompilationState to typed inputs
 * - Executes the underlying typed pass
 * - Updates CompilationState with typed outputs
 * - Implements caching logic for incremental compilation
 * 
 * @template I - Tuple of input artifact keys
 * @template O - Tuple of output artifact keys
 */
export class TypedPassAdapter<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[]
> implements ExecutablePass {
    constructor(private readonly pass: CompilerPass<I, O>) { }

    /**
     * Pass name from underlying typed pass.
     */
    public get name(): string {
        return this.pass.name;
    }

    /**
     * Pass descriptor from underlying typed pass.
     */
    public get descriptor(): PassDescriptor {
        return this.pass.descriptor;
    }

    /**
     * Pass dependencies from underlying typed pass.
     */
    public get requires(): readonly PassDependency[] {
        return this.pass.requires;
    }

    /**
     * Execute the adapted pass.
     * 
     * Implementation:
     * 1. Marshall input artifacts using witnesses
     * 2. Check cache if enabled
     * 3. Execute underlying typed pass
     * 4. Apply outputs to compilation state
     * 5. Store outputs in cache if enabled
     * 
     * @param state - Current compilation state
     * @param context - Compilation context
     * @param cache - Optional artifact cache
     * @returns Updated compilation state
     */
    public async execute(
        state: CompilationState,
        context: CompilationContext,
        cache?: ArtifactCache
    ): Promise<CompilationState> {
        // Marshall inputs using typed witnesses
        const inputs = readArtifacts(this.pass.inputWitnesses, state);

        // Cast for cache descriptor construction
        const inputsArray = inputs as readonly CompilerArtifact[];
        const witnesses = this.pass.inputWitnesses as readonly any[];

        // Build cache descriptor if caching is enabled
        let descriptor: CacheDescriptor | undefined;
        if (cache) {
            const fingerprint = context.getFingerprint();
            descriptor = {
                passName: this.name,
                inputs: witnesses.map((w, index) => ({
                    artifactKey: w.key,
                    inputHash: inputsArray[index]!.metadata.hash
                })),
                compilerVersion: fingerprint.compilerVersion,
                optionsHash: computeFingerprintHash(fingerprint)
            };

            // Check cache for existing outputs
            const cachedOutputs = cache.get<any>(descriptor);
            if (cachedOutputs) {
                return this.applyOutputs(state, cachedOutputs);
            }
        }

        // Execute underlying typed pass
        const outputs = await this.pass.run(inputs, context);

        // Apply outputs to state
        const nextState = this.applyOutputs(state, outputs);

        // Store outputs in cache if enabled
        if (cache && descriptor) {
            cache.set<any>(descriptor, outputs);
        }

        return nextState;
    }

    /**
     * Apply typed outputs to compilation state.
     * 
     * Iterates through output keys and uses tupleAt to safely extract
     * the corresponding output artifact at each index.
     * 
     * @param state - Current compilation state
     * @param outputs - Typed outputs from pass execution
     * @returns Updated compilation state with outputs
     */
    private applyOutputs(state: CompilationState, outputs: any): CompilationState {
        let nextState = state;
        for (let i = 0; i < this.pass.outputKeys.length; i++) {
            const key = this.pass.outputKeys[i]!;
            nextState = nextState.put(key, tupleAt(outputs, i));
        }
        return nextState;
    }
}
