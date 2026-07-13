import { SemanticResolution } from '../types/contract';
import { FieldNode } from '../types/field';
import type { SourceRef } from '../types/semantic';
import type { SymbolTable } from './SymbolTable';

export class CycleDetector {
  private visited = new Set<string>()

  enter(nodeId: string): boolean {
    if (this.visited.has(nodeId)) {
      return false // Cycle detected
    }
    this.visited.add(nodeId)
    return true
  }

  leave(nodeId: string) {
    this.visited.delete(nodeId)
  }
}

/**
 * Two internal RPC shapes plugins use to ask the kernel to resolve "what
 * type is column X on model Y" (ExpressionResolver.ts, ModelColumnResolver.
 * ts) — never produced by the parser, so they don't belong on FieldNode
 * itself (that would leak resolver-internal plumbing into the AST type).
 */
export type InternalResolverQuery =
  | { kind: 'model_column'; model: string; column: string }
  | { kind: 'model_accessor'; model: string; column: string }

/**
 * `ResolverMeta` used to be a ~30-optional-field "God Interface" — every
 * plugin declared its own subset of fields it cared about, with no
 * guarantee any of them matched what FieldNode (types/field.ts) actually
 * produces. It's now that same FieldNode, plus the two synthetic lookup
 * shapes above. Two dead fields from the old interface — `argument` and
 * `variable` (singular) — are gone entirely: neither was ever constructed
 * anywhere in the codebase, only defensively read.
 */
export type ResolverMeta = FieldNode | InternalResolverQuery

export interface ModelColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface ModelRelation {
  model: string;
  type: string;
}

export interface ModelAccessor {
  source?: SourceRef;
  ast?: FieldNode;
  semantic?: SemanticResolution;
}

export interface ModelNode {
  name: string;
  table?: string;
  columns?: ModelColumn[];
  fields?: Record<string, { type: string; nullable: boolean }>;
  casts?: Record<string, string>;
  accessors?: Record<string, ModelAccessor>;
  relations?: Record<string, ModelRelation>;
  layer?: string;
  resolvedAssignments?: Record<string, SemanticResolution>;
  assignments?: Record<string, FieldNode>;
}

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
