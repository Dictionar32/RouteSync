/**
 * Request Types Artifact
 * 
 * Input artifact untuk FormGeneratorPass.
 * Berisi validation rules dari manifest.routes[].validation
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import type { SemanticType } from '../types/SemanticType';

/**
 * File-specific Laravel validation metadata retained after type lowering.
 * `max` is converted from Laravel kilobytes to browser `File.size` bytes.
 */
export interface FileValidationConstraints {
    readonly image?: boolean;
    readonly extensions?: readonly string[];
    readonly mimeTypes?: readonly string[];
    readonly maxBytes?: number;
}

/**
 * Field definition dengan validation rules
 */
export interface RequestField {
    /** Original field name dari Laravel (snake_case) */
    readonly originalName: string;

    /** Transformed field name untuk TypeScript (camelCase) */
    readonly transformedName: string;

    /** Semantic type dari validation rules */
    readonly type: SemanticType;

    /** Optional browser-side constraints for a File or an array of File values. */
    readonly fileConstraints?: FileValidationConstraints;

    /** Is this field required? */
    readonly required: boolean;

    /** Is this field nullable? */
    readonly nullable: boolean;
}

/**
 * Form action (create atau update)
 */
export interface FormAction {
    /** Action name (create, update) */
    readonly name: 'create' | 'update';

    /** Fields untuk action ini */
    readonly fields: readonly RequestField[];
}

/**
 * Request type untuk specific resource
 */
export interface RequestType {
    /** Resource name (e.g., 'CartItems') */
    readonly resourceName: string;

    /** Form type name (e.g., 'CartItemsForm') */
    readonly formTypeName: string;

    /** Available actions */
    readonly actions: readonly FormAction[];

    /**
     * Response data structure (OPTIONAL - for contracts only)
     * 
     * Used by ContractGeneratorPass to generate response validation.
     * Ignored by FormGeneratorPass.
     * 
     * Fields are flattened + camelCase (consistent with frontend model).
     */
    readonly responseData?: {
        /** Resource name that provides response structure */
        readonly resourceName: string;
        /** Response body fields (flattened + camelCase) */
        readonly fields: Record<string, SemanticType>;
    };
}

/**
 * Request Types artifact
 * 
 * Input untuk FormGeneratorPass.
 * Extracted dari manifest.routes[].validation dan digroup by resource.
 */
export interface RequestTypesArtifact {
    /** Artifact type ID */
    readonly typeId: 'RequestTypes';

    /** Standard artifact metadata */
    readonly metadata: ArtifactMetadata;

    /** Array of request types to generate */
    readonly requestTypes: readonly RequestType[];
}

/**
 * Type guard untuk RequestTypesArtifact
 */
export function isRequestTypesArtifact(
    artifact: unknown
): artifact is RequestTypesArtifact {
    if (typeof artifact !== 'object' || artifact === null) {
        return false;
    }

    const a = artifact as Partial<RequestTypesArtifact>;

    return (
        a.typeId === 'RequestTypes' &&
        Array.isArray(a.requestTypes) &&
        typeof a.metadata === 'object' &&
        a.metadata !== null
    );
}
