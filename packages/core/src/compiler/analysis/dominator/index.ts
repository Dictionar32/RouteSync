/**
 * dominator/index.ts
 *
 * Explicit named exports for Dominance and Dominator Tree analysis.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/analysis/dominator
 */

export { computeRPO } from './dominatorRpo';
export { intersectDominators } from './dominatorIntersect';
export { DominatorTree } from './dominatorTree';
export { DominanceFrontier } from './dominanceFrontier';
