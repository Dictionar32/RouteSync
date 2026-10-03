/** Relation-driven loop normalization. */
import type { ControlFlowGraph, BasicBlock, Instruction, BasicBlockRelation } from '../../utils/ControlFlowGraph';
import { basicBlockLookup, basicBlockReplace, basicBlockIds, createControlFlowGraph } from '../../utils/ControlFlowGraph';
import { relationContains } from '../../../semantic/kernel/relationMembership';
import { relationFold, relationOptionFold, relationResolve, relationProject } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/relationFoundation';

export interface LoopNormalizer {
    readonly ensurePreHeader: (cfg: ControlFlowGraph, loopBlocks: readonly number[], headerId: number) => { readonly cfg: ControlFlowGraph; readonly preHeaderId: number };
}

export const createLoopNormalizer = (): LoopNormalizer => Object.freeze({
    ensurePreHeader: (cfg: ControlFlowGraph, loopBlocks: readonly number[], headerId: number) => relationOptionFold(
        basicBlockLookup(cfg.blocks, headerId),
        () => ({ cfg, preHeaderId: cfg.entryBlock }),
        header => {
            const outerPreds = relationFold(header.predecessors, [] as readonly number[], (output, predecessor) => relationResolve(relationContains(loopBlocks, predecessor), () => output, () => [...output, predecessor]));
            const existing = relationResolve(
                relationEqual(outerPreds.length, 1),
                () => relationOptionFold(basicBlockLookup(cfg.blocks, outerPreds[0]), () => false, block => relationEqual(block.successors.length, 1)),
                () => false,
            );
            return relationResolve(existing,
                () => ({ cfg, preHeaderId: outerPreds[0] }),
                () => {
                    const preHeaderId = Math.max(...basicBlockIds(cfg.blocks)) + 1;
                    const jump: Instruction = { kind: 'Jump', targetBlockId: headerId };
                    const preHeaderBlock: BasicBlock = { id: preHeaderId, instructions: [jump], successors: [headerId], predecessors: outerPreds };
                    const updated = relationFold(outerPreds, basicBlockReplace(cfg.blocks, preHeaderId, preHeaderBlock), (blocks, predId) => relationOptionFold(
                        basicBlockLookup(blocks, predId),
                        () => blocks,
                        pred => {
                            const nextSuccs = relationFold(pred.successors, [] as readonly number[], (output, successor) => [...output, relationResolve(relationEqual(successor, headerId), () => preHeaderId, () => successor)]);
                            const nextInsts = relationProject(pred.instructions, instruction => relationResolve(
                                relationEqual(instruction.kind, 'Jump'),
                                () => relationResolve(relationEqual((instruction as Extract<Instruction, { kind: 'Jump' }>).targetBlockId, headerId), () => ({ ...instruction, targetBlockId: preHeaderId }), () => instruction),
                                () => relationResolve(relationEqual(instruction.kind, 'Branch'),
                                    () => ({ ...instruction, trueBlockId: relationResolve(relationEqual((instruction as Extract<Instruction, { kind: 'Branch' }>).trueBlockId, headerId), () => preHeaderId, () => (instruction as Extract<Instruction, { kind: 'Branch' }>).trueBlockId), falseBlockId: relationResolve(relationEqual((instruction as Extract<Instruction, { kind: 'Branch' }>).falseBlockId, headerId), () => preHeaderId, () => (instruction as Extract<Instruction, { kind: 'Branch' }>).falseBlockId) }),
                                    () => instruction),
                            ));
                            return basicBlockReplace(blocks, predId, { ...pred, successors: nextSuccs, instructions: nextInsts });
                        },
                    ));
                    const nextHeaderPreds = relationFold(header.predecessors, [] as readonly number[], (output, predecessor) => relationResolve(relationContains(loopBlocks, predecessor), () => [...output, predecessor], () => output));
                    const finalBlocks = basicBlockReplace(updated, headerId, { ...header, predecessors: [...nextHeaderPreds, preHeaderId] });
                    const entry = relationResolve(relationEqual(cfg.entryBlock, headerId), () => preHeaderId, () => cfg.entryBlock);
                    return { cfg: createControlFlowGraph(entry, cfg.exitBlock, finalBlocks), preHeaderId };
                },
            );
        },
    ),
});

export const LoopNormalizer = Object.freeze({ ensurePreHeader: createLoopNormalizer().ensurePreHeader });

export interface LoopNormalizationResult { readonly cfg: ControlFlowGraph; readonly preHeaderId: number; }
export const ensurePreHeader = (cfg: ControlFlowGraph, loopBlocks: readonly number[], headerId: number): LoopNormalizationResult => createLoopNormalizer().ensurePreHeader(cfg, loopBlocks, headerId);
