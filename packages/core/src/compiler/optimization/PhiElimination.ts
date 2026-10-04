/**
 * @fileoverview Phi Elimination - Remove phi nodes from SSA form
 *
 * Transforms SSA form back to conventional form by replacing phi nodes with
 * copy instructions in predecessor blocks.
 *
 * The CFG relation is the canonical instruction/block authority.  This pass
 * therefore updates the relation directly instead of maintaining a second
 * Map-backed CFG model.
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import {
    basicBlockLookup,
    basicBlockReplace,
    createControlFlowGraph,
    type BasicBlockRelation,
} from '../utils/ControlFlowGraph';
import type { Instruction } from '../utils/cfg/instructions';
import type { Expression } from '../utils/cfg/constants';
import { relationIsSome, relationGate } from '../../semantic/kernel/relationFoundation';

export class PhiEliminator {
    public static eliminate(cfg: ControlFlowGraph): ControlFlowGraph {
        let blocks: BasicBlockRelation = cfg.blocks;

        const blockEntries = [...cfg.blocks];
        for (const entry of blockEntries) {
            const blockId = entry[0];
            const block = entry[1];
            const phiNodes: Instruction[] = [];
            const nonPhiNodes: readonly (Expression | Instruction)[] = [];

            for (const inst of block.instructions) {
                if (inst.kind === 'Phi') {
                    phiNodes.push(inst);
                }
            }

            const retained: (Expression | Instruction)[] = [];
            for (const inst of block.instructions) {
                if (inst.kind !== 'Phi') retained.push(inst);
            }

            if (phiNodes.length === 0) continue;

            for (const phi of phiNodes) {
                if (phi.kind !== 'Phi') continue;

                for (const incoming of phi.incoming) {
                    const predId = incoming[0];
                    const operand = incoming[1];
                    const predBlockOption = basicBlockLookup(blocks, predId);
                    blocks = relationGate(
                        relationIsSome(predBlockOption),
                        () => {
                            const predBlock = predBlockOption.value;
                            const copyInst: Instruction = {
                                kind: 'Assign',
                                target: phi.target,
                                value: operand,
                            };

                            const terminatorIndex = predBlock.instructions.findIndex(inst =>
                                inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return'
                            );

                            const nextInstructions = [...predBlock.instructions];
                            if (terminatorIndex === -1) {
                                nextInstructions.push(copyInst);
                            } else {
                                nextInstructions.splice(terminatorIndex, 0, copyInst);
                            }

                            return basicBlockReplace(blocks, predId, {
                                ...predBlock,
                                instructions: nextInstructions,
                            });
                        },
                        () => blocks,
                    );
                }
            }

            const nextBlock: BasicBlock = {
                ...block,
                instructions: retained,
            };
            blocks = basicBlockReplace(blocks, blockId, nextBlock);
        }

        return createControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}
