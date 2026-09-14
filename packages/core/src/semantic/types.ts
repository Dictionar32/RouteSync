import { SemanticResolution } from '../types/contract';
import { FieldNode } from '../types/field';
import type { SourceRef } from '../types/semantic';
import type { SymbolTable } from './SymbolTable';

import { CycleDetector } from './CycleDetector';
import type {
  ModelColumnContract,
  ModelColumn,
  ModelRelationContract,
  ModelRelation,
  ModelAccessorContract,
  ModelAccessor,
  ModelNodeContract,
  ModelNode
} from './modelNodes';

export { CycleDetector };
export type {
  ModelColumnContract,
  ModelColumn,
  ModelRelationContract,
  ModelRelation,
  ModelAccessorContract,
  ModelAccessor,
  ModelNodeContract,
  ModelNode
};

export type InternalResolverQuery =
  | { kind: 'model_column'; model: string; column: string }
  | { kind: 'model_accessor'; model: string; column: string };

export type ResolverMeta = FieldNode | InternalResolverQuery;

export interface ExpressionNode {
  kind: string;
  [key: string]: unknown;
}

export interface EvidenceNode {
  kind: 'accessor' | 'relation' | 'column' | 'function' | 'method_call' | 'resource_mapping' | 'primitive' | 'model' | 'fallback' | 'variable' | 'property_access';
  name: string;
  detail?: string;
}

export interface ResolutionResult {
  status: 'resolved' | 'unresolved';
  type?: string;
  confidence: number;
  evidence: EvidenceNode[];
  unresolvedReason?: string;
  expression?: ExpressionNode;
  collection?: boolean;
  paginated?: boolean;
}

export interface SemanticResolutionKernelContract {
  resolve(meta: ResolverMeta, contextModel?: unknown): SemanticResolution;
  mapSqlTypeToTs(sqlType: string): string;
  mapCastToTs(castType: string, baseType: string): string;
}

export interface ResolutionContext {
  models: ModelNode[];
  resources: unknown[];
  kernel: SemanticResolutionKernelContract;
  cycleDetector: CycleDetector;
  symbolTable: SymbolTable;
  contextModel?: unknown;
  fileName?: string;
  resolvedAssignments?: Record<string, SemanticResolution>;
  assignments?: Record<string, FieldNode>;
}

export interface ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean;
  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution;
}
