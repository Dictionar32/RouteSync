/**
 * objectSchemas.ts
 *
 * Schema, property, and model attribute definitions for response structures.
 * Level 7 Complete Contracts. Zero sentinel undefined, zero null.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';

export * from './objectSchemaContracts';

export type PropertyTypeReference = {
    readonly kind: 'model' | 'resource';
    readonly name: string;
};

export type ObjectSchema = {
    readonly name?: string;
    readonly properties: Record<string, PropertyType>;
    readonly required?: readonly string[];
    readonly additionalProperties?: boolean;
};

export type PropertyType = {
    readonly typeName: string;
    readonly nullable?: boolean;
    readonly isArray?: boolean;
    readonly schema?: ObjectSchema;
    readonly items?: PropertyType;
    readonly reference?: PropertyTypeReference;
};

/**
 * Level 7 Complete Contract for PropertyDescriptor (0 undefined, 0 null, 0 ?:).
 */
export interface PropertyDescriptorContract {
    readonly name: string;
    readonly type: PropertyType;
    readonly description: string;
    readonly span: FileSpan;
    readonly confidence: number;
}

export type PropertyDescriptor = {
    readonly name: string;
    readonly type: PropertyType;
    readonly description?: string;
    readonly span?: FileSpan;
    readonly confidence?: number;
};

/**
 * Level 7 Complete Contract for ModelAttribute (0 undefined, 0 null, 0 ?:).
 */
export interface ModelAttributeContract {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly default: unknown;
    readonly comment: string;
}

export type ModelAttribute = {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly default?: unknown;
    readonly comment?: string;
};
