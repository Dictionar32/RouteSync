/**
 * enumConstantsBuilder.ts
 *
 * Extracts and formats status Enums and their TypeScript types from RouteManifest.
 *
 * @module cli/generators/constants
 */

import { RouteManifest, ValidationRuleKind } from '@routesync/core';

export function buildEnumsLines(manifest: RouteManifest): string[] {
  const lines: string[] = [];
  const enumGroups: Record<string, Record<string, string[]>> = {};
  const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  const camelCase = (s: string): string => s.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  const addEnum = (group: string, field: string, values: string[]) => {
    const cleanGroup = capitalize(camelCase(group));
    const cleanField = capitalize(camelCase(field));
    if (!enumGroups[cleanGroup]) {
      enumGroups[cleanGroup] = {};
    }
    const existing = enumGroups[cleanGroup][cleanField] || [];
    const merged = Array.from(new Set([...existing, ...values]));
    enumGroups[cleanGroup][cleanField] = merged;
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
          const match = ruleStr.match(/\bin:([a-zA-Z0-9_,-]+)/);
          if (match && match[1]) {
            const values = match[1].split(',').map(v => v.trim());
            addEnum(group, field, values);
          }
        }
      }
    }
  }

  if (Object.keys(enumGroups).length > 0) {
    lines.push(`export const Enums = {`);
    for (const [group, fields] of Object.entries(enumGroups)) {
      lines.push(`  ${group}: {`);
      for (const [field, values] of Object.entries(fields)) {
        lines.push(`    ${field}: {`);
        for (const val of values) {
          const key = val.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          lines.push(`      ${key}: '${val}',`);
        }
        lines.push(`    } as const,`);
      }
      lines.push(`  },`);
    }
    lines.push(`} as const`);
    lines.push(``);

    for (const [group, fields] of Object.entries(enumGroups)) {
      for (const [field, values] of Object.entries(fields)) {
        const typeName = `${group}${field}`;
        lines.push(`export type ${typeName} = (typeof Enums.${group}.${field})[keyof typeof Enums.${group}.${field}]`);
      }
    }
    lines.push(``);
  }

  return lines;
}
