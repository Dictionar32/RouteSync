/**
 * PassManager.ts
 *
 * Orchestrates the DAG dependency scheduling and execution of compiler passes.
 * Structured constructor consuming ExecutablePass.
 *
 * @module compiler/passes
 */

import type { ExecutablePass } from './ExecutablePass';
import { PassGraph } from './PassGraph';
import { CompilationContext } from './CompilationContext';
import type { ArtifactKey } from '../artifacts/types';

export interface PassManagerDependencies {
    readonly passes?: readonly ExecutablePass[];
    readonly context?: CompilationContext;
}

export class PassManager {
    public readonly passes: readonly ExecutablePass[];
    public readonly context: CompilationContext;

    constructor({
        passes = Object.freeze([]),
        context = new CompilationContext()
    }: PassManagerDependencies = {}) {
        this.passes = Object.freeze(passes);
        this.context = context;
        Object.freeze(this);
    }

    public getExecutionOrder(externalInputs: readonly ArtifactKey[] = []): readonly ExecutablePass[] {
        return PassGraph.resolve(this.passes, externalInputs);
    }

    public getExecutionLayers(externalInputs: readonly ArtifactKey[] = []): readonly (readonly ExecutablePass[])[] {
        return PassGraph.resolveLayers(this.passes, externalInputs);
    }
}