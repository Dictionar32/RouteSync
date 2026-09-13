/**
 * ControlFlowGraph.ts
 * Control flow graph, basic blocks, instructions, and constants.
 * Active Consumer delegating to focused CFG sub-domain modules.
 *
 * @module compiler/utils/ControlFlowGraph
 */

export {
    type SymbolReference,
    ArrayConstant,
    ClassConstant,
    EnumCase,
    type ConstantValue,
    type Expression,
    type SemanticValue,
    type Operand,
    type Instruction,
    type BasicBlock,
    ControlFlowGraph
} from './cfg';