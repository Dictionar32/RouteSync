/**
 * steps/index.ts
 *
 * Explicit named exports for TypeScript formatting steps.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/formatting/steps
 */

export {
    normalizeLineEndings,
    normalizeQuotes,
    handleSemicolons,
    addTrailingCommas,
    applyLineLength,
    cleanupWhitespace
} from './syntaxNormalizer';

export { sortImports } from './importSorter';
export { applyIndentation } from './indentationApplier';
