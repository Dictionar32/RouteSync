/**
 * IR Module
 * Barrel export for Intermediate Representation functionality
 */

export type { SymbolReference, ConstantValue, Expression } from './Expression';
export { ArrayConstant, ClassConstant, EnumCase } from '../utils/cfg/constants';

export type { SemanticIRNodeKind, IRNodeId, SemanticOrigin, SemanticIRNode } from './SemanticIR';
export { SemanticIRArena } from './SemanticIR';

export type { NodeId, ContractBaseNode, ContractNode, ContractVisitor } from './ContractGraph';
export { EntityNode, SchemaNode, RelationNode, ContractGraph, ContractGraphBuilder } from './ContractGraph';

export type { Operand } from './Operand';
export type { Instruction } from './Instruction';
export type { BasicBlock, BasicBlockRelation, ControlFlowGraph } from '../utils/cfg/basicBlock';
export { createBasicBlockRelation, basicBlockLookup, basicBlockReplace, basicBlockEntries, basicBlockIds, createControlFlowGraph } from '../utils/cfg/basicBlock';

export type { SemanticDataflowIRNode, SemanticDataflowIRRelation, SemanticDataflowIRProjection } from './SemanticDataflowIRProjectionTypes';
export type { SemanticDataflowIRProjectionInterface } from './SemanticDataflowIRProjectionInterface';
export { projectSemanticDataflowToIR, semanticDataflowIRProjection } from './SemanticDataflowIRProjection';
