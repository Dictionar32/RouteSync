/**
 * fieldSchemaDispatcher.ts
 *
 * Dispatches field schema generation to appropriate builder.
 *
 * @module core/compiler/generators/contract-generation/response-schema/fieldSchemaDispatcher
 */

import { matchResponseFieldProjection, type ResponseFieldProjection } from '../response-field';
import { relationProject } from '../../../../semantic/foundation/relationalSequence';
import type { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder';
import type { ArraySchemaBuilder } from '../ArraySchemaBuilder';
import { buildPrimitiveSchemaWithModifiers } from './primitiveSchemaBuilder';

export function buildFieldSchema(
  field: ResponseFieldProjection,
  nestedObjectBuilder: NestedObjectSchemaBuilder,
  arraySchemaBuilder: ArraySchemaBuilder
): string {
  return matchResponseFieldProjection(field, {
    primitive: value => buildPrimitiveSchemaWithModifiers(value),
    object: value => nestedObjectBuilder.buildObjectSchema(value),
    array: value => arraySchemaBuilder.buildArraySchema(value),
  });
}

export function buildObjectFromFields(
    fields: readonly ResponseFieldProjection[],
    nestedObjectBuilder: NestedObjectSchemaBuilder,
    arraySchemaBuilder: ArraySchemaBuilder
): string {
    const properties = relationProject(fields, field => {
        const fieldSchema = buildFieldSchema(field, nestedObjectBuilder, arraySchemaBuilder);
        return `${field.name}: ${fieldSchema}`;
    });

    return `z.object({\n  ${properties.join(',\n  ')}\n})`;
}
