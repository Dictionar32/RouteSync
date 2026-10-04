/**
 * instructions.ts
 *
 * Operand and IR instruction definitions for control flow graphs.
 *
 * @module compiler/utils/cfg
 */

export type Operand =
    | {
        /** Constant value operand */
        kind: 'Constant';
        /** The constant value */
        value: import('./constants').ConstantValue;
    }
    | {
        /** Variable operand (mutable) */
        kind: 'Variable';
        /** Variable ID */
        id: number;
    }
    | {
        /** SSA (Static Single Assignment) value operand */
        kind: 'SSAValue';
        /** SSA value ID */
        id: number;
    };

export type ReturnValue =
    | { readonly kind: 'return_value'; readonly value: Operand }
    | { readonly kind: 'return_void' };

export interface AssignInstruction {
    readonly kind: 'Assign';
    readonly target: number;
    readonly value: Operand;
}

export interface JumpInstruction {
    readonly kind: 'Jump';
    readonly targetBlockId: number;
}

export interface BranchInstruction {
    readonly kind: 'Branch';
    readonly condition: Operand;
    readonly trueBlockId: number;
    readonly falseBlockId: number;
}

export interface CallInstruction {
    readonly kind: 'Call';
    readonly target: string;
    readonly args: readonly Operand[];
}

export interface ReturnInstruction {
    readonly kind: 'Return';
    readonly value: ReturnValue;
}

export interface PhiInstruction {
    readonly kind: 'Phi';
    readonly target: number;
    readonly incoming: readonly (readonly [number, Operand])[];
}

export interface LoadPropertyInstruction {
    readonly kind: 'LoadProperty';
    readonly target: number;
    readonly obj: Operand;
    readonly property: string;
}

export interface StorePropertyInstruction {
    readonly kind: 'StoreProperty';
    readonly obj: Operand;
    readonly property: string;
    readonly value: Operand;
}

export type Instruction =
    | AssignInstruction
    | JumpInstruction
    | BranchInstruction
    | CallInstruction
    | ReturnInstruction
    | PhiInstruction
    | LoadPropertyInstruction
    | StorePropertyInstruction;
