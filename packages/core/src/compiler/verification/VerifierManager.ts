/**
 * @fileoverview Verifier Manager - Orchestrates verification passes
 * 
 * Manages registration and execution of verification passes across
 * different compilation phases.
 */

import { Verifier } from './Verifier';
import type { VerificationContext, VerifierPhase } from './VerificationContext';

/**
 * Manager for verification passes
 * 
 * Registers verifiers and runs them at appropriate compilation phases.
 * Collects and reports all verification errors.
 * 
 * @example
 * ```typescript
 * const manager = new VerifierManager();
 * manager.register(new CFGVerifier());
 * manager.register(new SSAVerifier());
 * 
 * // Run specific phase
 * manager.runPhase(VerifierPhase.PreOptimization, context);
 * 
 * // Or run all verifiers
 * manager.verifyAll(context);
 * ```
 */
export class VerifierManager {
    private verifiers: Verifier[] = [];

    /**
     * Register a new verifier
     * 
     * @param verifier - Verifier to register
     */
    public register(verifier: Verifier): void {
        this.verifiers.push(verifier);
    }

    /**
     * Run all verifiers for a specific phase
     * 
     * @param phase - Compilation phase to verify
     * @param context - Verification context
     * @throws Error if any verifications fail
     */
    public runPhase(phase: VerifierPhase, context: VerificationContext): void {
        const errors: Error[] = [];

        for (const verifier of this.verifiers) {
            if (verifier.phase === phase) {
                try {
                    verifier.verify(context);
                } catch (err) {
                    errors.push(err instanceof Error ? err : new Error(String(err)));
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(
                `Verification failed in phase ${phase}: ${errors.map(e => e.message).join('; ')}`
            );
        }
    }

    /**
     * Run all registered verifiers regardless of phase
     * 
     * Useful for comprehensive verification before code emission.
     * 
     * @param context - Verification context
     * @throws Error if any verifications fail
     */
    public verifyAll(context: VerificationContext): void {
        const errors: Error[] = [];

        for (const verifier of this.verifiers) {
            try {
                verifier.verify(context);
            } catch (err) {
                errors.push(err instanceof Error ? err : new Error(String(err)));
            }
        }

        if (errors.length > 0) {
            throw new Error(
                `Verification failed: ${errors.map(e => e.message).join('; ')}`
            );
        }
    }
}
