/**
 * objectSchemas.ts
 *
 * Canonical response-schema contracts.
 * Properties are ordered semantic data, not a string-keyed map.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';
import type {
    ObjectSchemaContract,
    ObjectSchemaPropertyContract,
    PropertyTypeContract,
} from './objectSchemaContracts';

export * from './objectSchemaContracts';

export type ObjectSchema = ObjectSchemaContract;
export type ObjectSchemaProperty = ObjectSchemaPropertyContract;
export type PropertyType = PropertyTypeContract;

export interface PropertyDescriptorContract {
    readonly name: string;
    readonly type: PropertyType;
    readonly description: string;
    readonly span: FileSpan;
    readonly confidence: number;
}

export type PropertyDescriptor = PropertyDescriptorContract;

export interface ModelAttributeContract {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly default: unknown;
    readonly comment: string;
}

export type ModelAttribute = ModelAttributeContract;
