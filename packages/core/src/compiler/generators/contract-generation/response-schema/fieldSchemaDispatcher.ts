/**
 * fieldSchemaDispatcher.ts
 *
 * Dispatches field schema generation to appropriate builder.
 *
 * @module core/compiler/generators/contract-generation/response-schema/fieldSchemaDispatcher
 */

import type { ParsedResponseField } from '../ResponseFieldParser';
import type { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder';
import type { ArraySchemaBuilder } from '../ArraySchemaBuilder';
import { buildPrimitiveSchemaWithModifiers } from './primitiveSchemaBuilder';

export function buildFieldSchema(
    field: ParsedResponseField,
    nestedObjectBuilder: NestedObjectSchemaBuilder,
    arraySchemaBuilder: ArraySchemaBuilder
): string {
    switch (field.kind) {
        case 'primitive':
            return buildPrimitiveSchemaWithModifiers(field);

        case 'object':
            return nestedObjectBuilder.buildObjectSchema(field);

        case 'array':
            return arraySchemaBuilder.buildArraySchema(field);

        default:
            throw new Error(`Unknown field kind: ${(field as any).kind}`);
    }
}

export function buildObjectFromFields(
    fields: readonly ParsedResponseField[],
    nestedObjectBuilder: NestedObjectSchemaBuilder,
    arraySchemaBuilder: ArraySchemaBuilder
): string {
    const properties = fields.map(field => {
        const fieldSchema = buildFieldSchema(field, nestedObjectBuilder, arraySchemaBuilder);
        return `${field.name}: ${fieldSchema}`;
    });

    return `z.object({\n  ${properties.join(',\n  ')}\n})`;
}
