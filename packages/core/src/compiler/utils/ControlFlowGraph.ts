import type { FileSpan } from "../types";
import type { SemanticType } from "../types";

export interface SymbolReference {
  readonly symbolId: number;
  readonly span: FileSpan;
}

export class ArrayConstant {
    readonly kind = 'ArrayConstant';
    constructor(readonly elements: readonly ConstantValue[]) { }
}

export class ClassConstant {
    readonly kind = 'ClassConstant';
    constructor(readonly namespace: string, readonly className: string) {}
}

export class EnumCase {
    readonly kind = 'EnumCase';
    constructor(readonly enumName: string, readonly caseName: string) {}
}

export type ConstantValue =
    | string
    | number
    | boolean
    | null
    | ArrayConstant
    | ClassConstant
    | EnumCase
    | SymbolReference;

export type Expression =
    | { kind: 'Literal'; value: ConstantValue }
    | { kind: 'Call'; callee: string; readonly arguments: readonly Expression[] }
    | { kind: 'PropertyAccess'; target: Expression; property: string }
    | { kind: 'MethodCall'; target: Expression; method: string; readonly arguments: readonly Expression[] };

export interface SemanticValue {
    readonly type: SemanticType;
    readonly constantValue?: ConstantValue;
}

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


/**
 * IR Instruction types.
 * 
 * Each instruction represents a single operation in the IR.
 * Supports data operations, control flow, function calls, and SSA form.
 * 
 * @example
 * ```typescript
 * const assign: Instruction = {
 *   kind: 'Assign',
 *   target: 1,
 *   value: { kind: 'Constant', value: 42 }
 * };
 * 
 * const branch: Instruction = {
 *   kind: 'Branch',
 *   condition: { kind: 'Variable', id: 1 },
 *   trueBlockId: 2,
 *   falseBlockId: 3
 * };
 * ```
 */
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

/**
 * Basic block - a sequence of instructions with a single entry and exit.
 * 
 * @example
 * ```typescript
 * const block: BasicBlock = {
 *   id: 0,
 *   instructions: [
 *     { kind: 'Assign', target: 1, value: { kind: 'Constant', value: 42 } },
 *     { kind: 'Return', value: { kind: 'Variable', id: 1 } }
 *   ],
 *   predecessors: [],
 *   successors: []
 * };
 * ```
 */
export interface BasicBlock {
    /** Unique block identifier */
    readonly id: number;
    /** Instructions in this block */
    readonly instructions: readonly (Expression | Instruction)[];
    /** IDs of successor blocks (control flow going out) */
    readonly successors: readonly number[];
    /** IDs of predecessor blocks (control flow coming in) */
    readonly predecessors: readonly number[];
}

/**
 * Control Flow Graph - represents program structure as basic blocks.
 * 
 * @example
 * ```typescript
 * const cfg: ControlFlowGraph = {
 *   entry: 0,
 *   blocks: new Map([
 *     [0, entryBlock],
 *     [1, loopBlock],
 *     [2, exitBlock]
 *   ])
 * };
 * ```
 */
export class ControlFlowGraph {
    constructor(
        public readonly entryBlock: number,
        public readonly exitBlock: number,
        public readonly blocks: ReadonlyMap<number, BasicBlock>
    ) { }
}