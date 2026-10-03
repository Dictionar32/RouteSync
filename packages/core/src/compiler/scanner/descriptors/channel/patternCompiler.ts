/**
 * patternCompiler.ts
 *
 * Compiles Laravel channel route patterns to TypeScript runtime interpolation patterns.
 *
 * @module core/compiler/scanner/descriptors/channel
 */

import type { RouteParameter } from '../../../../types/upstream/route';
import { relationFirst, relationOptionalFold } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';

export function compileBroadcastRuntimePattern(
  pattern: string,
  parameters: readonly RouteParameter[]
): string {
  return pattern.replace(/\{([^}]+)\}/g, (_, pName) => {
    const cleanName = pName.split(':')[0];
    const matched = relationFirst(parameters, p => relationEqual(p.name, cleanName));
    const propName = relationOptionalFold(matched, () => cleanName, p => relationOptionalFold(p.propertyName, () => cleanName, value => value));
    return `\${${propName}}`;
  });
}
