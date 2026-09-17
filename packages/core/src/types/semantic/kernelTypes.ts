/**
 * kernelTypes.ts
 *
 * Semantic IR node metadata, compilation context, and Kernel v2 interface.
 *
 * @module core/types/semantic
 */

import type {
  SemanticModelMap,
  SemanticRelationMap
} from '../domain/semanticCollections';
import type { SourceRef } from './sourceProvenance';
import type { IRRawNode } from './irHints';
import type { FieldNode } from '../field';
import type { SemanticNode, SemanticType } from './semanticTypes';
import type { SemanticRelation } from './semanticRelations';
import type { ExecutionLayer, ServiceModelNode } from './modelGraphTypes';
import type { ServiceNode, ControllerNode } from './serviceGraphTypes';

export interface IRMeta {
  version: "ir.v2";
  stableHash: string;
  lineage: string[];
  createdAt?: string;
  tags?: string[];
}

export interface SemanticIRNode {
  id: string;
  source: SourceRef;
  node: IRRawNode;
  semantic: SemanticNode;
  meta: IRMeta;
  context?: IRContext;
}

export interface IRContext {
  modelMap: SemanticModelMap<SemanticType>;
  relationMap: SemanticRelationMap<SemanticRelation>;
  config?: {
    strictMode: boolean;
  };
  layer?: ExecutionLayer;
  controller?: ControllerNode;
  service?: ServiceNode;
  model?: ServiceModelNode;
  graph?: {
    entrypoint?: boolean;
    visited?: string[];
  };
}

export interface SemanticKernelV2 {
  resolve(
    node: FieldNode,
    context: IRContext
  ): SemanticNode;
}
