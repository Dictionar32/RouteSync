/**
 * @fileoverview SSA Verifier - Validates SSA form invariants
 * 
 * Ensures SSA properties are maintained:
 * - Each variable is defined exactly once
 * - All uses are dominated by their definitions
 * - Phi nodes appear only at block beginnings
 * - Phi incoming edges match predecessors
 */

import { Verifier } from './Verifier';
import { VerifierPhase, type VerificationContext } from './VerificationContext';
import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from '../analysis/DominatorAnalysis';

/**
 * SSA form verifier
 * 
 * Validates that the IR is in proper SSA form with correct domination
 * properties and phi node placement.
 * 
 * @example
 * ```typescript
 * const verifier = new SSAVerifier();
 * verifier.verify({ cfg, dom });
 * 
 * // Or use static method
 * SSAVerifier.verify(cfg, dom);
 * ```
 */
export class SSAVerifier extends Verifier {
    public readonly phase = VerifierPhase.PostOptimization;

    /**
     * Static convenience method for verification
     * 
     * @param cfg - Control flow graph in SSA form
     * @param dom - Dominator tree for the CFG
     * @throws Error if any invariants are violated
     */
    public static verify(cfg: ControlFlowGraph, dom: DominatorTree): void {
        new SSAVerifier().verify({ cfg, dom });
    }

    /**
     * Verify SSA form invariants
     * 
     * Checks:
     * 1. Phi nodes appear only at block beginnings
     * 2. Each SSA value is defined exactly once
     * 3. All uses are dominated by their definitions
     * 4. Phi incoming edges match block predecessors
     * 5. Phi operands are dominated by predecessor blocks
     * 
     * @param context - Verification context with CFG and dominator tree
     * @throws Error if any invariants are violated or dominator tree is missing
     */
    public verify(context: VerificationContext): void {
        const cfg = context.cfg;
        const dom = context.dom;

        if (!dom) {
            throw new Error("SSAVerifier requires DominatorTree in verification context");
        }

        // Track all definitions and their defining blocks
        const defs = new Set<number>();
        const defBlockMap = new Map<number, number>();

        // First pass: collect all definitions and check phi placement
        for (const [blockId, block] of cfg.blocks) {
            let seenNonPhi = false;

            for (const inst of block.instructions) {
                if (inst.kind === 'Phi') {
                    // Phi nodes must come before all other instructions
                    if (seenNonPhi) {
                        throw new Error(
                            `SSA Invariant violated: Phi instruction placed after non-Phi instruction in block ${blockId}`
                        );
                    }

                    // Check for duplicate definitions
                    if (defs.has(inst.target)) {
                        throw new Error(
                            `SSA Invariant violated: SSA value v${inst.target} is defined multiple times`
                        );
                    }

                    defs.add(inst.target);
                    defBlockMap.set(inst.target, blockId);

                } else if (inst.kind === 'Assign') {
                    // Check for duplicate definitions
                    if (defs.has(inst.target)) {
                        throw new Error(
                            `SSA Invariant violated: SSA value v${inst.target} is defined multiple times`
                        );
                    }

                    defs.add(inst.target);
                    defBlockMap.set(inst.target, blockId);
                    seenNonPhi = true;

                } else {
                    seenNonPhi = true;
                }
            }
        }

        // Second pass: verify uses are dominated by definitions
        for (const [blockId, block] of cfg.blocks) {
            for (const inst of block.instructions) {
                if (inst.kind === 'Assign') {
                    // Check SSA value uses in assign instructions
                    if (inst.value.kind === 'SSAValue') {
                        const defVal = inst.value.id;

                        if (!defs.has(defVal)) {
                            throw new Error(
                                `SSA Invariant violated: undefined SSA value usage v${defVal}`
                            );
                        }

                        const defBlock = defBlockMap.get(defVal)!;
                        if (!dom.dominates(defBlock, blockId)) {
                            throw new Error(
                                `SSA Invariant violated: usage of v${defVal} in block ${blockId} is not dominated by its definition block ${defBlock}`
                            );
                        }
                    }

                } else if (inst.kind === 'Phi') {
                    // Verify phi node structure
                    if (inst.incoming.size !== block.predecessors.length) {
                        throw new Error(
                            `SSA Invariant violated: Phi incoming size does not match predecessor count`
                        );
                    }

                    // Check each phi operand
                    for (const [predId, operand] of inst.incoming) {
                        // Verify predId is actually a predecessor
                        if (!block.predecessors.includes(predId)) {
                            throw new Error(
                                `SSA Invariant violated: Phi incoming predecessor ${predId} is not a predecessor of block ${blockId}`
                            );
                        }

                        // Check SSA value uses in phi operands
                        if (operand.kind === 'SSAValue') {
                            const defVal = operand.id;

                            if (!defs.has(defVal)) {
                                throw new Error(
                                    `SSA Invariant violated: undefined SSA value usage in Phi v${defVal}`
                                );
                            }

                            const defBlock = defBlockMap.get(defVal)!;
                            if (!dom.dominates(defBlock, predId)) {
                                throw new Error(
                                    `SSA Invariant violated: usage of v${defVal} for predecessor block ${predId} in Phi is not dominated by its definition block ${defBlock}`
                                );
                            }
                        }
                    }
                }
            }
        }
    }
}
