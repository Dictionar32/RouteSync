/**
 * Registers typed compiler passes, validates their dependency graph, and
 * executes the resulting deterministic pass schedule.
 */
import type { ArtifactKey, ArtifactRegistry, ArtifactStorage } from '../artifacts/types';
import type { ArtifactCache } from '../cache/ArtifactCache';
import type { CompilerPass } from './CompilerPass';
import type { ExecutablePass } from './ExecutablePass';
import type { CompilationResult } from '../result/CompilationResult';
import { TypedPassAdapter } from './TypedPassAdapter';
import { PassGraph } from './PassGraph';
import { CompilationState } from './CompilationState';
import { CompilationContext } from './CompilationContext';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';

export interface PassExecutionOptions {
    readonly context?: CompilationContext;
    readonly cache?: ArtifactCache;
}


function singletonInputs<K extends ArtifactKey>(
    key: K,
    value: ArtifactRegistry[K],
): ArtifactStorage {
    const inputs: ArtifactStorage = {};
    inputs[key] = value;
    return inputs;
}

export class PassManager {
    private passes: ExecutablePass[] = [];

    constructor(private readonly externalInputs: readonly ArtifactKey[] = []) { }

    /** Registers a pass only after the resulting graph validates successfully. */
    public registerPass<
        I extends readonly ArtifactKey[],
        O extends readonly ArtifactKey[]
    >(pass: CompilerPass<I, O>): void {
        const executable = new TypedPassAdapter(pass);
        const candidate = [...this.passes, executable];



        const resolved = PassGraph.resolve(candidate, this.externalInputs);
        this.passes = [...resolved];
    }


    /** Returns the deterministic parallel execution layers. */
    public getExecutionPlan(): readonly (readonly ExecutablePass[])[] {
        return PassGraph.resolveLayers(this.passes, this.externalInputs);
    }


    /** Executes the pipeline starting from one external artifact. */
    public async execute<K extends keyof ArtifactRegistry>(
        key: K,
        initialInput: ArtifactRegistry[K],
        options: PassExecutionOptions = {}
    ): Promise<CompilationResult> {
        return this.executeWithInputs(singletonInputs(key, initialInput), options);
    }


    /** Executes the pipeline with all supplied root artifacts. */
    public async executeWithInputs(
        inputs: ArtifactStorage,
        options: PassExecutionOptions = {}
    ): Promise<CompilationResult> {
        let state = CompilationState.empty();

        for (const key of Object.keys(inputs) as ArtifactKey[]) {
            const value = inputs[key];
            if (value !== undefined) {
                state = state.put(key, value);
            }
        }

        for (const externalKey of this.externalInputs) {
            if (!state.has(externalKey)) {
                throw new Error(`Missing external input artifact: ${externalKey}`);
            }
        }

        const context = options.context ?? CompilationContext.default();
        const layers = this.getExecutionPlan();

        for (const layer of layers) {
            const nextStates = await Promise.all(
                layer.map(pass => pass.execute(state, context, options.cache))
            );

            for (const nextState of nextStates) {
                state = state.merge(nextState);
            }
        }

        return state.require(new ArtifactKeyWitness('CompilationResult')).result;
    }
}
