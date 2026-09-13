/**
 * types.ts
 *
 * Types for response field parsing.
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

export interface ResponseFieldData {
  kind: 'primitive' | 'object' | 'array' | 'variable' | 'property_access';
  type?: string;
  fields?: Record<string, ResponseFieldData>;
  itemType?: ResponseFieldData;
  nullable?: boolean;
  optional?: boolean;
  resolved?: {
    status: string;
    type?: string;
    model?: string;
    confidence?: number;
  };
}

export interface ParsedResponseField {
  name: string;
  kind: 'primitive' | 'object' | 'array';
  type: string;
  nullable: boolean;
  optional: boolean;
  fields?: readonly ParsedResponseField[];
  itemType?: ParsedResponseField;
}
