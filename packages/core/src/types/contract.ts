export type ResolutionStatus = 'resolved' | 'unknown' | 'partial'

export interface TraceNode {
  source: string   // 'ModelColumnResolver' | 'AccessorResolver' | 'SemanticKernelV2' | ...
  rule: string     // 'Field lookup from Schema Model Order.status'
  input?: string   // 'status'
  output?: string  // 'string'
}

export interface SemanticResolution {
  status: ResolutionStatus
  type: string
  model?: string
  resource?: string
  collection?: boolean
  paginated?: boolean
  nullable?: boolean
  confidence: number
  trace: TraceNode[]
}
