/**
 * types.ts
 *
 * Types for Zod-to-TS IR emission.
 *
 * @module sdk/emitter/zod-converter
 */

export interface TSExportDefinition {
  name: string;
  type: 'interface' | 'function' | 'const' | 'type';
  isDefault?: boolean;
}
