/**
 * Operand.ts
 * Operand types for IR instructions
 * 
 * Operands represent values that instructions can operate on.
 */

/**
 * Operand - represents a value source in IR instructions.
 * 
 * @example
 * ```typescript
 * const constant: Operand = { kind: 'Constant', value: 42 };
 * const variable: Operand = { kind: 'Variable', id: 1 };
 * const ssa: Operand = { kind: 'SSAValue', id: 2 };
 * ```
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
