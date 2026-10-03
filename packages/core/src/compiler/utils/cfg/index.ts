/** Explicit CFG sub-domain exports. */
export {
    type SymbolReference,
    ArrayConstant,
    ClassConstant,
    EnumCase,
    type ConstantValue,
    type Expression,
    type SemanticValue
} from './constants';
export { type Operand, type Instruction, type ReturnValue } from './instructions';
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
} from './basicBlock';
