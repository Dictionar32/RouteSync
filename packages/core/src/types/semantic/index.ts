/**
 * index.ts
 *
 * Coordinating barrel for the semantic sub-domain.
 * Active consumer and unified surface for semantic IR v2.
 *
 * @module core/types/semantic
 */

export * from './nominalVocabulary';
export * from './sourceProvenance';
export * from './irHints';
export * from './semanticTypes';
export * from './semanticRelations';
export * from './modelGraphTypes';
export * from './serviceGraphTypes';
export * from './kernelTypes';
export * from './zodAstTypes';
export * from './sdkContracts';

// Re-exports from contract & semanticCollections for backward compatibility
export {
  type ModelFieldInfo,
  type ModelFieldEntry,
  ModelFieldMap,
  type ModelRelationInfo,
  type ModelRelationEntry,
  ModelRelationMap,
  type ModelAccessorInfo,
  type ModelAccessorEntry,
  ModelAccessorMap,
  type ModelServiceEntry,
  ModelServiceMap,
  type ModelControllerEntry,
  ModelControllerMap,
  type ModelNodeEntry,
  ModelNodeMap,
  type SemanticModelEntry,
  SemanticModelMap,
  type SemanticRelationEntry,
  SemanticRelationMap
} from '../domain/semanticCollections';

export {
  type ResolutionStatus,
  type SemanticTraceNode,
  type SemanticResolution,
  type JsonObjectResolution,
  type AccessKind,
  type JsonMemberResolution
} from '../contract';
