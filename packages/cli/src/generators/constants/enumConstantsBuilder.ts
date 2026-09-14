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
      if (!model.columns || !Array.isArray(model.columns)) continue;
      for (const col of model.columns) {
        if (col.enumValues && col.enumValues.length > 0) {
          addEnum(model.name, col.name, [...col.enumValues]);
        } else {
          const type = col.type.toLowerCase();
          const enumMatch = type.match(/^enum\((.*)\)$/);
          if (enumMatch && enumMatch[1]) {
            const values = enumMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ""));
            addEnum(model.name, col.name, values);
          }
        }
      }
    }
  }

  if (manifest.routes && Array.isArray(manifest.routes)) {
    for (const route of manifest.routes) {
      if (!route.schema?.rules) continue;
      const group = route.groupName || 'App';
      if (Array.isArray(route.schema.rules)) {
        for (const ruleEntry of route.schema.rules) {
          const field = ruleEntry.fieldName;
          const inRule = ruleEntry.ast?.find((r: any) => r.kind === ValidationRuleKind.In);
          if (inRule && inRule.kind === ValidationRuleKind.In && inRule.values && inRule.values.length > 0) {
            addEnum(group, field, [...inRule.values]);
          }
        }
      } else {
        const rules = route.schema.rules as Record<string, unknown>;
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
