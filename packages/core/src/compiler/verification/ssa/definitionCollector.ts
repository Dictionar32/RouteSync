/**
 * definitionCollector.ts
 *
 * Collects SSA definitions, enforces single definition invariant,
 * and validates that phi nodes precede non-phi instructions.
 *
 * @module compiler/verification/ssa
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';

export interface SsaDefinitions {
    readonly defs: Set<number>;
    readonly defBlockMap: Map<number, number>;
}

export function collectSsaDefinitions(cfg: ControlFlowGraph): SsaDefinitions {
    const defs = new Set<number>();
    const defBlockMap = new Map<number, number>();

    for (const [blockId, block] of cfg.blocks) {
        let seenNonPhi = false;

        for (const inst of block.instructions) {
            if (inst.kind === 'Phi') {
                if (seenNonPhi) {
                    throw new Error(
                        `SSA Invariant violated: Phi instruction placed after non-Phi instruction in block ${blockId}`
                    );
                }

                if (defs.has(inst.target)) {
                    throw new Error(
                        `SSA Invariant violated: SSA value v${inst.target} is defined multiple times`
                    );
                }

                defs.add(inst.target);
                defBlockMap.set(inst.target, blockId);
            } else if (inst.kind === 'Assign') {
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

    return { defs, defBlockMap };
}
