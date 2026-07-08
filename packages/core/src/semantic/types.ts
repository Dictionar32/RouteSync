import { SemanticResolution } from '../types/contract';

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

export interface ResolverMeta {
  kind: string;
  type?: string;
  confidence?: number;
  castType?: string;
  expression?: ResolverMeta;
  argument?: ResolverMeta;
  arguments?: ResolverMeta[];
  args?: ResolverMeta[];
  value?: string | number | boolean | null;
  left?: ResolverMeta;
  right?: ResolverMeta;
  operator?: string;
  condition?: ResolverMeta;
  truthy?: ResolverMeta;
  falsy?: ResolverMeta;
  target?: ResolverMeta;
  property?: string;
  model?: string;
  column?: string;
  resource?: string;
  collection?: boolean;
  name?: string;
  method?: string;
  variable?: string | ResolverMeta;
  function?: string;
  fields?: Record<string, unknown>;
  resolvedAssignments?: Record<string, ResolverMeta>;
  assignments?: Record<string, ResolverMeta>;
}

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
  resolvedType?: string;
  expression_code?: string | null;
  parsed_ast?: ResolverMeta;
  expression?: ResolverMeta | SemanticResolution;
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
  assignments?: Record<string, ResolverMeta>;
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
  contextModel?: unknown;
  fileName?: string;
  resolvedAssignments?: Record<string, SemanticResolution>;
  assignments?: Record<string, ResolverMeta>;
}

export interface ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean;
  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution;
}
