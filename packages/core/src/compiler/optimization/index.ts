/**
 * @fileoverview Compiler Optimization Module
 * 
 * This module provides optimization passes for SSA-form IR:
 * - Constant folding and propagation
 * - Dead code elimination
 * - Copy coalescing
 * - Loop-invariant code motion (LICM)
 * - Phi elimination
 * 
 * @module compiler/optimization
 */

// Core optimization classes
export { SSAOptimizer } from './SSAOptimizer';
export { OptimizationPipeline } from './OptimizationPipeline';
export { PhiEliminator } from './PhiElimination';
export { CopyCoalescer } from './CopyCoalescing';
export { LICMOptimizer, LoopNormalizer } from './LICM';

// Optimization pass interface
export { OptimizationPass } from './OptimizationPass';

// Instruction effect analysis
export {
    InstructionEffect,
    getInstructionEffect,
    isSpeculatable,
    hasSideEffects
} from './InstructionEffect';
