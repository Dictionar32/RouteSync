/**
 * responseGuards.ts
 *
 * Invariant verifiers and type guards for ResponseArtifact.
 *
 * @module compiler/ir/response
 */

import type { ResponseDescriptor } from './responseDescriptors';
import type { ResponseBody } from './responseBodies';
import type { ResponseArtifact } from './ResponseArtifactClass';

export function isDataResponse(transport: ResponseDescriptor['transport']): boolean {
    return ['resource', 'model', 'json', 'primitive'].includes(transport);
}

export function isBinaryResponse(transport: ResponseDescriptor['transport']): boolean {
    return transport === 'binary';
}

export function isRedirectResponse(transport: ResponseDescriptor['transport']): boolean {
    return transport === 'redirect';
}

export function hasBody(artifact: ResponseArtifact): artifact is ResponseArtifact & { body: ResponseBody } {
    return artifact.body !== undefined;
}

export function isHighConfidence(artifact: ResponseArtifact): boolean {
    return artifact.confidence.score >= 0.8;
}
