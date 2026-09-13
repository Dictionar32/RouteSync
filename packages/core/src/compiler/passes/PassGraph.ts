/**
 * Validates compiler-pass dependencies and computes deterministic execution
 * order or parallel execution layers.
 */
import type { ArtifactKey } from '../artifacts/types';
import type { ExecutablePass } from './ExecutablePass';
import {
    buildAdjacency,
    resolveTopologicalOrder,
    resolveParallelLayers
} from './graph';

export class PassGraph {
    public static buildAdjacency(
        passes: readonly ExecutablePass[]
    ): Map<ArtifactKey, Set<ExecutablePass>> {
        return buildAdjacency(passes);
    }

    public static resolve(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[] = []
    ): readonly ExecutablePass[] {
        return resolveTopologicalOrder(passes, externalInputs);
    }

    public static resolveLayers(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[] = []
    ): readonly (readonly ExecutablePass[])[] {
        return resolveParallelLayers(passes, externalInputs);
    }
}
