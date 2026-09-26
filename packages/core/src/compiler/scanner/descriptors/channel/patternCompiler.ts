/**
 * patternCompiler.ts
 *
 * Compiles Laravel channel route patterns to TypeScript runtime interpolation patterns.
 *
 * @module core/compiler/scanner/descriptors/channel
 */

import type { RouteParameter } from '../../../../types/upstream/route';

export function compileBroadcastRuntimePattern(
  pattern: string,
  parameters: readonly RouteParameter[]
): string {
  return pattern.replace(/\{([^}]+)\}/g, (_, pName) => {
    const cleanName = pName.split(':')[0];
    const matched = parameters.find(p => p.name === cleanName);
    const propName = matched && matched.propertyName ? matched.propertyName : cleanName;
    return `\${${propName}}`;
  });
}
