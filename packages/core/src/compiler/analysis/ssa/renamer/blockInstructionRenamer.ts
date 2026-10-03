/** Relation-driven instruction and phi renaming. */
import { basicBlockLookup, basicBlockReplace, type Instruction, type Operand, type Expression, type BasicBlockRelation } from '../../../utils/ControlFlowGraph';
import type { VariableVersionScope } from './variableVersionScope';
import { relationOptionFold, relationResolve, relationProject, relationAll } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/relationFoundation';

export interface RenamedBlockInstructions {
    readonly instructions: readonly (Expression | Instruction)[];
    readonly scope: VariableVersionScope;
}

const renamePhiIncoming = (
    incoming: readonly (readonly [number, Operand])[],
    predecessor: number,
    scope: VariableVersionScope,
    index = 0,
    output: readonly (readonly [number, Operand])[] = [],
): readonly (readonly [number, Operand])[] => relationResolve(
    relationEqual(index, incoming.length),
    () => Object.freeze(output),
    () => {
        const pair = incoming[index];
        const next = relationResolve(
            relationAll([relationEqual(pair[0], predecessor), relationEqual(pair[1].kind, 'Variable')]),
            () => [...output, [pair[0], relationOptionFold(scope.getActiveVersion((pair[1] as Extract<Operand, { kind: 'Variable' }>).id), () => pair[1], value => ({ kind: 'SSAValue' as const, id: value }))] as const],
            () => [...output, pair],
        );
        return renamePhiIncoming(incoming, predecessor, scope, index + 1, next);
    },
);

export const renameBlockInstructions = (
    instructions: readonly (Expression | Instruction)[],
    scope: VariableVersionScope,
    index = 0,
    output: readonly (Expression | Instruction)[] = [],
): RenamedBlockInstructions => relationResolve(
    relationEqual(index, instructions.length),
    () => ({ instructions: Object.freeze(output), scope }),
    () => {
        const inst = instructions[index];
        const renamed = relationResolve(
            relationEqual(inst.kind, 'Phi'),
            () => {
                const [nextScope, version] = scope.pushVersion((inst as Extract<Instruction, { kind: 'Phi' }>).target);
                return { instruction: { kind: 'Phi', target: version, incoming: (inst as Extract<Instruction, { kind: 'Phi' }>).incoming } as Instruction, scope: nextScope };
            },
            () => relationResolve(
                relationEqual(inst.kind, 'Assign'),
                () => {
                    const [nextScope, version] = scope.pushVersion((inst as Extract<Instruction, { kind: 'Assign' }>).target);
                    return { instruction: { kind: 'Assign', target: version, value: scope.renameOperand((inst as Extract<Instruction, { kind: 'Assign' }>).value) } as Instruction, scope: nextScope };
                },
                () => relationResolve(
                    relationAll([relationEqual(inst.kind, 'Call'), Object.prototype.hasOwnProperty.call(inst, 'target')]),
                    () => ({ instruction: { ...inst, args: relationProject((inst as Extract<Instruction, { kind: 'Call' }>).args, argument => scope.renameOperand(argument)) } as Instruction, scope }),
                    () => relationResolve(
                        relationEqual(inst.kind, 'Return'),
                        () => relationOptionFold(
                            relationResolve(Object.prototype.hasOwnProperty.call(inst, 'value'), () => ({ kind: 'some' as const, value: (inst as Extract<Instruction, { kind: 'Return' }>).value as Operand }), () => ({ kind: 'none' as const })),
                            () => ({ instruction: inst, scope }),
                            value => ({ instruction: { kind: 'Return', value: scope.renameOperand(value) } as Instruction, scope }),
                        ),
                        () => ({ instruction: inst, scope }),
                    ),
                ),
            ),
        );
        return renameBlockInstructions(instructions, renamed.scope, index + 1, [...output, renamed.instruction]);
    },
);

export const updateSuccessorPhis = (
    blockId: number,
    successors: readonly number[],
    blocks: BasicBlockRelation,
    scope: VariableVersionScope,
    index = 0,
    output = blocks,
): BasicBlockRelation => relationResolve(
    relationEqual(index, successors.length),
    () => output,
    () => {
        const successorId = successors[index];
        const successor = basicBlockLookup(output, successorId);
        const next = relationOptionFold(
            successor,
            () => output,
            block => basicBlockReplace(output, successorId, Object.freeze({
                ...block,
                instructions: relationProject(block.instructions, instruction => relationResolve(
                    relationEqual(instruction.kind, 'Phi'),
                    () => ({ ...instruction, incoming: renamePhiIncoming((instruction as Extract<Instruction, { kind: 'Phi' }>).incoming, blockId, scope) } as Instruction),
                    () => instruction,
                )),
            })),
        );
        return updateSuccessorPhis(blockId, successors, next, scope, index + 1, next);
    },
);
