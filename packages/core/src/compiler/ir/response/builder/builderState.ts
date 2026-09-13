/**
 * builderState.ts
 *
 * Mutable builder state and preset applicators for ResponseArtifactBuilder.
 *
 * @module compiler/ir/response/builder
 */

import type { FileSpan } from '../../../types/FileSpan';
import type { ArtifactMetadata } from '../../../artifacts/Artifact';
import type { ResponseDescriptor, ConfidenceScore } from '../responseDescriptors';
import type {
    ResponseBody,
    ResourceBody,
    ModelBody,
    PrimitiveBody,
    ObjectBody
} from '../responseBodies';
import type { ObjectSchema } from '../objectSchemas';
import {
    createResourcePreset,
    createModelPreset,
    createPrimitivePreset,
    createObjectPreset
} from './bodyPresets';

export interface ResponseBuilderState {
    id: string;
    descriptor: ResponseDescriptor;
    body?: ResponseBody;
    confidence: ConfidenceScore;
    span?: FileSpan;
    metadataPartial: Partial<ArtifactMetadata>;
}

export function createInitialBuilderState(): ResponseBuilderState {
    return {
        id: 'UnnamedResponse',
        descriptor: { transport: 'json' },
        confidence: {
            score: 1.0,
            reasons: ['Default confidence'],
            method: 'explicit'
        },
        metadataPartial: {}
    };
}

export function applyResourceToState(
    state: ResponseBuilderState,
    resourceName: string,
    modelName: string | undefined,
    shape: ResourceBody['shape'] = 'single',
    confidenceScore = 1.0,
    confidenceReason = 'Explicit resource return'
): void {
    const preset = createResourcePreset(
        state.descriptor,
        resourceName,
        modelName,
        shape,
        confidenceScore,
        confidenceReason
    );
    state.descriptor = preset.descriptor;
    state.body = preset.body;
    state.confidence = preset.confidence;
}

export function applyModelToState(
    state: ResponseBuilderState,
    modelName: string,
    shape: ModelBody['shape'] = 'single',
    confidenceScore = 0.9,
    confidenceReason = 'Inferred from model return'
): void {
    const preset = createModelPreset(
        state.descriptor,
        modelName,
        shape,
        confidenceScore,
        confidenceReason
    );
    state.descriptor = preset.descriptor;
    state.body = preset.body;
    state.confidence = preset.confidence;
}

export function applyPrimitiveToState(
    state: ResponseBuilderState,
    primitiveType: PrimitiveBody['primitiveType'],
    confidenceScore = 1.0,
    confidenceReason = 'Explicit primitive return'
): void {
    const preset = createPrimitivePreset(
        state.descriptor,
        primitiveType,
        confidenceScore,
        confidenceReason
    );
    state.descriptor = preset.descriptor;
    state.body = preset.body;
    state.confidence = preset.confidence;
}

export function applyObjectToState(
    state: ResponseBuilderState,
    schemaName: string | undefined,
    schema: ObjectSchema,
    shape: ObjectBody['shape'] = 'single',
    confidenceScore = 0.8,
    confidenceReason = 'Heuristic object inference'
): void {
    const preset = createObjectPreset(
        state.descriptor,
        schemaName,
        schema,
        shape,
        confidenceScore,
        confidenceReason
    );
    state.descriptor = preset.descriptor;
    state.body = preset.body;
    state.confidence = preset.confidence;
}
