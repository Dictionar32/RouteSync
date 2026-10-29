/**
 * enumConstantsBuilder.ts
 *
 * Projects canonical model enum declarations and canonical request validation
 * ADTs into generated enum constants. This layer does not parse Laravel rule
 * strings or reconstruct validation semantics from legacy manifest payloads.
 *
 * @module cli/generators/constants
 */

import {
  type RouteManifest,
  ValidationRuleKind,
  toCamelCase,
  capitalize,
  type RouteSchemaPayload,
} from '@routesync/core';
import { formatEnumLines } from './enumLinesFormatter';

const sequenceToArray = <T>(sequence: { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: typeof sequence }): readonly T[] =>
  sequence.kind === 'empty' ? [] : [sequence.head, ...sequenceToArray(sequence.tail)];

type AddEnum = (group: string, field: string, values: readonly string[]) => void;

function projectValidationEnums(schema: RouteSchemaPayload, group: string, addEnum: AddEnum): void {
  for (const field of schema.fields) {
    const inRule = field.validation.find(rule => rule.kind === ValidationRuleKind.In);
    if (inRule?.kind === ValidationRuleKind.In && inRule.values.length > 0) {
      addEnum(group, field.name.value, inRule.values.map(value => value.value));
    }
  }
}

export interface BuildEnumsLinesOperation {
  (manifest: RouteManifest): string[];
}

export const buildEnumsLines: BuildEnumsLinesOperation = Object.freeze((manifest: RouteManifest): string[] => {
  const enumGroups: Record<string, Record<string, string[]>> = {};

  const addEnum: AddEnum = (group, field, values) => {
    const cleanGroup = capitalize(toCamelCase(group));
    const cleanField = capitalize(toCamelCase(field));
    if (!enumGroups[cleanGroup]) {
      enumGroups[cleanGroup] = {};
    }
    const existing = enumGroups[cleanGroup][cleanField] || [];
    enumGroups[cleanGroup][cleanField] = Array.from(new Set([...existing, ...values]));
  };

  for (const model of manifest.models) {
    const properties = model.definition.semantic.surface.properties;
    for (const property of sequenceToArray(properties)) {
      if (property.kind !== 'column' || property.databaseType.kind !== 'enum') continue;
      addEnum(
        model.definition.semantic.identity.name.value.value,
        property.property.value.value,
        property.databaseType.values.items.map(value => value.value),
      );
    }
  }

  for (const route of manifest.routes) {
    const schema = route.contract.request.body.kind === 'body'
      ? route.contract.request.body.schema
      : route.binding.schema;
    const group = route.identity.domain.group.value.value || 'App';
    projectValidationEnums(schema, group, addEnum);
  }

  return formatEnumLines(enumGroups);
});
