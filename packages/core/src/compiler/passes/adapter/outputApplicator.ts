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
import { relationFold } from '../../../semantic/foundation/relationalSequence';

export function applyPassOutputs<O extends readonly ArtifactKey[]>(
    state: CompilationState,
    outputKeys: O,
    outputs: ResolveArtifacts<O>
): CompilationState {
    return relationFold(outputKeys, state, (nextState, key, index) =>
        nextState.put(key, tupleAt(outputs, index)),
    );
}
