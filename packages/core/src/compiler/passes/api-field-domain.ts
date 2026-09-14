/**
 * api-field-domain.ts
 *
 * Pure Stage Operations for API Field Generation.
 * 0 spread operators, 0 procedural branching.
 *
 * @module compiler/passes
 */

import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedApiFieldArtifact } from '../artifacts/GeneratedApiFieldArtifact';
import type { ArtifactMetadata } from '../artifacts/Artifact';

export interface ExtractedApiField {
    readonly originalName: string;
}

export interface DerivedApiField extends ExtractedApiField {
    readonly derivedKey: string;
}

export interface FieldCollection<TField> {
    readonly fields: readonly TField[];
}

export type ExtractedFieldNames = FieldCollection<string>;
export type UniqueFieldCollection = FieldCollection<string>;
export type GeneratedApiFieldCode = string;

import { streamAllRequestFieldNames, deriveApiFieldKey, projectApiFieldConstants } from '../projectors/ApiFieldProjector';
import { MemoryCodeSink } from '../sink/CodeSink';

export function extractFieldNames(artifact: RequestTypesArtifact): readonly string[] {
    return Array.from(streamAllRequestFieldNames(artifact));
}

export function deduplicateFieldNames(rawNames: readonly string[]): UniqueFieldCollection {
    return {
        fields: Array.from(new Set(rawNames))
    };
}

export { deriveApiFieldKey };

export function formatApiFieldConstant(
    uniqueNames: readonly string[] | UniqueFieldCollection,
    exportConstName = 'ApiApiField'
): GeneratedApiFieldCode {
    const names = Array.isArray(uniqueNames) ? uniqueNames : uniqueNames.fields;
    const sink = new MemoryCodeSink();
    projectApiFieldConstants(names, sink, exportConstName);
    return sink.getCode() + '\n';
}

export function buildApiFieldArtifact(
    code: GeneratedApiFieldCode,
    metadataOrProducer: ArtifactMetadata | string
): GeneratedApiFieldArtifact {
    const metadata: ArtifactMetadata = typeof metadataOrProducer === 'string'
        ? {
            hash: 'api-field-hash',
            producer: metadataOrProducer,
            dependencies: ['RequestTypes'],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
        : metadataOrProducer;

    return {
        typeId: 'GeneratedApiField',
        code,
        metadata
    };
}