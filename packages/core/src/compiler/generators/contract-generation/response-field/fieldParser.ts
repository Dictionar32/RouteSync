import type { ResponseFieldData, ParsedResponseField } from './types';
import { normalizeKind, extractType, isFieldNullable, isFieldOptional } from './typeNormalizer';

export function parseResponseField(fieldName: string, fieldData: ResponseFieldData): ParsedResponseField {
  const kind = normalizeKind(fieldData.kind);
  const parsed: ParsedResponseField = {
    name: fieldName,
    kind,
    type: extractType(fieldData),
    nullable: isFieldNullable(fieldData),
    optional: isFieldOptional(fieldData),
    fields: fieldData.kind === 'object' ? parseNestedResponseFields(fieldData.fields) : [],
    itemType: fieldData.kind === 'array' ? parseResponseField('item', fieldData.itemType) : undefined
  };
  return parsed;
}

export function parseNestedResponseFields(fields: readonly (readonly [string, ResponseFieldData])[]): readonly ParsedResponseField[] {
  return fields.map(([name, data]) => parseResponseField(name, data));
}
