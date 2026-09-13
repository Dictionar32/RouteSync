/**
 * Type system sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export { computeJoin, computeMeet } from './typeLattice';
export { checkSubtype } from './subtypingChecker';
export { checkAssignable } from './assignabilityChecker';
