/** Explicit relational loop-analysis exports. */
export type { LoopInfo, LoopRelations } from './loopTypes';
export { getNaturalLoopBlocks, computeLoopRelations, detectNaturalLoops } from './loopDetector';
export { ensurePreHeader, type LoopNormalizationResult, LoopNormalizer } from './loopNormalizer';
