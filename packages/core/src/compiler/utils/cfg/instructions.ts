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
        value: unknown;
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

export type Instruction =
    | {
        /** Assign a value to a target */
        kind: 'Assign';
        /** Target identifier */
        target: number;
        /** Value to assign */
        value: Operand;
    }
    | {
        /** Unconditional jump to a block */
        kind: 'Jump';
        /** Target basic block ID */
        targetBlockId: number;
    }
    | {
        /** Conditional branch based on a condition */
        kind: 'Branch';
        /** Condition operand (must evaluate to boolean) */
        condition: Operand;
        /** Block to jump to if condition is true */
        trueBlockId: number;
        /** Block to jump to if condition is false */
        falseBlockId: number;
    }
    | {
        /** Function or method call */
        kind: 'Call';
        /** Target function/method name */
        target: string;
        /** Call arguments */
        args: readonly Operand[];
    }
    | {
        /** Return from current function */
        kind: 'Return';
        /** Optional return value */
        value?: Operand;
    }
    | {
        /** Phi node for SSA form - merges values from different control flow paths */
        kind: 'Phi';
        /** Target for phi result */
        target: number;
        /** Map from predecessor block ID to operand value */
        incoming: ReadonlyMap<number, Operand>;
    }
    | {
        /** Load a property from an object */
        kind: 'LoadProperty';
        /** Target to store result */
        target: number;
        /** Object operand */
        obj: Operand;
        /** Property name to load */
        property: string;
    }
    | {
        /** Store a value to an object property */
        kind: 'StoreProperty';
        /** Object operand */
        obj: Operand;
        /** Property name to store to */
        property: string;
        /** Value to store */
        value: Operand;
    };
