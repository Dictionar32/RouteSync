/**
 * index.ts
 *
 * SSA verification domain exports.
 *
 * @module compiler/verification/ssa
 */

export {
    collectSsaDefinitions,
    type SsaDefinitions
} from './definitionCollector';

export { verifySsaDominance } from './dominanceChecker';
