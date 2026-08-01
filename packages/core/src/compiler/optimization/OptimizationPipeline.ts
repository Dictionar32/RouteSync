/**
 * @fileoverview Optimization Pipeline - Fixpoint iteration framework
 * 
 * Runs optimization passes repeatedly until no more changes occur,
 * implementing a fixpoint algorithm for iterative optimization.
 */

import type { Instruction } from '../ir/Instruction';
import type { UseDefGraph } from '../analysis/UseDefAnalysis';
import { SSAOptimizer } from './SSAOptimizer';
import { computeIRHash } from '../utils/Hash';

/**
 * Optimization pipeline with fixpoint iteration
 * 
 * Repeatedly applies optimization passes until the IR reaches a stable
 * state (fixpoint) where no further optimizations are possible.
 * 
 * @example
 * ```typescript
 * const instructions = parseInstructions(source);
 * const useDef = UseDefGraph.build(cfg);
 * const optimized = OptimizationPipeline.runFixpoint(instructions, useDef);
 * ```
 */
export class OptimizationPipeline {
    /**
     * Run optimization passes to fixpoint
     * 
     * Iteratively applies constant folding and dead code elimination
     * until the instruction sequence stabilizes.
     * 
     * @param instructions - Initial instruction sequence
     * @param useDef - Use-definition analysis results
     * @returns Fully optimized instruction sequence
     * 
     * @example
     * ```typescript
     * // Initial:
     * //   v1 = 5 + 3
     * //   v2 = v1 * 2
     * //   v3 = v1 + 0  // dead code
     * 
     * // Iteration 1 (constant folding):
     * //   v1 = 8
     * //   v2 = v1 * 2
     * //   v3 = v1 + 0
     * 
     * // Iteration 2 (dead code elimination):
     * //   v1 = 8
     * //   v2 = v1 * 2
     * 
     * // Iteration 3 (more folding):
     * //   v1 = 8
     * //   v2 = 16
     * 
     * // Fixpoint reached
     * ```
     */
    public static runFixpoint(
        instructions: readonly Instruction[],
        useDef: UseDefGraph
    ): readonly Instruction[] {
        let current = instructions;
        let changed = true;
        let lastHash = computeIRHash(current);

        while (changed) {
            changed = false;

            // Apply constant folding
            const folded = SSAOptimizer.foldConstants(current);

            // Apply dead code elimination
            const pruned = SSAOptimizer.eliminateDeadCode(folded, useDef);

            // Check if anything changed
            const newHash = computeIRHash(pruned);
            if (newHash !== lastHash) {
                current = pruned;
                lastHash = newHash;
                changed = true;
            }
        }

        return current;
    }
}
