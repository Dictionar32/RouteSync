/**
 * @fileoverview Relation-driven CFG verifier.
 *
 * CFG topology is a semantic relation. Verification therefore consumes the
 * canonical relation-backed CFG interface instead of reaching into Map-like
 * host state.
 */

import { Verifier } from './Verifier';
import { VerifierPhase, type VerificationContext } from './VerificationContext';
import type { BasicBlock, ControlFlowGraph } from '../utils/ControlFlowGraph';
import {
    relationAll,
    relationAny,
    relationEqual,
    relationNotEqual,
    relationOptionFold,
    relationResolve,
} from '../../semantic/foundation/relationFoundation';
import { relationContains } from '../../semantic/foundation/relationMembership';
import { basicBlockLookup } from '../utils/ControlFlowGraph';

const instructionIsTerminator = (instruction: BasicBlock['instructions'][number]): boolean =>
    relationAny([
        relationEqual(instruction.kind, 'Jump'),
        relationEqual(instruction.kind, 'Branch'),
        relationEqual(instruction.kind, 'Return'),
    ]);

const terminatorInvariant = (
    instructions: BasicBlock['instructions'],
    blockId: number,
    index = 0,
    foundTerminator = false,
): void => relationResolve(
    index >= instructions.length,
    () => {},
    () => {
        const instruction = instructions[index];
        const isTerminator = instructionIsTerminator(instruction);
        relationResolve(
            foundTerminator,
            () => { throw new Error(`CFG Invariant violated: instruction placed after terminator in block ${blockId}`); },
            () => relationResolve(
                relationAll([isTerminator, relationNotEqual(index, instructions.length - 1)]),
                () => { throw new Error(`CFG Invariant violated: terminator instruction is not the last instruction in block ${blockId}`); },
                () => terminatorInvariant(instructions, blockId, index + 1, isTerminator),
            ),
        );
    },
);

const verifySuccessors = (cfg: ControlFlowGraph, block: BasicBlock, index = 0): void => relationResolve(
    index >= block.successors.length,
    () => {},
    () => {
        const successor = block.successors[index];
        relationOptionFold(
            basicBlockLookup(cfg.blocks, successor),
            () => { throw new Error(`CFG Invariant violated: block ${block.id} points to non-existent successor block ${successor}`); },
            succBlock => relationResolve(
                relationContains(succBlock.predecessors, block.id),
                () => verifySuccessors(cfg, block, index + 1),
                () => { throw new Error(`CFG Invariant violated: block ${successor} is successor of ${block.id} but does not list it as predecessor`); },
            ),
        );
    },
);

const verifyPredecessors = (cfg: ControlFlowGraph, block: BasicBlock, index = 0): void => relationResolve(
    index >= block.predecessors.length,
    () => {},
    () => {
        const predecessor = block.predecessors[index];
        relationOptionFold(
            basicBlockLookup(cfg.blocks, predecessor),
            () => { throw new Error(`CFG Invariant violated: block ${block.id} lists non-existent predecessor block ${predecessor}`); },
            predBlock => relationResolve(
                relationContains(predBlock.successors, block.id),
                () => verifyPredecessors(cfg, block, index + 1),
                () => { throw new Error(`CFG Invariant violated: block ${predecessor} is predecessor of ${block.id} but does not list it as successor`); },
            ),
        );
    },
);

const verifyBlock = (cfg: ControlFlowGraph, block: BasicBlock): void => {
    relationResolve(
        relationEqual(block.instructions.length, 0),
        () => { throw new Error(`CFG Invariant violated: basic block ${block.id} is empty and lacks a terminator`); },
        () => {},
    );
    verifySuccessors(cfg, block);
    verifyPredecessors(cfg, block);
    terminatorInvariant(block.instructions, block.id);
    const containsTerminator = (index: number): boolean => relationResolve(
        index >= block.instructions.length,
        () => false,
        () => relationResolve(
            instructionIsTerminator(block.instructions[index]),
            () => true,
            () => containsTerminator(index + 1),
        ),
    );
    const foundTerminator = containsTerminator(0);
    relationResolve(
        relationAll([!foundTerminator, block.successors.length > 0]),
        () => { throw new Error(`CFG Invariant violated: block ${block.id} has successors but no terminator instruction`); },
        () => {},
    );
};

const verifyBlocks = (cfg: ControlFlowGraph, index = 0): void => relationResolve(
    index >= cfg.blocks.length,
    () => {},
    () => {
        verifyBlock(cfg, cfg.blocks[index][1]);
        verifyBlocks(cfg, index + 1);
    },
);

/** Control-flow graph verifier over the canonical relation-backed CFG. */
export class CFGVerifier extends Verifier {
    public readonly phase = VerifierPhase.PreOptimization;

    public static verify(cfg: VerificationContext['cfg']): void {
        new CFGVerifier().verify({ cfg });
    }

    public verify(context: VerificationContext): void {
        const cfg = context.cfg;
        relationOptionFold(
            basicBlockLookup(cfg.blocks, cfg.entryBlock),
            () => {},
            block => relationResolve(
                block.predecessors.length > 0,
                () => { throw new Error(`CFG Invariant violated: entry block ${cfg.entryBlock} has predecessor blocks`); },
                () => {},
            ),
        );
        relationOptionFold(
            basicBlockLookup(cfg.blocks, cfg.exitBlock),
            () => {},
            block => relationResolve(
                block.successors.length > 0,
                () => { throw new Error(`CFG Invariant violated: exit block ${cfg.exitBlock} has successor blocks`); },
                () => {},
            ),
        );
        verifyBlocks(cfg);
    }
}
