/**
 * Instruction.ts
 * Low-level IR instructions for control flow and data operations
 * 
 * This module defines the instruction set for the RouteSync IR.
 * Instructions operate on operands and support control flow operations.
 */

import type { Operand } from './Operand';
import type { Expression } from './Expression';

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
