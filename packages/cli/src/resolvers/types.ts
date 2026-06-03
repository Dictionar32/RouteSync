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

export interface ExpressionNode {
  kind: string;
  [key: string]: any;
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
  resolve(meta: any, contextModel?: any): ResolutionResult;
  mapSqlTypeToTs(sqlType: string): string;
  mapCastToTs(castType: string, baseType: string): string;
}

export interface ResolutionContext {
  models: any[];
  resources: any[];
  kernel: SemanticResolutionKernelContract;
  cycleDetector: CycleDetector;
  contextModel?: any;
}

export interface ResolverPlugin {
  canResolve(meta: any): boolean;
  resolve(meta: any, context: ResolutionContext): ResolutionResult;
}
