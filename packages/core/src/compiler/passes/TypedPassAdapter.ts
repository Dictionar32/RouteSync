/**
 * TypedPassAdapter
 *
 * Bridges a typed CompilerPass to the runtime ExecutablePass contract.
 * The compiler's ArtifactRegistry/ResolveArtifacts types provide the
 * compile-time relationship between artifact keys and artifact values; this
 * adapter therefore does not perform redundant per-output type assertions.
 * Runtime checks are limited to failures that can occur at the cache/
 * execution boundary.
 *
 * @module compiler/passes
 */
import type { ArtifactKey } from '../artifacts/types';
import type { CompilerPass } from './CompilerPass';
import type { ExecutablePass } from './ExecutablePass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { CompilationState } from './CompilationState';
import type { CompilationContext } from './CompilationContext';
import type { ArtifactCache, CacheDescriptor } from '../cache/ArtifactCache';
import { readArtifacts, tupleAt } from './ArtifactKeyWitness';
import { computeFingerprintHash } from '../fingerprint/Fingerprint';
import type { ResolveArtifacts } from './ArtifactKeyWitness';

/**
 * Adapts a typed pass to the runtime pass interface.
 *
 * The type relationship is carried by `CompilerPass<I, O>`:
 * - `I` resolves through `ArtifactRegistry` to the input tuple.
 * - `O` resolves through `ArtifactRegistry` to the output tuple.
 *
 * The adapter is responsible for runtime concerns only: reading inputs,
 * constructing the cache descriptor, invoking the pass, and committing the
 * typed outputs to the compilation state.
 */
export class TypedPassAdapter<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[]
> implements ExecutablePass {
    constructor(private readonly pass: CompilerPass<I, O>) { }

    public get name(): string {
        return this.pass.name;
    }

    public get descriptor(): PassDescriptor {
        return this.pass.descriptor;
    }

    public get requires(): readonly PassDependency[] {
        return this.pass.requires;
    }

    /**
     * Executes the typed pass.
     *
     * Cache keys are derived from the declared input witnesses and the
     * compiler fingerprint. Cache values retain their static `ResolveArtifacts<O>`
     * type; the cache abstraction is trusted to return the type it was asked
     * to store.
     */
    public async execute(
        state: CompilationState,
        context: CompilationContext,
        cache?: ArtifactCache
    ): Promise<CompilationState> {
        const inputs = readArtifacts(this.pass.inputWitnesses, state);

        let descriptor: CacheDescriptor | undefined;
        if (cache) {
            const fingerprint = context.getFingerprint();
            descriptor = {
                passName: this.name,
                inputs: this.pass.inputWitnesses.map((witness) => {
                    const artifact = witness.read(state);
                    return {
                        artifactKey: witness.key,
                        inputHash: artifact.metadata.hash
                    };
                }),
                compilerVersion: fingerprint.compilerVersion,
                optionsHash: computeFingerprintHash(fingerprint)
            };

            const cachedOutputs = cache.get<ResolveArtifacts<O>>(descriptor);
            if (cachedOutputs !== undefined) {
                return this.applyOutputs(state, cachedOutputs);
            }
        }

        let outputs: ResolveArtifacts<O>;
        try {
            outputs = await this.pass.run(inputs, context);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Compiler pass ${this.name} failed: ${message}`);
        }

        const nextState = this.applyOutputs(state, outputs);

        if (cache && descriptor) {
            cache.set<ResolveArtifacts<O>>(descriptor, outputs);
        }

        return nextState;
    }

    /**
     * Applies the statically typed output tuple to the compilation state.
     *
     * `tupleAt` is the single low-level helper that bridges runtime numeric
     * indexing with the tuple type. The key/value relationship remains owned
     * by `ResolveArtifacts<O>` and `outputKeys`.
     */
    private applyOutputs(
        state: CompilationState,
        outputs: ResolveArtifacts<O>
    ): CompilationState {
        let nextState = state;
        for (let i = 0; i < this.pass.outputKeys.length; i++) {
            const key = this.pass.outputKeys[i]!;
            const output = tupleAt(outputs, i);
            nextState = nextState.put(key, output);
        }
        return nextState;
    }
}