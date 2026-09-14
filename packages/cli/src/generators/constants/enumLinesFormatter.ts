/**
 * enumLinesFormatter.ts
 *
 * Formats enum groups into TypeScript constants and union types.
 *
 * @module cli/generators/constants/enumLinesFormatter
 */

export function formatEnumLines(enumGroups: Record<string, Record<string, string[]>>): string[] {
  const lines: string[] = [];
  if (Object.keys(enumGroups).length === 0) {
    return lines;
  }

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
    for (const [field] of Object.entries(fields)) {
      const typeName = `${group}${field}`;
      lines.push(`export type ${typeName} = (typeof Enums.${group}.${field})[keyof typeof Enums.${group}.${field}]`);
    }
  }
  lines.push(``);

  return lines;
}
