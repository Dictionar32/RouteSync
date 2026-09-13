/**
 * Response Field Parser
 * 
 * Parses a single response field from manifest into normalized structure.
 * 
 * Responsibility: Parse ONE field only
 * SOC: Only field parsing, no Zod generation
 * SOT: Source is manifest.routes[].response.fields[fieldName]
 */

import {
  type ResponseFieldData,
  type ParsedResponseField,
  parseResponseField
} from './response-field';

export type { ResponseFieldData, ParsedResponseField };

export class ResponseFieldParser {
  public parseField(
    fieldName: string,
    fieldData: ResponseFieldData
  ): ParsedResponseField {
    return parseResponseField(fieldName, fieldData);
  }
}
