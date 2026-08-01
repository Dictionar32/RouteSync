/**
 * @file UseDefAnalysis.ts
 * @description Use-Def chain analysis untuk data flow
 */

/**
 * Use-Def graph tracks relationships antara variable uses dan definitions
 * 
 * Maintains:
 * - Def map: valueId -> instruction ID yang defines value
 * - Use map: valueId -> set of instruction IDs yang use value
 * 
 * Used untuk:
 * - Dead code elimination
 * - Copy propagation
 * - Liveness analysis
 * 
 * @example
 * ```typescript
 * const useDef = new UseDefGraph();
 * 
 * // Record definition
 * useDef.recordDef(valueId, defInstructionId);
 * 
 * // Record use
 * useDef.recordUse(valueId, useInstructionId);
 * 
 * // Query
 * const defInst = useDef.getDefinition(valueId);
 * const uses = useDef.getUses(valueId);
 * 
 * if (uses.size === 0) {
 *   console.log('Dead definition - value never used');
 * }
 * ```
 */
export class UseDefGraph {
    /** Map dari value ID ke instruction ID yang defines it */
    private defs = new Map<number, number>();

    /** Map dari value ID ke set of instruction IDs yang use it */
    private uses = new Map<number, Set<number>>();

    /**
     * Record definition dari value
     * 
     * @param valueId - Value being defined
     * @param instructionId - Instruction yang defines value
     */
    public recordDef(valueId: number, instructionId: number): void {
        this.defs.set(valueId, instructionId);
    }

    /**
     * Record use dari value
     * 
     * @param valueId - Value being used
     * @param instructionId - Instruction yang uses value
     */
    public recordUse(valueId: number, instructionId: number): void {
        const set = this.uses.get(valueId) ?? new Set();
        set.add(instructionId);
        this.uses.set(valueId, set);
    }

    /**
     * Get instruction yang defines given value
     * 
     * @param valueId - Value ID to query
     * @returns Instruction ID atau undefined jika tidak ada definition
     */
    public getDefinition(valueId: number): number | undefined {
        return this.defs.get(valueId);
    }

    /**
     * Get all instructions yang use given value
     * 
     * @param valueId - Value ID to query
     * @returns Set of instruction IDs yang use value
     */
    public getUses(valueId: number): ReadonlySet<number> {
        return this.uses.get(valueId) ?? new Set();
    }

    /**
     * Check apakah value is used
     * 
     * @param valueId - Value ID to check
     * @returns True jika value has uses
     */
    public isUsed(valueId: number): boolean {
        const uses = this.uses.get(valueId);
        return uses !== undefined && uses.size > 0;
    }

    /**
     * Remove use record
     * 
     * @param valueId - Value ID
     * @param instructionId - Instruction ID
     */
    public removeUse(valueId: number, instructionId: number): void {
        const set = this.uses.get(valueId);
        if (set) {
            set.delete(instructionId);
            if (set.size === 0) {
                this.uses.delete(valueId);
            }
        }
    }

    /**
     * Clear all use-def information
     */
    public clear(): void {
        this.defs.clear();
        this.uses.clear();
    }

    /**
     * Get statistics about use-def graph
     */
    public getStats(): { totalDefs: number; totalUses: number; unusedValues: number } {
        let totalUses = 0;
        let unusedValues = 0;

        for (const [valueId, uses] of this.uses) {
            totalUses += uses.size;
            if (uses.size === 0) {
                unusedValues++;
            }
        }

        return {
            totalDefs: this.defs.size,
            totalUses,
            unusedValues
        };
    }
}
