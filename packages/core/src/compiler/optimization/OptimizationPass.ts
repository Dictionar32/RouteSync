/**
 * @fileoverview Optimization Pass Interface
 * 
 * Defines the contract for optimization passes in the compiler pipeline,
 * including analysis requirements and preservation guarantees.
 */

import type { AnalysisKey } from '../passes/PassResult';

/**
 * Optimization pass interface
 * 
 * All optimization passes must implement this interface to participate
 * in the optimization pipeline. Passes declare their analysis dependencies
 * and which analyses they preserve or invalidate.
 * 
 * @example
 * ```typescript
 * class MyOptimization implements OptimizationPass {
 *   readonly name = 'MyOptimization';
 *   readonly requires = new Set([CFGAnalysis, UseDefAnalysis]);
 *   readonly preserves = new Set([CFGAnalysis]);
 *   readonly invalidates = new Set([UseDefAnalysis]);
 * 
 *   run(cfg: ControlFlowGraph, manager: AnalysisManager): PassResult {
 *     // Perform optimization
 *     return { changed: true, preservedAnalyses: this.preserves };
 *   }
 * }
 * ```
 */
export interface OptimizationPass {
    /**
     * Human-readable name of the optimization pass
     */
    readonly name: string;

    /**
     * Set of analyses required by this pass
     * 
     * The pass manager will ensure these analyses are computed and
     * available before running this pass.
     */
    readonly requires: ReadonlySet<AnalysisKey<unknown>>;

    /**
     * Set of analyses preserved by this pass
     * 
     * These analyses remain valid after the pass runs and do not
     * need to be recomputed.
     */
    readonly preserves: ReadonlySet<AnalysisKey<unknown>>;

    /**
     * Set of analyses invalidated by this pass
     * 
     * These analyses are no longer valid after the pass runs and
     * must be recomputed if needed again.
     */
    readonly invalidates: ReadonlySet<AnalysisKey<unknown>>;
}
