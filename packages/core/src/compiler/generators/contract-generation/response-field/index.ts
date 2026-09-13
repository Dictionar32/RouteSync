/**
 * index.ts
 *
 * Sub-domain exports for response field parsing.
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

export type { ResponseFieldData, ParsedResponseField } from './types';
export {
  normalizeKind,
  normalizeType,
  extractType,
  isFieldNullable,
  isFieldOptional
} from './typeNormalizer';
export { parseResponseField, parseNestedResponseFields } from './fieldParser';
