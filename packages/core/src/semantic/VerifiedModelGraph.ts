/** Closed model graph boundary. */
import type { ModelNode, ModelNodeInput } from './modelNodes';
import { verifyModelNode } from './modelNodes';

export interface ModelGraphInput {
    readonly models: readonly ModelNodeInput[];
}

export interface VerifiedModelGraph {
    readonly models: readonly ModelNode[];
}

export function verifyModelGraph(input: ModelGraphInput): VerifiedModelGraph {
    return Object.freeze({
        models: Object.freeze(input.models.map(verifyModelNode)),
    });
}
