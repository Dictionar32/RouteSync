/**
 * expression/index.ts
 *
 * Explicit Sub-Domain Exports for Semantic Expression Resolution.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module semantic/plugins/expression
 */

export {
    resolveLiteral
} from './literalHandler';

export {
    resolveBinaryExpression
} from './binaryHandler';

export {
    resolveTernary
} from './ternaryHandler';

export {
    resolvePropertyAccess
} from './propertyAccessHandler';
