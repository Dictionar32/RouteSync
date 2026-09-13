/**
 * astToZodCode.ts
 *
 * Converts ZodAST nodes to Zod schema code lines and TypeScript type strings.
 *
 * @module sdk/emitter/zod-converter
 */

import type { ZodAST, TSInterface, TSInterfaceField } from '@routesync/core';

export function astToZodCode(ast: ZodAST, depth = 0): string[] {
  const indent = '  '.repeat(depth);
  switch (ast.kind) {
    case 'zod_string': return [`z.string()`];
    case 'zod_number': return [`z.number()`];
    case 'zod_boolean': return [`z.boolean()`];
    case 'zod_unknown': return [`z.unknown()`];
    case 'zod_literal': return [`z.literal(${typeof ast.value === 'string' ? '"' + ast.value + '"' : ast.value})`];
    case 'zod_optional': {
      const inner = astToZodCode(ast.inner, depth)[0];
      return [`${inner}.optional()`];
    }
    case 'zod_array': {
      const el = astToZodCode(ast.element, depth)[0];
      return [`z.array(${el})`];
    }
    case 'zod_union': {
      const opts = ast.options.map(o => astToZodCode(o, depth)[0]).join(', ');
      return [`z.union([${opts}])`];
    }
    case 'zod_object': {
      const lines: string[] = [];
      lines.push(`z.object({`);
      for (const [key, val] of Object.entries(ast.shape)) {
        const valLines = astToZodCode(val, depth + 1);
        if (valLines.length === 1) {
          lines.push(`${indent}  ${key}: ${valLines[0]},`);
        } else {
          lines.push(`${indent}  ${key}: ${valLines[0]}`);
          for (let i = 1; i < valLines.length; i++) {
            lines.push(valLines[i] + (i === valLines.length - 1 ? ',' : ''));
          }
        }
      }
      lines.push(`${indent}})`);
      return lines;
    }
    default:
      return [`z.unknown()`];
  }
}

export function getTsType(ast: ZodAST): string {
  switch (ast.kind) {
    case 'zod_string': return 'string';
    case 'zod_number': return 'number';
    case 'zod_boolean': return 'boolean';
    case 'zod_unknown': return 'unknown';
    case 'zod_literal': return typeof ast.value === 'string' ? `"${ast.value}"` : String(ast.value);
    case 'zod_optional': return getTsType(ast.inner);
    case 'zod_array': return `${getTsType(ast.element)}[]`;
    case 'zod_union': return ast.options.map(o => getTsType(o)).join(' | ');
    case 'zod_object': return 'Record<string, unknown>';
    default: return 'unknown';
  }
}

export function astToInterface(ast: ZodAST, name: string): TSInterface | null {
  if (ast.kind === 'zod_object') {
    const fields: TSInterfaceField[] = [];
    for (const [key, val] of Object.entries(ast.shape)) {
      fields.push({
        name: key,
        type: getTsType(val),
        optional: val.kind === 'zod_optional'
      });
    }
    return {
      name,
      fields,
      isExported: true
    };
  }
  return null;
}
