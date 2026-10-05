/** Relation-driven SSA variable renaming over the canonical CFG relation. */

import type { ControlFlowGraph, BasicBlockRelation, Expression, Instruction } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from '../DominatorAnalysis';
import { createVariableVersionScope, type VariableVersionScope } from './renamer/variableVersionScope';
import { renameBlockInstructions, updateSuccessorPhis } from './renamer';
import { basicBlockLookup, basicBlockReplace, createControlFlowGraph } from '../../utils/ControlFlowGraph';
import { relationAny, relationFold, relationOptionFold, relationResolve, relationVariantValue, relationRefine } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/relationFoundation';

export interface SSARenamer { readonly rename: (cfg: ControlFlowGraph, dom: DominatorTree) => ControlFlowGraph; }

const relationIsDefinition = (instruction: Expression | Instruction): boolean =>
    relationResolve(relationEqual(instruction.kind, 'Assign'), () => true, () => relationEqual(instruction.kind, 'Phi'));

const definitionTarget = (instruction: Expression | Instruction): number => relationOptionFold(
    relationRefine(instruction, (candidate): candidate is Extract<Instruction, { readonly kind: 'Assign' | 'Phi' }> =>
        relationAny([relationEqual(candidate.kind, 'Assign'), relationEqual(candidate.kind, 'Phi')])),
    () => { throw Error('SSA definition target requested for a non-definition instruction'); },
    value => relationResolve(relationEqual(value.kind, 'Assign'),
        () => relationVariantValue(value, 'Assign').target,
        () => relationVariantValue(value, 'Phi').target),
);

const initializeScope = (blocks: BasicBlockRelation): VariableVersionScope => relationFold(
    blocks,
    createVariableVersionScope(),
    (scope, entry) => relationFold(
        entry[1].instructions,
        scope,
        (current, instruction) => relationResolve(
            relationEqual(instruction.kind, 'Assign'),
            () => current.init(relationVariantValue(instruction, 'Assign').target),
            () => current,
        ),
    ),
);

const popDefinitions = (
    instructions: readonly (Expression | Instruction)[],
    scope: VariableVersionScope,
    index = 0,
): VariableVersionScope => relationResolve(
    index >= instructions.length,
    () => scope,
    () => {
        const instruction = instructions[index];
        const next = relationResolve(
            relationIsDefinition(instruction),
            () => scope.popVersion(definitionTarget(instruction)),
            () => scope,
        );
        return popDefinitions(instructions, next, index + 1);
    },
);

const renameBlock = (
    blockId: number,
    blocks: BasicBlockRelation,
    scope: VariableVersionScope,
    dom: DominatorTree,
): readonly [BasicBlockRelation, VariableVersionScope] => relationOptionFold(
    basicBlockLookup(blocks, blockId),
    () => [blocks, scope] as const,
    block => {
        const instructionFacts = relationFold(block.instructions, [] as readonly Instruction[], (facts, instruction) => relationOptionFold(
            relationRefine(instruction, (candidate): candidate is Instruction => relationAny([
                relationEqual(candidate.kind, 'Assign'), relationEqual(candidate.kind, 'Jump'), relationEqual(candidate.kind, 'Branch'),
                relationEqual(candidate.kind, 'Call'), relationEqual(candidate.kind, 'Return'), relationEqual(candidate.kind, 'Phi'),
                relationEqual(candidate.kind, 'LoadProperty'), relationEqual(candidate.kind, 'StoreProperty'),
            ])),
            () => facts,
            value => [...facts, value],
        ));
        const renamed = renameBlockInstructions(instructionFacts, scope);
        const withBlock = basicBlockReplace(blocks, blockId, Object.freeze({ ...block, instructions: renamed.instructions }));
        const withSuccessorPhis = updateSuccessorPhis(blockId, block.successors, withBlock, renamed.scope);
        const descended = relationFold(dom.getChildren(blockId), [withSuccessorPhis, renamed.scope] as const, (state, childId) => renameBlock(childId, state[0], state[1], dom));
        return [descended[0], popDefinitions(block.instructions, descended[1])] as const;
    },
);

export const createSSARenamer = (): SSARenamer => Object.freeze({
    rename: (cfg: ControlFlowGraph, dom: DominatorTree) => {
        const initialized = initializeScope(cfg.blocks);
        const [blocks] = renameBlock(cfg.entryBlock, cfg.blocks, initialized, dom);
        return createControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    },
});

export const SSARenamer = Object.freeze({ create: createSSARenamer });
export const renameSSA = (cfg: ControlFlowGraph, dom: DominatorTree): ControlFlowGraph => createSSARenamer().rename(cfg, dom);
