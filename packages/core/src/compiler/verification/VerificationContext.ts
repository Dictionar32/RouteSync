/**
 * @fileoverview Verification Context - Context for IR verification
 * 
 * Provides the context and data structures needed for verifying
 * compiler invariants and correctness properties.
 */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from '../analysis/DominatorAnalysis';
import type { SSARepresentation } from '../analysis/SSAAnalysis';
import type { AnalysisManager } from '../analysis/AnalysisManager';

/**
 * Verification phase enum
 * 
 * Defines when verification passes should run in the compilation pipeline.
 */
export enum VerifierPhase {
    /** Before optimization passes */
    PreOptimization = 'PreOptimization',

    /** After optimization passes */
    PostOptimization = 'PostOptimization',

    /** Final verification before code emission */
    Final = 'Final'
}

/**
 * Context for verification passes
 * 
 * Provides access to IR data structures and analysis results
 * needed for verification.
 * 
 * @example
 * ```typescript
 * const context: VerificationContext = {
 *   cfg: controlFlowGraph,
 *   dom: dominatorTree,
 *   ssa: ssaRepresentation,
 *   manager: analysisManager
 * };
 * 
 * verifier.verify(context);
 * ```
 */
export interface VerificationContext {
    /** Control flow graph being verified */
    readonly cfg: ControlFlowGraph;

    /** Optional dominator tree for SSA verification */
    readonly dom?: DominatorTree;

    /** Optional SSA representation for SSA verification */
    readonly ssa?: SSARepresentation;

    /** Optional analysis manager for accessing computed analyses */
    readonly manager?: AnalysisManager;
}
