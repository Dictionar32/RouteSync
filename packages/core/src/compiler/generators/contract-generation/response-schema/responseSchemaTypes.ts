/**
 * responseSchemaTypes.ts
 *
 * Types and interfaces for response contract and schema mapping.
 *
 * @module core/compiler/generators/contract-generation/response-schema/responseSchemaTypes
 */

import type { ParsedResponseField } from '../ResponseFieldParser';

/**
 * Response type information from manifest
 * Contains full response structure with fields array
 */
export interface ResponseTypeInfo {
    /** Type name (e.g., 'User', 'Order') */
    type: string;

    /** Whether this is a collection response */
    collection: boolean;

    /** Array of response fields with parsed structure */
    fields: Array<{
        name: string;
        kind: 'primitive' | 'object' | 'array';
        type?: string;
        fields?: Array<ParsedResponseField>;
        itemType?: ParsedResponseField;
        nullable?: boolean;
        optional?: boolean;
    }>;
}

/**
 * Route action type
 */
export type RouteAction = 'index' | 'show' | 'store' | 'update' | 'destroy';

/**
 * Response schema for a route action
 */
export interface ActionResponseSchema {
    action: RouteAction;
    schemaName: string;
    zodSchema: string;
    isArray: boolean;
}

/**
 * Complete response schemas for a resource
 */
export interface ResourceResponseSchemas {
    resourceName: string;
    schemas: ActionResponseSchema[];
}
