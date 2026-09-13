/**
 * typeNormalizer.ts
 *
 * Normalizes field types and kinds from ResponseFieldData.
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

import type { ResponseFieldData } from './types';

export function normalizeKind(kind: string): 'primitive' | 'object' | 'array' {
  switch (kind) {
    case 'primitive': return 'primitive';
    case 'object': return 'object';
    case 'array': return 'array';
    case 'variable':
    case 'property_access':
      return 'primitive';
    default:
      return 'primitive';
  }
}

export function normalizeType(type: string): string {
  const normalized = type.toLowerCase();
  const typeMap: Record<string, string> = {
    int: 'number',
    integer: 'number',
    float: 'number',
    double: 'number',
    bool: 'boolean',
    str: 'string'
  };
  return typeMap[normalized] || type;
}

export function extractType(fieldData: ResponseFieldData): string {
  if (fieldData.type) {
    return normalizeType(fieldData.type);
  }
  if (fieldData.resolved?.type) {
    return normalizeType(fieldData.resolved.type);
  }
  if (fieldData.resolved?.model) {
    return fieldData.resolved.model;
  }
  if (fieldData.kind === 'object') {
    return 'object';
  }
  if (fieldData.kind === 'array') {
    return 'array';
  }
  return 'unknown';
}

export function isFieldNullable(fieldData: ResponseFieldData): boolean {
  if (fieldData.nullable === true) {
    return true;
  }
  if (fieldData.resolved?.type?.includes('null')) {
    return true;
  }
  return false;
}

export function isFieldOptional(fieldData: ResponseFieldData): boolean {
  return fieldData.optional === true;
}
