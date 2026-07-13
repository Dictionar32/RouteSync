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
  /** For synthetic `type: 'object'` results (e.g. Sanctum's createToken()) — property name to type, read by ExpressionResolver's property_access handling. */
  fields?: Record<string, string>
}

/**
 * Resolution for a column with array/json/object cast.
 * Represents a structured JSON object whose internal schema is unknown
 * but whose source is traceable.
 */
export interface JsonObjectResolution extends SemanticResolution {
  type: 'json-object'
  sourceModel: string
  sourceColumn: string
}

export type AccessKind = 'array_access' | 'property_access' | 'optional_access'

/**
 * Resolution for a property/key access on a json-object or another json-member.
 * Maintains a linked-list chain back to the source JsonObjectResolution,
 * enabling full path reconstruction (e.g. detail → gateway → name).
 */
export interface JsonMemberResolution extends SemanticResolution {
  type: 'json-member'
  parent: SemanticResolution
  key: string
  accessKind: AccessKind
}
