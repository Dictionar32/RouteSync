/**
 * Relation-oriented adapter from typed compiler passes to the executable-pass
 * boundary. The adapter itself is an immutable witness object, not a class.
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
import { validatePassContract, applyPassOutputs, createPassCacheDescriptor } from './adapter';
import { relationOptionFold, relationResolve, relationSome, relationNone, relationEqual } from '../../semantic/kernel/relationalSequence';
import { compilerPassFailureMessage, compilerPassFailureOf } from '../../types/upstream/compilerPassFailure';

export type TypedPassAdapter<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[],
> = ExecutablePass & Readonly<{
    readonly typedPass: CompilerPass<I, O>;
}>;

export const createTypedPassAdapter = <
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[],
>(pass: CompilerPass<I, O>): TypedPassAdapter<I, O> => {
    validatePassContract(pass);
    const adapter: TypedPassAdapter<I, O> = {
        typedPass: pass,
        name: pass.name,
        descriptor: pass.descriptor,
        requires: pass.requires,
        execute: async (state, context, cache) => {
            const inputs = readArtifacts(pass.inputWitnesses, state);
            const cacheOption = relationResolve(
                Boolean(cache),
                () => relationSome(createPassCacheDescriptor(pass, state, context)),
                () => relationNone<ReturnType<typeof createPassCacheDescriptor>>(),
            );
            return relationOptionFold(
                cacheOption,
                () => runPass(pass, inputs, state, context),
                async descriptor => relationResolve(
                    Boolean(cache),
                    async () => {
                        const cacheValue = (cache as ArtifactCache).get<ResolveArtifacts<O>>(descriptor);
                        return relationResolve(
                            relationEqual(Boolean(cacheValue), true),
                            () => applyPassOutputs(state, pass.outputKeys, cacheValue as ResolveArtifacts<O>),
                            async () => runPassWithCache(pass, inputs, state, context, cache as ArtifactCache, descriptor),
                        );
                    },
                    async () => runPass(pass, inputs, state, context),
                ),
            );
        },
    };
    return Object.freeze(adapter);
};

const runPass = async <I extends readonly ArtifactKey[], O extends readonly ArtifactKey[]>(
    pass: CompilerPass<I, O>,
    inputs: ResolveArtifacts<I>,
    state: CompilationState,
    context: CompilationContext,
): Promise<CompilationState> => {
    try {
        const outputs = await pass.run(inputs, context);
        return applyPassOutputs(state, pass.outputKeys, outputs);
    } catch (error) {
        const failure = compilerPassFailureOf(error);
        const message = compilerPassFailureMessage(failure);
        throw Error(`Compiler pass ${pass.name} failed: ${message}`);
    }
};

const runPassWithCache = async <I extends readonly ArtifactKey[], O extends readonly ArtifactKey[]>(
    pass: CompilerPass<I, O>,
    inputs: ResolveArtifacts<I>,
    state: CompilationState,
    context: CompilationContext,
    cache: ArtifactCache,
    descriptor: ReturnType<typeof createPassCacheDescriptor>,
): Promise<CompilationState> => {
    try {
        const outputs = await pass.run(inputs, context);
        cache.set<ResolveArtifacts<O>>(descriptor, outputs);
        return applyPassOutputs(state, pass.outputKeys, outputs);
    } catch (error) {
        const failure = compilerPassFailureOf(error);
        const message = compilerPassFailureMessage(failure);
        throw Error(`Compiler pass ${pass.name} failed: ${message}`);
    }
};
