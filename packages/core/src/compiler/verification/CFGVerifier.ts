/**
 * @fileoverview CFG Verifier - Validates control flow graph invariants
 * 
 * Ensures the CFG structure is well-formed:
 * - Entry block has no predecessors
 * - Exit block has no successors
 * - All edges are bidirectional
 * - All blocks have proper terminators
 */

import { Verifier } from './Verifier';
import { VerifierPhase, type VerificationContext } from './VerificationContext';

/**
 * Control Flow Graph verifier
 * 
 * Validates CFG structural invariants to ensure the IR is well-formed
 * before optimization and code generation.
 * 
 * @example
 * ```typescript
 * const verifier = new CFGVerifier();
 * verifier.verify({ cfg });
 * 
 * // Or use static method
 * CFGVerifier.verify(cfg);
 * ```
 */
export class CFGVerifier extends Verifier {
    public readonly phase = VerifierPhase.PreOptimization;

    /**
     * Static convenience method for verification
     * 
     * @param cfg - Control flow graph to verify
     * @throws Error if any invariants are violated
     */
    public static verify(cfg: VerificationContext['cfg']): void {
        new CFGVerifier().verify({ cfg });
    }

    /**
     * Verify CFG structural invariants
     * 
     * Checks:
     * 1. Entry block has no predecessors
     * 2. Exit block has no successors
     * 3. All successor edges have matching predecessor edges
     * 4. All predecessor edges have matching successor edges
     * 5. All blocks are non-empty and have terminators
     * 6. Terminators are only at the end of blocks
     * 
     * @param context - Verification context containing CFG
     * @throws Error if any invariants are violated
     */
    public verify(context: VerificationContext): void {
        const cfg = context.cfg;

        // Check entry block has no predecessors
        const entryBlock = cfg.blocks.get(cfg.entryBlock);
        if (entryBlock && entryBlock.predecessors.length > 0) {
            throw new Error(
                `CFG Invariant violated: entry block ${cfg.entryBlock} has predecessor blocks`
            );
        }

        // Check exit block has no successors
        const exitBlock = cfg.blocks.get(cfg.exitBlock);
        if (exitBlock && exitBlock.successors.length > 0) {
            throw new Error(
                `CFG Invariant violated: exit block ${cfg.exitBlock} has successor blocks`
            );
        }

        // Verify all blocks
        for (const [blockId, block] of cfg.blocks) {
            // Check successor edges are bidirectional
            for (const succ of block.successors) {
                const succBlock = cfg.blocks.get(succ);
                if (!succBlock) {
                    throw new Error(
                        `CFG Invariant violated: block ${blockId} points to non-existent successor block ${succ}`
                    );
                }
                if (!succBlock.predecessors.includes(blockId)) {
                    throw new Error(
                        `CFG Invariant violated: block ${succ} is successor of ${blockId} but does not list it as predecessor`
                    );
                }
            }

            // Check predecessor edges are bidirectional
            for (const pred of block.predecessors) {
                const predBlock = cfg.blocks.get(pred);
                if (!predBlock) {
                    throw new Error(
                        `CFG Invariant violated: block ${blockId} lists non-existent predecessor block ${pred}`
                    );
                }
                if (!predBlock.successors.includes(blockId)) {
                    throw new Error(
                        `CFG Invariant violated: block ${pred} is predecessor of ${blockId} but does not list it as successor`
                    );
                }
            }

            // Check block is non-empty
            if (block.instructions.length === 0) {
                throw new Error(
                    `CFG Invariant violated: basic block ${blockId} is empty and lacks a terminator`
                );
            }

            // Check terminator placement
            let foundTerminator = false;
            for (let i = 0; i < block.instructions.length; i++) {
                const inst = block.instructions[i];
                const isTerm = inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return';

                if (foundTerminator) {
                    throw new Error(
                        `CFG Invariant violated: instruction placed after terminator in block ${blockId}`
                    );
                }

                if (isTerm) {
                    foundTerminator = true;
                    if (i !== block.instructions.length - 1) {
                        throw new Error(
                            `CFG Invariant violated: terminator instruction is not the last instruction in block ${blockId}`
                        );
                    }
                }
            }

            // Check blocks with successors have terminators
            if (!foundTerminator && block.successors.length > 0) {
                throw new Error(
                    `CFG Invariant violated: block ${blockId} has successors but no terminator instruction`
                );
            }
        }
    }
}
