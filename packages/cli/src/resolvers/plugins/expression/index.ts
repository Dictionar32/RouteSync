/**
 * cli/resolvers/plugins/expression/index.ts
 *
 * Explicit Sub-Domain Exports for CLI Expression Resolution.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/resolvers/plugins/expression
 */

export { resolveVariable } from "./variableHandler";
export { resolveLiteral, resolveTypeCast, resolveBinaryOperation } from "./literalHandler";
export { resolvePropertyAccess } from "./propertyAccessHandler";
