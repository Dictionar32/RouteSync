/** Relation-backed control-flow graph facade. */

export {
    type SymbolReference,
    ArrayConstant,
    ClassConstant,
    EnumCase,
    type ConstantValue,
    type Expression,
    type SemanticValue,
    type Operand,
    type Instruction
} from './cfg';

export {
    type BasicBlock,
    type BasicBlockRelation,
    type ControlFlowGraph,
    createBasicBlockRelation,
    basicBlockLookup,
    basicBlockReplace,
    basicBlockEntries,
    basicBlockIds,
    createControlFlowGraph
} from './cfg/basicBlock';
