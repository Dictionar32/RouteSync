/**
 * actionResponseMapper.ts
 *
 * Mappings between route actions and action response schemas.
 *
 * @module core/compiler/generators/contract-generation/response-schema
 */

import type { ParsedResponseField } from '../ResponseFieldParser';
import type { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder';
import type { ArraySchemaBuilder } from '../ArraySchemaBuilder';
import type {
    ResponseTypeInfo,
    RouteAction,
    ActionResponseSchema
} from './responseSchemaTypes';
import { toCamelCase } from './primitiveSchemaBuilder';
import { buildObjectFromFields } from './fieldSchemaDispatcher';

export function generateSchemaName(resourceName: string, action: RouteAction): string {
    const baseName = toCamelCase(resourceName);
    const actionName = action.charAt(0).toUpperCase() + action.slice(1);
    return `${baseName}${actionName}Schema`;
}

export function mapActionResponseToSchema(
    action: RouteAction,
    responseType: ResponseTypeInfo,
    resourceName: string,
    nestedObjectBuilder: NestedObjectSchemaBuilder,
    arraySchemaBuilder: ArraySchemaBuilder
): ActionResponseSchema {
    const fields = responseType.fields as ParsedResponseField[];
    const isArray = action === 'index' || responseType.collection;

    let zodSchema: string;
    if (fields.length === 0) {
        zodSchema = 'z.object({})';
    } else {
        zodSchema = buildObjectFromFields(fields, nestedObjectBuilder, arraySchemaBuilder);
    }

    if (isArray) {
        zodSchema = `z.array(${zodSchema})`;
    }

    const schemaName = generateSchemaName(resourceName, action);

    return {
        action,
        schemaName,
        zodSchema,
        isArray
    };
}
