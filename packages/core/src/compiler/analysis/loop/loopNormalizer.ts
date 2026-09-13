/**
 * Loop Normalization Utilities.
 * Transforms loops into canonical form for optimization (e.g. LICM).
 *
 * @module compiler/analysis/loop
 */

import { ControlFlowGraph, type BasicBlock, type Instruction } from '../../utils/ControlFlowGraph';

export class LoopNormalizer {
    /**
     * Ensure loop has a pre-header block.
     *
     * Pre-header is a block with:
     * - Single successor: loop header
     * - All outside loop predecessors go through pre-header
     */
    public static ensurePreHeader(
        cfg: ControlFlowGraph,
        loopBlocks: ReadonlySet<number>,
        headerId: number
    ): { cfg: ControlFlowGraph; preHeaderId: number } {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);
        const header = blocks.get(headerId);

        if (!header) {
            return { cfg, preHeaderId: cfg.entryBlock };
        }

        // Find predecessors outside loop
        const outerPreds = header.predecessors.filter(p => !loopBlocks.has(p));

        // Check if already has suitable pre-header
        if (outerPreds.length === 1 && blocks.get(outerPreds[0])?.successors.length === 1) {
            return { cfg, preHeaderId: outerPreds[0] };
        }

        // Create new pre-header block
        const preHeaderId = Math.max(...cfg.blocks.keys()) + 1;
        const jump: Instruction = { kind: 'Jump', targetBlockId: headerId };

        const preHeaderBlock: BasicBlock = {
            id: preHeaderId,
            instructions: [jump],
            successors: [headerId],
            predecessors: outerPreds
        };

        blocks.set(preHeaderId, preHeaderBlock);

        // Update outer predecessors to point to pre-header
        for (const predId of outerPreds) {
            const pred = blocks.get(predId);
            if (pred) {
                const nextSuccs = pred.successors.map(s => s === headerId ? preHeaderId : s);
                const nextInsts = pred.instructions.map(inst => {
                    if (inst.kind === 'Jump' && inst.targetBlockId === headerId) {
                        return { ...inst, targetBlockId: preHeaderId };
                    }
                    if (inst.kind === 'Branch') {
                        return {
                            ...inst,
                            trueBlockId: inst.trueBlockId === headerId ? preHeaderId : inst.trueBlockId,
                            falseBlockId: inst.falseBlockId === headerId ? preHeaderId : inst.falseBlockId
                        };
                    }
                    return inst;
                });

                blocks.set(predId, { ...pred, successors: nextSuccs, instructions: nextInsts });
            }
        }

        // Update header predecessors
        const nextHeaderPreds = header.predecessors.filter(p => loopBlocks.has(p));
        nextHeaderPreds.push(preHeaderId);
        blocks.set(headerId, { ...header, predecessors: nextHeaderPreds });

        return {
            cfg: new ControlFlowGraph(
                cfg.entryBlock === headerId 
                    ? preHeaderId 
                    : cfg.entryBlock,
                cfg.exitBlock,
                blocks
            ),
            preHeaderId
        };
    }
}
