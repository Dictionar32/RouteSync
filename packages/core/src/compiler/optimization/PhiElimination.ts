/**
 * @fileoverview Phi Elimination - remove SSA phi nodes through CFG relations.
 *
 * The canonical CFG is a relation-backed semantic structure.  This pass keeps
 * the transformation in the relation algebra: instruction classification,
 * predecessor lookup, and sequence reconstruction are all expressed as
 * relation folds rather than a second imperative CFG model.
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import {
    basicBlockLookup,
    basicBlockReplace,
    createControlFlowGraph,
    type BasicBlockRelation,
} from '../utils/ControlFlowGraph';
import type { Instruction, PhiInstruction } from '../utils/cfg/instructions';
import type { Expression } from '../utils/cfg/constants';
import {
    relationEqual,
    relationFold,
    relationIndexOf,
    relationOptionFold,
    relationResolve,
    relationAny,
    relationVariantFold,
} from '../../semantic/foundation/relationalSequence';

const isTerminator = (instruction: Expression | Instruction): boolean =>
    relationAny([
        relationEqual(instruction.kind, 'Jump'),
        relationEqual(instruction.kind, 'Branch'),
        relationEqual(instruction.kind, 'Return'),
    ]);

const splitPhi = (
    instructions: readonly (Expression | Instruction)[],
): readonly [PhiInstruction[], (Expression | Instruction)[]] =>
    relationFold<Expression | Instruction, [PhiInstruction[], (Expression | Instruction)[]]>(
        instructions,
        [[], []],
        ([phis, retained], instruction) => relationVariantFold(
            instruction,
            'Phi',
            () => [phis, [...retained, instruction]],
            phi => [[...phis, phi], retained],
        ),
    );

const insertBeforeTerminator = (
    instructions: readonly (Expression | Instruction)[],
    copy: Instruction,
): readonly (Expression | Instruction)[] => {
    const terminatorIndex = relationIndexOf(instructions, isTerminator);
    return relationResolve(
        terminatorIndex < 0,
        () => [...instructions, copy],
        () => [
            ...instructions.slice(0, terminatorIndex),
            copy,
            ...instructions.slice(terminatorIndex),
        ],
    );
};

export class PhiEliminator {
    public static eliminate(cfg: ControlFlowGraph): ControlFlowGraph {
        const initialBlocks: BasicBlockRelation = cfg.blocks;
        const blocks = relationFold(
            [...cfg.blocks],
            initialBlocks,
            (currentBlocks, entry) => {
                const blockId = entry[0];
                const block = entry[1];
                const [phiNodes, retained] = splitPhi(block.instructions);
                const afterPhis = relationFold(
                    phiNodes,
                    currentBlocks,
                    (afterPhi, phi) => relationFold(
                        phi.incoming,
                        afterPhi,
                        (afterIncoming, incoming) => {
                            const predId = incoming[0];
                            const operand = incoming[1];
                            return relationOptionFold(
                                basicBlockLookup(afterIncoming, predId),
                                () => afterIncoming,
                                (predBlock: BasicBlock) => basicBlockReplace(
                                    afterIncoming,
                                    predId,
                                    {
                                        ...predBlock,
                                        instructions: insertBeforeTerminator(
                                            predBlock.instructions,
                                            {
                                                kind: 'Assign',
                                                target: phi.target,
                                                value: operand,
                                            },
                                        ),
                                    },
                                ),
                            );
                        },
                    ),
                );
                return basicBlockReplace(afterPhis, blockId, {
                    ...block,
                    instructions: retained,
                });
            },
        );

        return createControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}
