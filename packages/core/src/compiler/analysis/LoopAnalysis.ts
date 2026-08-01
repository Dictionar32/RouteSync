/**
 * @file LoopAnalysis.ts
 * @description Loop detection dan analysis untuk optimization
 */

import type { ControlFlowGraph, BasicBlock, Instruction } from '../utils/ControlFlowGraph';
import type { DominatorTree } from './DominatorAnalysis';

/**
 * Information tentang detected loop
 */
export interface LoopInfo {
    /** Loop header block ID (dominator dari semua loop blocks) */
    readonly header: number;

    /** Back edge sources (blocks yang jump back ke header) */
    readonly backEdges: readonly number[];

    /** Set of semua blocks dalam loop */
    readonly loopBlocks: ReadonlySet<number>;
}

/**
 * Loop detection dan analysis
 * 
 * Identifies natural loops dalam CFG menggunakan dominance analysis.
 * Natural loop adalah set of blocks dengan:
 * - Single entry point (header) yang dominates semua blocks dalam loop
 * - At least one back edge ke header
 * 
 * @example
 * ```typescript
 * const loops = LoopAnalysis.analyze(cfg, dominatorTree);
 * 
 * loops.forEach(loop => {
 *   console.log(`Loop header: ${loop.header}`);
 *   console.log(`Back edges from:`, loop.backEdges);
 *   console.log(`Loop blocks:`, Array.from(loop.loopBlocks));
 * });
 * ```
 */
export class LoopAnalysis {
    /**
     * Analyze CFG untuk detect semua natural loops
     * 
     * Algorithm:
     * 1. Find back edges (edges dari node N ke node H where H dominates N)
     * 2. Untuk setiap back edge, compute natural loop blocks
     * 
     * @param cfg - Control flow graph
     * @param dom - Dominator tree
     * @returns Array of detected loops
     */
    public static analyze(
        cfg: ControlFlowGraph,
        dom: DominatorTree
    ): readonly LoopInfo[] {
        const loopsMap = new Map<number, Set<number>>();

        // Find back edges
        for (const [nodeId, block] of cfg.blocks) {
            for (const succ of block.successors) {
                // Back edge: successor dominates current node
                if (dom.dominates(succ, nodeId)) {
                    const backEdges = loopsMap.get(succ) ?? new Set();
                    backEdges.add(nodeId);
                    loopsMap.set(succ, backEdges);
                }
            }
        }

        // Compute natural loop untuk setiap header
        const loopInfos: LoopInfo[] = [];
        for (const [header, backEdgesSet] of loopsMap) {
            const backEdges = Array.from(backEdgesSet);
            const loopBlocks = this.getNaturalLoop(header, backEdges, cfg);

            loopInfos.push({
                header,
                backEdges,
                loopBlocks
            });
        }

        return loopInfos;
    }

    /**
     * Compute natural loop blocks untuk given header dan back edges
     * 
     * Natural loop includes:
     * - Header block
     * - All back edge sources
     * - All blocks yang can reach back edge sources tanpa going through header
     * 
     * @param header - Loop header block ID
     * @param backEdges - Back edge source block IDs
     * @param cfg - Control flow graph
     * @returns Set of semua blocks dalam loop
     */
    private static getNaturalLoop(
        header: number,
        backEdges: readonly number[],
        cfg: ControlFlowGraph
    ): ReadonlySet<number> {
        const loopBlocks = new Set<number>([header]);
        const queue: number[] = [];

        // Add back edge sources
        for (const edge of backEdges) {
            if (!loopBlocks.has(edge)) {
                loopBlocks.add(edge);
                queue.push(edge);
            }
        }

        // Backward traversal untuk find semua loop blocks
        while (queue.length > 0) {
            const node = queue.shift()!;
            const block = cfg.blocks.get(node);

            if (block) {
                // Add predecessors yang belum visited
                for (const pred of block.predecessors) {
                    if (!loopBlocks.has(pred)) {
                        loopBlocks.add(pred);
                        queue.push(pred);
                    }
                }
            }
        }

        return loopBlocks;
    }
}

/**
 * Loop normalization utilities
 * 
 * Transforms loops into canonical form untuk easier optimization:
 * - Ensures loop has single entry (pre-header)
 * - Single back edge ke header
 * - Single exit block
 */
export class LoopNormalizer {
    /**
     * Ensure loop has pre-header block
     * 
     * Pre-header adalah block dengan:
     * - Single successor: loop header
     * - All outside loop predecessors go through pre-header
     * 
     * Used untuk hoisting loop-invariant code.
     * 
     * @param cfg - Control flow graph
     * @param loopBlocks - Set of blocks dalam loop
     * @param headerId - Loop header block ID
     * @returns Updated CFG dan pre-header block ID
     * 
     * @example
     * ```typescript
     * const { cfg: newCfg, preHeaderId } = LoopNormalizer.ensurePreHeader(
     *   cfg,
     *   loop.loopBlocks,
     *   loop.header
     * );
     * 
     * // Now can hoist invariants ke pre-header
     * const preHeader = newCfg.blocks.get(preHeaderId);
     * ```
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

        // Check jika already has suitable pre-header
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

        // Update outer predecessors untuk point ke pre-header
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
