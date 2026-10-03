/**
 * index.ts
 *
 * Sub-domain exports for response field parsing.
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

export type { ResponseFieldData, ResponseFieldProjection, ResponseFieldProjectionVisitor } from './types';
export { matchResponseFieldProjection } from './types';
export {
  normalizeKind,
  normalizeType,
  extractType,
  isFieldNullable,
  isFieldOptional
} from './typeNormalizer';
export { parseResponseField, parseNestedResponseFields } from './fieldParser';
