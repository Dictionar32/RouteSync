import type { FieldPresence, ResponseFieldData, ResponseFieldResolved } from './types';

export function normalizeKind(kind: ResponseFieldData['kind']): 'primitive' | 'object' | 'array' {
  switch (kind) {
    case 'primitive': return 'primitive';
    case 'object': return 'object';
    case 'array': return 'array';
    case 'variable':
    case 'property_access': return 'primitive';
  }
}

const TYPE_MAP: ReadonlyMap<string, string> = new Map([
  ['int', 'number'], ['integer', 'number'], ['float', 'number'], ['double', 'number'],
  ['bool', 'boolean'], ['str', 'string']
]);

export function normalizeType(type: string): string {
  return TYPE_MAP.get(type.toLowerCase()) ?? type;
}

export function extractType(fieldData: ResponseFieldData): string {
  switch (fieldData.kind) {
    case 'primitive': return normalizeType(fieldData.type);
    case 'object': return 'object';
    case 'array': return 'array';
    case 'variable':
    case 'property_access': return resolvedType(fieldData.resolved);
  }
}

function resolvedType(resolved: ResponseFieldResolved): string {
  switch (resolved.kind) {
    case 'reference': return resolved.typeName;
    case 'type': return normalizeType(resolved.typeName);
    case 'unresolved': return 'unknown';
  }
}

export function isFieldNullable(fieldData: ResponseFieldData): boolean {
  return presenceHasNullable(fieldData.presence);
}

export function isFieldOptional(fieldData: ResponseFieldData): boolean {
  return presenceHasOptional(fieldData.presence);
}

function presenceHasNullable(presence: FieldPresence): boolean {
  return presence.kind === 'nullable' || presence.kind === 'optional_nullable';
}

function presenceHasOptional(presence: FieldPresence): boolean {
  return presence.kind === 'optional' || presence.kind === 'optional_nullable';
}
