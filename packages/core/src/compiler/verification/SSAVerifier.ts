/**
 * @fileoverview SSA Verifier - Validates SSA form invariants
 *
 * Active Consumer: Ensures SSA properties are maintained:
 * - Each variable is defined exactly once
 * - All uses are dominated by their definitions
 * - Phi nodes appear only at block beginnings
 * - Phi incoming edges match predecessors
 *
 * @module compiler/verification/SSAVerifier
 */

import { Verifier } from './Verifier';
import { VerifierPhase, type VerificationContext } from './VerificationContext';
import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from '../analysis/DominatorAnalysis';
import { collectSsaDefinitions, verifySsaDominance } from './ssa';

/**
 * SSA form verifier
 */
export class SSAVerifier extends Verifier {
    public readonly phase = VerifierPhase.PostOptimization;

    /**
     * Static convenience method for verification
     */
    public static verify(cfg: ControlFlowGraph, dom: DominatorTree): void {
        new SSAVerifier().verify({ cfg, dom });
    }

    /**
     * Verify SSA form invariants
     */
    public verify(context: VerificationContext): void {
        const cfg = context.cfg;
        const dom = context.dom;

        if (!dom) {
            throw new Error("SSAVerifier requires DominatorTree in verification context");
        }

        const definitions = collectSsaDefinitions(cfg);
        verifySsaDominance(cfg, dom, definitions);
    }
}
