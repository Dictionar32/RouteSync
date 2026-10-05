/**
 * enumConstantsBuilder.ts
 *
 * Extracts and formats status Enums and their TypeScript types from RouteManifest.
 * Active Consumer orchestrating enum extraction and formatting.
 *
 * @module cli/generators/constants
 */

import {
  RouteManifest,
  ValidationRuleKind,
  ValidationRuleParser,
  toCamelCase,
  capitalize
} from '@routesync/core';
import { formatEnumLines } from './enumLinesFormatter';

const sequenceToArray = <T>(sequence: { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: typeof sequence }): readonly T[] =>
  sequence.kind === 'empty' ? [] : [sequence.head, ...sequenceToArray(sequence.tail)];

export function buildEnumsLines(manifest: RouteManifest): string[] {
  const enumGroups: Record<string, Record<string, string[]>> = {};

  const addEnum = (group: string, field: string, values: string[]) => {
    const cleanGroup = capitalize(toCamelCase(group));
    const cleanField = capitalize(toCamelCase(field));
    if (!enumGroups[cleanGroup]) {
      enumGroups[cleanGroup] = {};
    }
    const existing = enumGroups[cleanGroup][cleanField] || [];
    enumGroups[cleanGroup][cleanField] = Array.from(new Set([...existing, ...values]));
  };

  if (manifest.models && Array.isArray(manifest.models)) {
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
  }

  if (manifest.routes && Array.isArray(manifest.routes)) {
    for (const route of manifest.routes) {
      const schema = route.contract.request.body.kind === 'body' ? route.contract.request.body.schema : route.binding.schema;
      if (!schema?.rules) continue;
      const group = route.identity.domain.group.value.value || 'App';
      if (Array.isArray(schema.rules)) {
        for (const ruleEntry of schema.rules) {
          const field = ruleEntry.fieldName;
          const inRule = ruleEntry.ast?.find((r: any) => r.kind === ValidationRuleKind.In);
          if (inRule && inRule.kind === ValidationRuleKind.In && inRule.values && inRule.values.length > 0) {
            addEnum(group, field, [...inRule.values]);
          }
        }
      } else {
        const rules = schema.rules as Record<string, unknown>;
        for (const [field, ruleVal] of Object.entries(rules)) {
          const ruleStr = String(ruleVal);
          const astNodes = ValidationRuleParser.parseAll(ruleStr.split('|'));
          const inRule = astNodes.find(r => r.kind === ValidationRuleKind.In);
          if (inRule && inRule.kind === ValidationRuleKind.In && inRule.values && inRule.values.length > 0) {
            addEnum(group, field, [...inRule.values]);
          }
        }
      }
    }
  }

  return formatEnumLines(enumGroups);
}
