/**
 * typeNormalizer.ts
 *
 * Normalizes field types and kinds from ResponseFieldData.
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

import type { ResponseFieldData } from './types';

export function normalizeKind(kind: ResponseFieldData['kind']): 'primitive' | 'object' | 'array' {
  switch (kind) {
    case 'primitive': return 'primitive';
    case 'object': return 'object';
    case 'array': return 'array';
    case 'variable':
    case 'property_access': return 'primitive';
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
  switch (fieldData.kind) {
    case 'primitive':
      return normalizeType(fieldData.type);
    case 'object':
      return 'object';
    case 'array':
      return 'array';
    case 'variable':
    case 'property_access':
      return resolvedType(fieldData.resolved);
  }
}

function resolvedType(resolved: ResponseFieldData['resolved']): string {
  if (resolved === undefined) return 'unknown';
  if (resolved.status === 'unresolved') return 'unknown';
  if (resolved.type !== undefined) return normalizeType(resolved.type);
  return resolved.model;
}

export function isFieldNullable(fieldData: ResponseFieldData): boolean {
  if (fieldData.nullable === true) return true;
  if (fieldData.kind !== 'variable' && fieldData.kind !== 'property_access') return false;
  const resolved = fieldData.resolved;
  return resolved !== undefined && resolved.status === 'resolved' &&
    resolved.type !== undefined && resolved.type.includes('null');
}

export function isFieldOptional(fieldData: ResponseFieldData): boolean {
  return fieldData.optional === true;
}
