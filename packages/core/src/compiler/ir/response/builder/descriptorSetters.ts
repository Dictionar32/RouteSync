/**
 * descriptorSetters.ts
 *
 * State mutators for response descriptor and confidence properties.
 *
 * @module compiler/ir/response/builder
 */

import type { ResponseDescriptor, ConfidenceScore } from '../responseDescriptors';
import type { ResponseBuilderState } from './builderState';

export function setTransport(state: ResponseBuilderState, type: ResponseDescriptor['transport']): void {
    state.descriptor = { ...state.descriptor, transport: type };
}

export function setStatus(state: ResponseBuilderState, code: number): void {
    state.descriptor = { ...state.descriptor, status: code };
}

export function setContentType(state: ResponseBuilderState, type: string): void {
    state.descriptor = { ...state.descriptor, contentType: type };
}

export function setContentDisposition(state: ResponseBuilderState, type: 'inline' | 'attachment', filename?: string): void {
    state.descriptor = { ...state.descriptor, contentDisposition: { type, filename } };
}

export function setNullable(state: ResponseBuilderState, value = true): void {
    state.descriptor = { ...state.descriptor, nullable: value };
}

export function setConfidenceScore(
    state: ResponseBuilderState,
    score: number,
    reason: string,
    method: ConfidenceScore['method'] = 'inferred'
): void {
    state.confidence = {
        score: Math.max(0, Math.min(1, score)),
        reasons: [reason],
        method
    };
}
