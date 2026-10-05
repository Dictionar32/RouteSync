/** Relation-driven instruction and phi renaming. */
import { basicBlockLookup, basicBlockReplace, type Instruction, type Operand, type Expression, type BasicBlockRelation } from '../../../utils/ControlFlowGraph';
import type { VariableVersionScope } from './variableVersionScope';
import { relationAll, relationRefine, relationOptionFold, relationResolve, relationProject, relationVariantValue } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/relationFoundation';

export interface RenamedBlockInstructions {
    readonly instructions: readonly (Expression | Instruction)[];
    readonly scope: VariableVersionScope;
}

const renamedPhi = (target: number, incoming: readonly (readonly [number, Operand])[]): Instruction => ({ kind: 'Phi', target, incoming });
const renamedAssign = (target: number, value: Operand): Instruction => ({ kind: 'Assign', target, value });
const renamedCall = (target: string, args: readonly Operand[]): Instruction => ({ kind: 'Call', target, args });
const renamedReturn = (value: Operand): Instruction => ({ kind: 'Return', value: { kind: 'return_value', value } });
const renamedSsaValue = (id: number): Operand => ({ kind: 'SSAValue', id });


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
            () => [...output, [pair[0], relationOptionFold(scope.getActiveVersion(relationVariantValue(pair[1], 'Variable').id), () => pair[1], value => renamedSsaValue(value))] as const],
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
                const [nextScope, version] = scope.pushVersion(relationVariantValue(inst, 'Phi').target);
                return { instruction: renamedPhi(version, relationVariantValue(inst, 'Phi').incoming), scope: nextScope };
            },
            () => relationResolve(
                relationEqual(inst.kind, 'Assign'),
                () => {
                    const [nextScope, version] = scope.pushVersion(relationVariantValue(inst, 'Assign').target);
                    return { instruction: renamedAssign(version, scope.renameOperand(relationVariantValue(inst, 'Assign').value)), scope: nextScope };
                },
                () => relationResolve(
                    relationEqual(inst.kind, 'Call'),
                    () => relationOptionFold(
                        relationRefine(inst, (candidate): candidate is Extract<Instruction, { readonly kind: 'Call' }> => relationAll([relationEqual(candidate.kind, 'Call'), Object.hasOwn(candidate, 'target')])),
                        () => ({ instruction: inst, scope }),
                        call => ({ instruction: renamedCall(call.target, relationProject(call.args, argument => scope.renameOperand(argument))), scope }),
                    ),
                    () => relationResolve(
                        relationEqual(inst.kind, 'Return'),
                        () => {
                            const returned = relationVariantValue(inst, 'Return');
                            return relationResolve(
                                relationEqual(returned.value.kind, 'return_value'),
                                () => ({ instruction: renamedReturn(scope.renameOperand(relationVariantValue(returned.value, 'return_value').value)), scope }),
                                () => ({ instruction: inst, scope }),
                            );
                        },
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
                    () => renamedPhi(relationVariantValue(instruction, 'Phi').target, renamePhiIncoming(relationVariantValue(instruction, 'Phi').incoming, blockId, scope)),
                    () => instruction,
                )),
            })),
        );
        return updateSuccessorPhis(blockId, successors, next, scope, index + 1, next);
    },
);
