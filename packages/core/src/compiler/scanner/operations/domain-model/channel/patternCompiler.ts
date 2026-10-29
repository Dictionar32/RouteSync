/**
 * patternCompiler.ts
 *
 * Compiles Laravel channel route patterns to TypeScript runtime interpolation patterns.
 *
 * @module core/compiler/scanner/operations/domain-model/channel
 */

import type { RouteParameter } from '../../../../../types/upstream/route';

function compileBroadcastRuntimePatternImplementation(
  pattern: string,
  parameters: readonly RouteParameter[]
): string {
  return pattern.replace(/\{([^}]+)\}/g, (_, pName) => {
    const cleanName = pName.split(':')[0];
    const matched = parameters.find(parameter => parameter.name.value.value === cleanName);
    const propName = matched?.propertyName.value.value ?? cleanName;
    return `\${${propName}}`;
  });
}


export interface BroadcastRuntimePatternCompilerInterface {
  readonly compile: (
    pattern: string,
    parameters: readonly RouteParameter[],
  ) => string;
}

export const broadcastRuntimePatternCompiler:
  BroadcastRuntimePatternCompilerInterface = Object.freeze({
    compile: compileBroadcastRuntimePatternImplementation,
  });
