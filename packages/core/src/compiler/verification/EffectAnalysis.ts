/**
 * @fileoverview Effect Analysis - Instruction side effect analysis
 * 
 * Provides interface for analyzing instruction side effects,
 * used by optimization passes to determine safety of transformations.
 */

import type { Instruction } from '../ir/Instruction';
import { isSpeculatable } from '../optimization/InstructionEffect';

/**
 * Effect analysis interface
 * 
 * Provides methods to query whether instructions have side effects
 * or can be safely speculated (moved earlier in execution).
 * 
 * @example
 * ```typescript
 * class MyEffectAnalysis implements EffectAnalysis {
 *   isSpeculatable(inst: Instruction): boolean {
 *     return getInstructionEffect(inst) === 'Pure';
 *   }
 * }
 * ```
 */
export interface EffectAnalysis {
    /**
     * Check if an instruction can be safely speculated
     * 
     * Speculatable instructions are pure (no side effects) and can
     * be moved earlier in execution without changing program semantics.
     * 
     * @param inst - Instruction to analyze
     * @returns true if instruction is speculatable
     */
    isSpeculatable(inst: Instruction): boolean;
}

/**
 * Default effect analysis implementation
 * 
 * Uses the instruction effect analysis from the optimization module.
 */
export class DefaultEffectAnalysis implements EffectAnalysis {
    public isSpeculatable(inst: Instruction): boolean {
        return isSpeculatable(inst);
    }
}
