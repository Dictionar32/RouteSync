/**
 * Loop Analysis Subdomain Index.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/analysis/loop
 */

export type { LoopInfo } from './loopTypes';
export {
    getNaturalLoopBlocks,
    detectNaturalLoops
} from './loopDetector';
export { LoopNormalizer } from './loopNormalizer';
