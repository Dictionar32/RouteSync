import type { FieldPresence, ResponseFieldData, ResponseFieldResolved } from './types';
import { RESPONSE_FIELD_NORMALIZATION_RULES, RESPONSE_RESOLVED_TYPE_RULES, resolveLoweringOperation } from '../../../ir/semanticIRLoweringRelations';

const TYPE_MAP: ReadonlyMap<string, string> = new Map([
  ['int', 'number'], ['integer', 'number'], ['float', 'number'], ['double', 'number'],
  ['bool', 'boolean'], ['str', 'string'],
]);

export function normalizeKind(kind: ResponseFieldData['kind']): 'primitive' | 'object' | 'array' {
  return resolveLoweringOperation(kind, RESPONSE_FIELD_NORMALIZATION_RULES) as 'primitive' | 'object' | 'array';
}

export function normalizeType(type: string): string {
  return TYPE_MAP.get(type.toLowerCase()) ?? type;
}

export function extractType(fieldData: ResponseFieldData): string {
  const operation = resolveLoweringOperation(fieldData.kind, RESPONSE_FIELD_NORMALIZATION_RULES);
  const handlers: Record<string, () => string> = {
    primitive: () => normalizeType((fieldData as Extract<ResponseFieldData, { kind: 'primitive' }>).type),
    object: () => 'object',
    array: () => 'array',
  };
  const direct = handlers[operation];
  return direct
    ? direct()
    : resolvedType((fieldData as Extract<ResponseFieldData, { kind: 'variable' }> | Extract<ResponseFieldData, { kind: 'property_access' }>).resolved);
}

function resolvedType(resolved: ResponseFieldResolved): string {
  const operation = resolveLoweringOperation(resolved.kind, RESPONSE_RESOLVED_TYPE_RULES);
  const handlers: Record<string, () => string> = {
    reference: () => (resolved as Extract<ResponseFieldResolved, { kind: 'reference' }>).typeName,
    type: () => normalizeType((resolved as Extract<ResponseFieldResolved, { kind: 'type' }>).typeName),
    unresolved: () => 'unknown',
  };
  const handler = handlers[operation];
  return (handler ?? (() => { throw new Error(`No resolved response-field type handler for ${operation}`); }))();
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
