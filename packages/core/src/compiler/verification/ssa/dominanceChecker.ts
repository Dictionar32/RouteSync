/**
 * dominanceChecker.ts
 *
 * Verifies that all SSA uses are dominated by their definitions
 * and validates phi incoming edge consistency.
 *
 * @module compiler/verification/ssa
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from '../../analysis/DominatorAnalysis';
import type { SsaDefinitions } from './definitionCollector';

export function verifySsaDominance(
    cfg: ControlFlowGraph,
    dom: DominatorTree,
    definitions: SsaDefinitions
): void {
    const { defs, defBlockMap } = definitions;

    for (const [blockId, block] of cfg.blocks) {
        for (const inst of block.instructions) {
            if (inst.kind === 'Assign') {
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
                if (inst.incoming.size !== block.predecessors.length) {
                    throw new Error(
                        'SSA Invariant violated: Phi incoming size does not match predecessor count'
                    );
                }

                for (const [predId, operand] of inst.incoming) {
                    if (!block.predecessors.includes(predId)) {
                        throw new Error(
                            `SSA Invariant violated: Phi incoming predecessor ${predId} is not a predecessor of block ${blockId}`
                        );
                    }

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
