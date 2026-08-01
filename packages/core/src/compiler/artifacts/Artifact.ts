/**
 * Base Artifact Types
 * 
 * Core abstractions for compiler artifacts. An artifact represents
 * a snapshot of compiler state at a particular compilation stage.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactKey, ArtifactRegistry } from './types';

/**
 * Unique brand to ensure type safety of artifacts at runtime
 * @internal
 */
const artifactBrand: unique symbol = Symbol('artifactBrand');

/**
 * Base class for all compiler artifacts.
 * 
 * Artifacts are immutable snapshots of compiler state that flow through
 * the compilation pipeline. Each artifact carries metadata about its
 * producer, dependencies, and versioning information.
 */
export abstract class CompilerArtifact {
    private readonly __brand: typeof artifactBrand = artifactBrand;

    /**
     * Type identifier for this artifact
     */
    public abstract readonly typeId: ArtifactKey;

    /**
     * Metadata about this artifact's provenance and dependencies
     */
    public abstract readonly metadata: ArtifactMetadata;
}

/**
 * Typed artifact with a specific artifact key.
 * 
 * This provides compile-time type safety for artifacts,
 * ensuring that each artifact type is associated with its
 * correct key in the artifact registry.
 */
export abstract class TypedArtifact<K extends ArtifactKey> extends CompilerArtifact {
    public abstract readonly typeId: K;
}

/**
 * Metadata associated with every artifact
 */
export interface ArtifactMetadata {
    /** Content-based hash for change detection */
    readonly hash: string;

    /** Name of the compiler pass that produced this artifact */
    readonly producer: string;

    /** Artifact keys this artifact depends on */
    readonly dependencies: readonly string[];

    /** Unix timestamp when this artifact was created */
    readonly timestamp: number;

    /** Compiler revision identifier */
    readonly revision: string;
}

/**
 * Origin tracking for how an artifact was created
 */
export type ArtifactOriginKind = 'source' | 'pass' | 'cache';

export interface ArtifactOrigin {
    readonly kind: ArtifactOriginKind;
    readonly producerName?: string;
}

/**
 * Represents a dependency edge between artifacts in the compilation graph
 */
export interface ArtifactEdge {
    /** Pass that produces the artifact */
    readonly producer: string;

    /** The artifact being produced */
    readonly artifact: ArtifactKey;

    /** Pass that consumes the artifact */
    readonly consumer: string;
}
