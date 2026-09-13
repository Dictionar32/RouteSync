/**
 * objectSchemas.ts
 *
 * Schema, property, and model attribute definitions for response structures.
 * Pure IR analysis definitions without backend/generator concerns.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';

export interface ObjectSchema {
    readonly name?: string;
    readonly properties: Record<string, PropertyType>;
    readonly required?: readonly string[];
    readonly additionalProperties?: boolean;
}

export interface PropertyType {
    readonly typeName: string;
    readonly nullable?: boolean;
    readonly isArray?: boolean;
    readonly schema?: ObjectSchema;
    readonly items?: PropertyType;
    readonly reference?: {
        readonly kind: 'model' | 'resource';
        readonly name: string;
    };
}

export interface PropertyDescriptor {
    readonly name: string;
    readonly type: PropertyType;
    readonly description?: string;
    readonly span?: FileSpan;
    readonly confidence?: number;
}

export interface ModelAttribute {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly default?: unknown;
    readonly comment?: string;
}
