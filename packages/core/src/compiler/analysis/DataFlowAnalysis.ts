/**
 * @file DataFlowAnalysis.ts
 * @description Generic data flow analysis framework
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';

/**
 * Flow state untuk single basic block
 * 
 * Contains:
 * - inState: State at block entry
 * - outState: State at block exit
 * 
 * @template T - Type of data flow state
 */
export interface FlowState<T> {
    /** Data flow state at block entry */
    readonly inState: T;

    /** Data flow state at block exit */
    readonly outState: T;
}

/**
 * Generic data flow analysis framework
 * 
 * Implements iterative worklist algorithm untuk solve data flow equations.
 * Dapat digunakan untuk berbagai analyses:
 * - Reaching definitions
 * - Live variables
 * - Available expressions
 * - Constant propagation
 * 
 * @template T - Type of data flow state (must be serializable for comparison)
 * 
 * @example
 * ```typescript
 * // Reaching definitions analysis
 * interface ReachingDefs {
 *   definitions: Set<number>;
 * }
 * 
 * const analysis = new DataFlowAnalysis<ReachingDefs>();
 * 
 * const results = analysis.analyze(
 *   cfg,
 *   { definitions: new Set() }, // Initial state
 *   (block, state) => {
 *     // Transfer function: compute outState dari inState
 *     const newDefs = new Set(state.definitions);
 *     // ... update based on block instructions
 *     return { definitions: newDefs };
 *   },
 *   (states) => {
 *     // Merge function: combine states dari multiple predecessors
 *     const merged = new Set<number>();
 *     states.forEach(s => s.definitions.forEach(d => merged.add(d)));
 *     return { definitions: merged };
 *   }
 * );
 * 
 * // Query results
 * const blockState = results.get(blockId);
 * console.log('Reaching definitions:', blockState?.inState.definitions);
 * ```
 */
export class DataFlowAnalysis<T> {
    /**
     * Run data flow analysis pada CFG
     * 
     * Uses worklist algorithm:
     * 1. Initialize all blocks dengan initial state
     * 2. Process blocks dari worklist
     * 3. Compute new states via transfer function
     * 4. Merge predecessor states
     * 5. Repeat until fixed point reached
     * 
     * @param cfg - Control flow graph to analyze
     * @param initialState - Initial data flow state
     * @param transfer - Transfer function: (block, inState) -> outState
     * @param merge - Merge function: (predecessor states) -> merged state
     * @returns Map dari block ID ke flow state
     */
    public analyze(
        cfg: ControlFlowGraph,
        initialState: T,
        transfer: (block: BasicBlock, state: T) => T,
        merge: (states: readonly T[]) => T
    ): ReadonlyMap<number, FlowState<T>> {
        // Initialize all blocks dengan initial state
        const states = new Map<number, FlowState<T>>();
        for (const [id] of cfg.blocks) {
            states.set(id, { inState: initialState, outState: initialState });
        }

        // Worklist contains blocks yang need reprocessing
        const worklist = Array.from(cfg.blocks.keys());

        // Iterate until fixed point
        while (worklist.length > 0) {
            const blockId = worklist.shift()!;
            const block = cfg.blocks.get(blockId)!;
            const current = states.get(blockId)!;

            // Collect output states dari predecessors
            const predStates = block.predecessors
                .map(pid => states.get(pid)?.outState)
                .filter((s): s is T => s !== undefined);

            // Merge predecessor states untuk get new input state
            const newInState = predStates.length > 0
                ? merge(predStates)
                : current.inState;

            // Apply transfer function untuk compute output state
            const newOutState = transfer(block, newInState);

            // Check jika state changed (using JSON for deep equality)
            const inChanged = JSON.stringify(current.inState) !== JSON.stringify(newInState);
            const outChanged = JSON.stringify(current.outState) !== JSON.stringify(newOutState);

            if (inChanged || outChanged) {
                // Update state
                states.set(blockId, { inState: newInState, outState: newOutState });

                // Add successors ke worklist jika not already queued
                for (const succ of block.successors) {
                    if (!worklist.includes(succ)) {
                        worklist.push(succ);
                    }
                }
            }
        }

        return states;
    }

    /**
     * Run backward data flow analysis
     * 
     * Similar ke forward analysis tapi:
     * - inState becomes outState
     * - Merge dari successors instead of predecessors
     * - Transfer function applied backwards
     * 
     * Used untuk live variable analysis, etc.
     * 
     * @param cfg - Control flow graph
     * @param initialState - Initial state
     * @param transfer - Backward transfer: (block, outState) -> inState
     * @param merge - Merge successor states
     * @returns Map dari block ID ke flow state
     */
    public analyzeBackward(
        cfg: ControlFlowGraph,
        initialState: T,
        transfer: (block: BasicBlock, state: T) => T,
        merge: (states: readonly T[]) => T
    ): ReadonlyMap<number, FlowState<T>> {
        // Initialize
        const states = new Map<number, FlowState<T>>();
        for (const [id] of cfg.blocks) {
            states.set(id, { inState: initialState, outState: initialState });
        }

        // Worklist dalam reverse order untuk backward analysis
        const worklist = Array.from(cfg.blocks.keys()).reverse();

        // Iterate until fixed point
        while (worklist.length > 0) {
            const blockId = worklist.shift()!;
            const block = cfg.blocks.get(blockId)!;
            const current = states.get(blockId)!;

            // Collect input states dari successors (backward)
            const succStates = block.successors
                .map(sid => states.get(sid)?.inState)
                .filter((s): s is T => s !== undefined);

            // Merge successor states
            const newOutState = succStates.length > 0
                ? merge(succStates)
                : current.outState;

            // Apply backward transfer function
            const newInState = transfer(block, newOutState);

            // Check changes
            const inChanged = JSON.stringify(current.inState) !== JSON.stringify(newInState);
            const outChanged = JSON.stringify(current.outState) !== JSON.stringify(newOutState);

            if (inChanged || outChanged) {
                states.set(blockId, { inState: newInState, outState: newOutState });

                // Add predecessors ke worklist (backward)
                for (const pred of block.predecessors) {
                    if (!worklist.includes(pred)) {
                        worklist.push(pred);
                    }
                }
            }
        }

        return states;
    }
}
