import type { SemanticResolution } from '../types/domain/semanticResolution';
import type { ModelName, ColumnName } from '../types/domain/semanticValues';
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
  ModelNode,
  ModelNodeInput
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
  ModelNode,
  ModelNodeInput
};

export type InternalResolverQuery =
  | { readonly kind: 'model_column'; readonly model: ModelName; readonly column: ColumnName }
  | { readonly kind: 'model_accessor'; readonly model: ModelName; readonly column: ColumnName };

export type ResolverMeta = FieldNode | InternalResolverQuery;

export interface SemanticResolutionKernelContract {
  resolve(meta: ResolverMeta, contextModel?: ModelNode): SemanticResolution;
  mapSqlTypeToTs(sqlType: string): string;
  mapCastToTs(castType: string, baseType: string): string;
}

export interface SemanticResourceDescriptor {
  readonly name: string;
}

export interface ResolutionContext {
  readonly models: readonly ModelNode[];
  readonly resources: readonly SemanticResourceDescriptor[];
  readonly kernel: SemanticResolutionKernelContract;
  cycleDetector: CycleDetector;
  symbolTable: SymbolTable;
  readonly contextModel?: ModelNode;
  readonly fileName: string;
  readonly resolvedAssignments: Readonly<Record<string, SemanticResolution>>;
  readonly assignments: Readonly<Record<string, FieldNode>>;
}

export interface ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean;
  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution;
}
