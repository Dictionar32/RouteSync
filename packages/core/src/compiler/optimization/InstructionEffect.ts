/**
 * @file InstructionEffect.ts
 * @description Instruction side effect classification
 */

import type { Instruction } from '../utils/ControlFlowGraph';

/**
 * Categories of instruction side effects
 * 
 * Used untuk determine optimization safety:
 * - Pure: No side effects, dapat di-eliminate jika unused
 * - ReadMemory: Reads dari memory, dapat di-reorder carefully
 * - WriteMemory: Modifies memory, cannot eliminate
 * - Allocate: Allocates memory
 * - IO: Performs I/O operations
 * - Throw: May throw exceptions
 * - CallUnknown: Calls unknown function (may have any effect)
 */
export type InstructionEffect =
    | 'Pure'
    | 'ReadMemory'
    | 'WriteMemory'
    | 'Allocate'
    | 'IO'
    | 'Throw'
    | 'CallUnknown';

/**
 * Determine side effect category dari instruction
 * 
 * Used untuk:
 * - Dead code elimination (pure instructions dengan no uses dapat di-remove)
 * - Instruction reordering (instructions dengan no dependencies dapat di-reorder)
 * - Loop-invariant code motion (pure instructions dapat di-hoist)
 * 
 * @param inst - Instruction to analyze
 * @returns Effect category
 * 
 * @example
 * ```typescript
 * const effect = getInstructionEffect(instruction);
 * 
 * if (effect === 'Pure' && !hasUses(instruction.target)) {
 *   // Safe untuk eliminate
 *   removeInstruction(instruction);
 * }
 * ```
 */
export function getInstructionEffect(inst: Instruction): InstructionEffect {
    switch (inst.kind) {
        case 'Call':
            // Unknown function calls may have any side effect
            return 'CallUnknown';

        case 'StoreProperty':
            // Writing ke property modifies memory
            return 'WriteMemory';

        case 'LoadProperty':
            // Reading dari property
            return 'ReadMemory';

        default:
            // Most instructions are pure (arithmetic, phi, etc.)
            return 'Pure';
    }
}

/**
 * Check apakah instruction is speculatable (safe untuk execute speculatively)
 * 
 * Speculatable instructions:
 * - Have no side effects
 * - Won't trap/throw
 * - Safe untuk execute even if result not used
 * 
 * Used untuk optimization decisions seperti:
 * - Hoisting dari loops
 * - Speculative execution
 * - Code motion
 * 
 * @param inst - Instruction to check
 * @returns True jika instruction is speculatable
 * 
 * @example
 * ```typescript
 * if (isSpeculatable(inst)) {
 *   // Safe untuk hoist out of loop
 *   hoistToPreHeader(inst);
 * }
 * ```
 */
export function isSpeculatable(inst: Instruction): boolean {
    const effect = getInstructionEffect(inst);

    // Only pure instructions dengan no side effects are speculatable
    if (effect !== 'Pure') {
        return false;
    }

    // Additional checks dapat ditambahkan:
    // - Check for division by zero
    // - Check for null pointer dereference
    // - Check for array bounds

    return true;
}

/**
 * Check apakah instruction has observable side effects
 * 
 * @param inst - Instruction to check
 * @returns True jika instruction has side effects
 */
export function hasSideEffects(inst: Instruction): boolean {
    const effect = getInstructionEffect(inst);
    return effect !== 'Pure';
}
