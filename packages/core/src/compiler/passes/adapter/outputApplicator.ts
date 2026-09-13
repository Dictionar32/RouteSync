/**
 * outputApplicator.ts
 *
 * Applies statically typed output tuples to CompilationState.
 *
 * @module compiler/passes/adapter
 */

import type { ArtifactKey } from '../../artifacts/types';
import type { CompilationState } from '../CompilationState';
import { tupleAt, type ResolveArtifacts } from '../ArtifactKeyWitness';

export function applyPassOutputs<O extends readonly ArtifactKey[]>(
    state: CompilationState,
    outputKeys: O,
    outputs: ResolveArtifacts<O>
): CompilationState {
    let nextState = state;
    for (let i = 0; i < outputKeys.length; i++) {
        const key = outputKeys[i]!;
        const output = tupleAt(outputs, i);
        nextState = nextState.put(key, output);
    }
    return nextState;
}
