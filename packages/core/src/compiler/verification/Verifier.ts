/**
 * @fileoverview Verifier Base Class
 * 
 * Abstract base class for all verification passes in the compiler.
 */

import type { VerificationContext, VerifierPhase } from './VerificationContext';

/**
 * Abstract base class for verification passes
 * 
 * All verifiers must extend this class and implement the verify method
 * to check specific invariants.
 * 
 * @example
 * ```typescript
 * class MyVerifier extends Verifier {
 *   public readonly phase = VerifierPhase.PreOptimization;
 * 
 *   public verify(context: VerificationContext): void {
 *     // Check invariants
 *     if (somethingWrong) {
 *       throw new Error('Invariant violated');
 *     }
 *   }
 * }
 * ```
 */
export abstract class Verifier {
    /**
     * Phase at which this verifier should run
     */
    public abstract readonly phase: VerifierPhase;

    /**
     * Verify invariants on the given IR
     * 
     * @param context - Verification context with IR and analysis results
     * @throws Error if any invariants are violated
     */
    public abstract verify(context: VerificationContext): void;
}
