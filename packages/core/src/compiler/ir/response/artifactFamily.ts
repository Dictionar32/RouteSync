/**
 * artifactFamily.ts
 *
 * Sibling analysis artifacts representing Validation, Model, Resource, and Route analysis.
 * Pure IR analysis results without backend generator concerns.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';
import type { ArtifactMetadata } from '../../artifacts/Artifact';
import { TypedArtifact } from '../../artifacts/Artifact';
import type { ModelAttribute, PropertyDescriptor } from './objectSchemas';

/**
 * ValidationArtifact: For FormRequest validation rules
 */
export class ValidationArtifact extends TypedArtifact<'ValidationAnalysis'> {
    public readonly typeId = 'ValidationAnalysis';

    constructor(
        public readonly id: string,
        public readonly rules: Record<string, readonly string[]>,
        public readonly messages: Record<string, string> | undefined,
        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

/**
 * ModelArtifact: For Eloquent model metadata
 */
export class ModelArtifact extends TypedArtifact<'ModelAnalysis'> {
    public readonly typeId = 'ModelAnalysis';

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly table: string,
        public readonly attributes: readonly ModelAttribute[],
        public readonly relationships: readonly RelationshipDescriptor[] | undefined,
        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

/**
 * ResourceArtifact: For Laravel Resource metadata
 */
export class ResourceArtifact extends TypedArtifact<'ResourceAnalysis'> {
    public readonly typeId = 'ResourceAnalysis';

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly model: string | undefined,
        public readonly properties: readonly PropertyDescriptor[],
        public readonly conditionalAttributes: readonly ConditionalAttribute[] | undefined,
        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

/**
 * RouteArtifact: Umbrella artifact combining all analysis
 */
export class RouteArtifact extends TypedArtifact<'RouteAnalysis'> {
    public readonly typeId = 'RouteAnalysis';

    constructor(
        public readonly id: string,
        public readonly method: string,
        public readonly path: string,
        public readonly controller: string,
        public readonly action: string,
        public readonly middleware: readonly string[] | undefined,
        public readonly parameters: readonly RouteParameter[] | undefined,

        /** Reference to ResponseArtifact by ID (not nested!) */
        public readonly responseRef: string | undefined,

        /** Reference to ValidationArtifact by ID */
        public readonly validationRef: string | undefined,

        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

export interface RelationshipDescriptor {
    readonly type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
    readonly related: string;
    readonly foreignKey?: string;
}

export interface ConditionalAttribute {
    readonly condition: string;
    readonly attributes: readonly string[];
}

export interface RouteParameter {
    readonly name: string;
    readonly type: string;
    readonly optional: boolean;
}
