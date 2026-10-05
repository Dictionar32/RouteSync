import type { ResponseFieldData, ResponseFieldProjection } from './types';
import { normalizeKind, extractType, isFieldNullable, isFieldOptional } from './typeNormalizer';
import { relationOptionFold, relationProject, relationVariant } from '../../../../semantic/foundation/relationalSequence';

export function parseResponseField(fieldName: string, fieldData: ResponseFieldData): ResponseFieldProjection {
  const fields = relationOptionFold(
    relationVariant(fieldData, 'object'),
    () => Object.freeze([]),
    objectField => parseNestedResponseFields(objectField.fields),
  );

  const itemType = relationOptionFold(
    relationVariant(fieldData, 'array'),
    () => Object.freeze({ kind: 'none' as const }),
    arrayField => Object.freeze({ kind: 'some' as const, value: parseResponseField('item', arrayField.itemType) }),
  );

  return Object.freeze({
    name: fieldName,
    kind: normalizeKind(fieldData.kind),
    type: extractType(fieldData),
    nullable: isFieldNullable(fieldData),
    optional: isFieldOptional(fieldData),
    fields,
    itemType,
  });
}

export function parseNestedResponseFields(
  fields: readonly (readonly [string, ResponseFieldData])[],
): readonly ResponseFieldProjection[] {
  return relationProject(fields, ([name, data]) => parseResponseField(name, data));
}
