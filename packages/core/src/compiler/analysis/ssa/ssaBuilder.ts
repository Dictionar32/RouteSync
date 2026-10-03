/** Relation-driven SSA phi placement. */

import type { ControlFlowGraph, BasicBlock, Instruction, Operand } from '../../utils/ControlFlowGraph';
import { basicBlockLookup, basicBlockReplace, createControlFlowGraph, type BasicBlockRelation } from '../../utils/ControlFlowGraph';
import type { DominanceFrontier } from '../DominatorAnalysis';
import { relationContains, relationInsert } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationResolve, relationEqual } from '../../../semantic/kernel/relationFoundation';
import { relationVariantValue } from '../../../semantic/kernel/relationalSequence';
import { relationAll, relationFold } from '../../../semantic/kernel/relationalSequence';

export interface SSAPhiFacts {
    readonly definition: readonly (readonly [number, number])[];
    readonly required: readonly (readonly [number, number])[];
    readonly incoming: readonly (readonly [number, number, Operand])[];
}

const definitionFacts = (
    cfg: ControlFlowGraph,
    variables: readonly number[],
    variableIndex = 0,
    blocks: BasicBlockRelation = cfg.blocks,
): readonly (readonly [number, number])[] => relationResolve(
    variableIndex >= variables.length,
    () => [],
    () => {
        const variable = variables[variableIndex];
        const facts = relationFold(
            blocks,
            [] as readonly (readonly [number, number])[],
            (output, entry) => relationFold(
                entry[1].instructions,
                output,
                (facts, instruction) => relationResolve(
                    relationAll([relationEqual(instruction.kind, 'Assign'), relationEqual(relationVariantValue(instruction, 'Assign').target, variable)]),
                    () => [...facts, [variable, entry[0]] as const],
                    () => facts,
                ),
            ),
        );
        return [...facts, ...definitionFacts(cfg, variables, variableIndex + 1, blocks)];
    },
);

const phiRequiredFacts = (
    cfg: ControlFlowGraph,
    df: DominanceFrontier,
    definitions: readonly (readonly [number, number])[],
    index = 0,
    facts: readonly (readonly [number, number])[] = [],
): readonly (readonly [number, number])[] => relationResolve(
    index >= definitions.length,
    () => facts,
    () => {
        const variable = definitions[index][0];
        const block = definitions[index][1];
        const frontier = df.getFrontier(block);
        const next = relationFold(frontier, facts, (acc, join) =>
            relationResolve(relationContains(acc, [variable, join] as const), () => acc, () => relationInsert(acc, [variable, join] as const)));
        return phiRequiredFacts(cfg, df, definitions, index + 1, next);
    },
);

const incomingFacts = (
    cfg: ControlFlowGraph,
    required: readonly (readonly [number, number])[],
    index = 0,
    facts: readonly (readonly [number, number, Operand])[] = [],
): readonly (readonly [number, number, Operand])[] => relationResolve(
    index >= required.length,
    () => facts,
    () => {
        const variable = required[index][0];
        const join = required[index][1];
        const block = basicBlockLookup(cfg.blocks, join);
        const next = relationOptionFold(
            block,
            () => facts,
            value => relationFold(
                value.predecessors,
                facts,
                (acc, predecessor) => [...acc, [variable, predecessor, { kind: 'Variable', id: variable }] as const],
            ),
        );
        return incomingFacts(cfg, required, index + 1, next);
    },
);

const phiFacts = (cfg: ControlFlowGraph, df: DominanceFrontier, variables: readonly number[]): SSAPhiFacts => {
    const definition = definitionFacts(cfg, variables);
    const required = phiRequiredFacts(cfg, df, definition);
    const incoming = incomingFacts(cfg, required);
    return Object.freeze({ definition, required, incoming });
};

const applyPhiFacts = (
    cfg: ControlFlowGraph,
    facts: SSAPhiFacts,
    entries: BasicBlockRelation = cfg.blocks,
    index = 0,
    output: BasicBlockRelation = [],
): BasicBlockRelation => relationResolve(
    index >= entries.length,
    () => Object.freeze(output),
    () => {
        const [blockId, block] = entries[index];
        const variables = relationFold(
            facts.required,
            [] as readonly number[],
            (acc, fact) => relationResolve(relationEqual(fact[1], blockId), () => relationInsert(acc, fact[0]), () => acc),
        );
        const phis = relationFold(
            variables,
            [] as readonly Instruction[],
            (acc, variable) => {
                const incoming = relationFold(
                    facts.incoming,
                    [] as readonly (readonly [number, Operand])[],
                    (pairs, fact) => relationResolve(relationAll([relationEqual(fact[0], variable), relationContains(block.predecessors, fact[1])]), () => [...pairs, [fact[1], fact[2]] as const], () => pairs),
                );
                return [...acc, { kind: 'Phi' as const, target: variable, incoming: Object.freeze(incoming) }];
            },
        );
        const nextBlock = relationResolve(
            relationEqual(phis.length, 0),
            () => block,
            () => Object.freeze({ ...block, instructions: [...phis, ...block.instructions] }),
        );
        return applyPhiFacts(cfg, facts, entries, index + 1, [...output, [blockId, nextBlock] as const]);
    },
);

export const insertPhiNodes = (
    cfg: ControlFlowGraph,
    df: DominanceFrontier,
    variables: readonly number[],
): ControlFlowGraph => {
    const facts = phiFacts(cfg, df, variables);
    return createControlFlowGraph(cfg.entryBlock, cfg.exitBlock, applyPhiFacts(cfg, facts));
};

export const SSABuilder = Object.freeze({ insertPhiNodes });
