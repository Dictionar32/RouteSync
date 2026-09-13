/**
 * TypedPassAdapter
 *
 * Active Consumer: Bridges a typed CompilerPass to the runtime ExecutablePass contract.
 * Coordinates contract validation, cache lookup/storage, and output application.
 *
 * @module compiler/passes/TypedPassAdapter
 */

import type { ArtifactKey } from '../artifacts/types';
import type { CompilerPass } from './CompilerPass';
import type { ExecutablePass } from './ExecutablePass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { CompilationState } from './CompilationState';
import type { CompilationContext } from './CompilationContext';
import type { ArtifactCache } from '../cache/ArtifactCache';
import { readArtifacts } from './ArtifactKeyWitness';
import type { ResolveArtifacts } from './ArtifactKeyWitness';
import {
    validatePassContract,
    applyPassOutputs,
    createPassCacheDescriptor
} from './adapter';

export class TypedPassAdapter<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[]
> implements ExecutablePass {
    constructor(private readonly pass: CompilerPass<I, O>) {
        validatePassContract(this.pass);
    }

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
     * Executes the typed pass with optional caching.
     */
    public async execute(
        state: CompilationState,
        context: CompilationContext,
        cache?: ArtifactCache
    ): Promise<CompilationState> {
        const inputs = readArtifacts(this.pass.inputWitnesses, state);

        const descriptor = cache ? createPassCacheDescriptor(this.pass, state, context) : undefined;
        if (cache && descriptor) {
            const cachedOutputs = cache.get<ResolveArtifacts<O>>(descriptor);
            if (cachedOutputs !== undefined) {
                return applyPassOutputs(state, this.pass.outputKeys, cachedOutputs);
            }
        }

        let outputs: ResolveArtifacts<O>;
        try {
            outputs = await this.pass.run(inputs, context);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Compiler pass ${this.name} failed: ${message}`);
        }

        const nextState = applyPassOutputs(state, this.pass.outputKeys, outputs);

        if (cache && descriptor) {
            cache.set<ResolveArtifacts<O>>(descriptor, outputs);
        }

        return nextState;
    }
}
