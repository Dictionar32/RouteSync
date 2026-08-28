/**
 * ArtifactContract.ts
 *
 * Shared generic Artifact contract & type guard helpers for cross-flow usage.
 *
 * Provides structural contract for compiler output artifacts:
 *   - GeneratedApiField: Artifact<'GeneratedApiField', { code: string }>
 *   - GeneratedContract: Artifact<'GeneratedContract', { code: string }>
 *   - GeneratedForm: Artifact<'GeneratedForm', { code: string }>
 *   - GeneratedMapper: Artifact<'GeneratedMapper', { code: string }>
 *   - GeneratedApiRead: Artifact<'GeneratedApiRead', { code: string }>
 *
 * @module compiler/domain/common
 */

/**
 * Standard artifact metadata contract
 */
export interface ArtifactMetadata {
    readonly hash: string;
    readonly producer: string;
    readonly dependencies: readonly string[];
    readonly timestamp: number;
    readonly revision: string;
}

/**
 * Shared generic Artifact contract
 */
export interface Artifact<TKind extends string, TData> {
    readonly typeId: TKind;
    readonly data: TData;
    readonly metadata: ArtifactMetadata;
}

/**
 * Factory helper to construct strongly-typed Artifact instances
 *
 * @param typeId - Discriminated union type identifier string
 * @param data - Payload data
 * @param metadata - Artifact metadata
 * @returns Artifact<TKind, TData>
 */
export function createArtifact<TKind extends string, TData>(
    typeId: TKind,
    data: TData,
    metadata: ArtifactMetadata
): Artifact<TKind, TData> {
    return {
        typeId,
        data,
        metadata
    };
}

/**
 * Type guard helper to narrow artifact types by typeId across compiler passes
 *
 * @param artifact - Any Artifact instance
 * @param kind - Target typeId kind string
 * @returns True if artifact matches target kind
 */
export function isArtifactOfKind<TTargetKind extends string, TData>(
    artifact: Artifact<string, TData>,
    kind: TTargetKind
): artifact is Artifact<TTargetKind, TData> {
    return artifact.typeId === kind;
}
