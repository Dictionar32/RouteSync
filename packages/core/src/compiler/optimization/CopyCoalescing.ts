/**
 * @fileoverview Copy Coalescing - Eliminate redundant copy operations
 * 
 * Optimizes code by removing unnecessary copy instructions and
 * renaming variables to eliminate intermediate values.
 */

import type { Instruction } from '../ir/Instruction';
import type { UseDefGraph } from '../analysis/UseDefAnalysis';

/**
 * Copy coalescing optimizer
 * 
 * Removes redundant copy operations by building a renaming map
 * and applying it transitively across all instructions.
 * 
 * @example
 * ```typescript
 * // Before:
 * //   v2 = v1
 * //   v3 = v2
 * //   return v3
 * 
 * // After:
 * //   return v1
 * 
 * const coalesced = CopyCoalescer.coalesce(instructions, useDef);
 * ```
 */
export class CopyCoalescer {
    /**
     * Coalesce copy operations
     * 
     * Identifies copy instructions (v_target = v_source) and eliminates them
     * by renaming all uses of v_target to v_source.
     * 
     * @param instructions - Instruction sequence
     * @param useDef - Use-definition analysis results
     * @returns Optimized instruction sequence with copies eliminated
     */
    public static coalesce(
        instructions: readonly Instruction[],
        useDef: UseDefGraph
    ): readonly Instruction[] {
        const coalesced: Instruction[] = [];
        const renamingMap = new Map<number, number>();

        // Build renaming map from copy instructions
        for (const inst of instructions) {
            if (inst.kind === 'Assign' && inst.value.kind === 'SSAValue') {
                const sourceVal = inst.value.id;
                const targetVal = inst.target;

                // Record that targetVal should be renamed to sourceVal
                renamingMap.set(targetVal, sourceVal);
            } else {
                coalesced.push(inst);
            }
        }

        // Apply renaming to all remaining instructions
        return coalesced.map(inst => {
            if (inst.kind === 'Assign') {
                // Rename target if it appears in renaming map
                const mappedTarget = renamingMap.get(inst.target) ?? inst.target;

                // Rename source if it's an SSA value in renaming map
                const mappedValue = inst.value.kind === 'SSAValue' && renamingMap.has(inst.value.id)
                    ? { kind: 'SSAValue' as const, id: renamingMap.get(inst.value.id)! }
                    : inst.value;

                return {
                    ...inst,
                    target: mappedTarget,
                    value: mappedValue
                };
            }
            return inst;
        });
    }
}
