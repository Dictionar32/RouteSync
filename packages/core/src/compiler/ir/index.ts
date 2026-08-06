/**
 * IR Module
 * Barrel export for Intermediate Representation functionality
 */

export type { SymbolReference, ConstantValue, Expression } from './Expression';
export { ArrayConstant, ClassConstant, EnumCase } from './Expression';

export type { SemanticIRNodeKind, IRNodeId, SemanticOrigin, SemanticIRNode } from './SemanticIR';
export { SemanticIRArena } from './SemanticIR';

export type { NodeId, ContractBaseNode, ContractNode, ContractVisitor } from './ContractGraph';
export { EntityNode, SchemaNode, RelationNode, ContractGraph, ContractGraphBuilder } from './ContractGraph';

export type { Operand } from './Operand';
export type { Instruction, BasicBlock } from './Instruction';
