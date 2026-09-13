/**
 * blockInstructionRenamer.ts
 *
 * Instruction and phi renaming logic for basic blocks in SSA form.
 *
 * @module core/compiler/analysis/ssa/renamer
 */

import type { BasicBlock, Instruction, Operand } from '../../../utils/ControlFlowGraph';
import type { VariableVersionScope } from './variableVersionScope';

export function renameBlockInstructions(
    instructions: readonly Instruction[],
    scope: VariableVersionScope
): Instruction[] {
    const newInstructions: Instruction[] = [];

    // First, rename phi instructions
    for (const inst of instructions) {
        if (inst.kind === 'Phi') {
            const currentCount = scope.pushVersion(inst.target);
            newInstructions.push({
                kind: 'Phi',
                target: currentCount,
                incoming: inst.incoming
            });
        }
    }

    // Then, rename other instructions
    for (const inst of instructions) {
        if (inst.kind === 'Phi') continue;

        let renamedInst = inst;

        if (inst.kind === 'Assign') {
            const currentCount = scope.pushVersion(inst.target);
            renamedInst = {
                kind: 'Assign',
                target: currentCount,
                value: scope.renameOperand(inst.value)
            };
        } else if (inst.kind === 'Call') {
            if ('args' in inst) {
                renamedInst = {
                    ...inst,
                    args: inst.args.map((arg: Operand) => scope.renameOperand(arg))
                };
            }
        } else if (inst.kind === 'Return' && inst.value) {
            renamedInst = {
                kind: 'Return',
                value: scope.renameOperand(inst.value)
            };
        }

        newInstructions.push(renamedInst);
    }

    return newInstructions;
}

export function updateSuccessorPhis(
    blockId: number,
    successors: readonly number[],
    blocks: Map<number, BasicBlock>,
    scope: VariableVersionScope
): void {
    for (const succId of successors) {
        const succ = blocks.get(succId);
        if (succ) {
            const updatedInsts = succ.instructions.map(inst => {
                if (inst.kind === 'Phi') {
                    const incoming = new Map<number, Operand>(inst.incoming);

                    for (const [predId, op] of incoming) {
                        if (predId === blockId && op.kind === 'Variable') {
                            const activeVersion = scope.getActiveVersion(op.id) ?? op.id;
                            incoming.set(predId, { kind: 'SSAValue', id: activeVersion });
                        }
                    }

                    return { ...inst, incoming };
                }
                return inst;
            });

            blocks.set(succId, { ...succ, instructions: updatedInsts });
        }
    }
}
