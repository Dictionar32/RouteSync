/**
 * fieldParser.ts
 *
 * Recursively parses ResponseFieldData into ParsedResponseField.
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

import type { ResponseFieldData, ParsedResponseField } from './types';
import {
  normalizeKind,
  extractType,
  isFieldNullable,
  isFieldOptional
} from './typeNormalizer';

export function parseResponseField(
  fieldName: string,
  fieldData: ResponseFieldData
): ParsedResponseField {
  const kind = normalizeKind(fieldData.kind);
  const type = extractType(fieldData);

  const parsed: ParsedResponseField = {
    name: fieldName,
    kind,
    type,
    nullable: isFieldNullable(fieldData),
    optional: isFieldOptional(fieldData)
  };

  if (kind === 'object' && fieldData.fields) {
    parsed.fields = parseNestedResponseFields(fieldData.fields);
  }

  if (kind === 'array' && fieldData.itemType) {
    parsed.itemType = parseResponseField('item', fieldData.itemType);
  }

  return parsed;
}

export function parseNestedResponseFields(
  fields: Record<string, ResponseFieldData>
): ParsedResponseField[] {
  return Object.entries(fields).map(([name, data]) => parseResponseField(name, data));
}
