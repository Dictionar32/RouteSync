export interface RouteManifest {
  version: string
  baseURL: string
  routes: ParsedRoute[]
  channels?: ParsedChannel[]
  models?: ParsedModel[]
  resources?: ParsedResource[]
  generatedAt: string
}

export interface ParsedChannel {
  name: string
  isPrivate: boolean
  isPresence: boolean
}

export type ResourceFieldKind = 
  | { kind: 'primitive'; type: string }
  | { kind: 'model'; model: string; collection: boolean }
  | { kind: 'resource'; resource: string; collection: boolean }
  | { kind: 'object'; fields: Record<string, ResourceFieldKind> }
  | { kind: 'unknown' }

export interface ParsedResource {
  name: string // e.g., UserResource
  fields: Record<string, ResourceFieldKind>
  assignments?: Record<string, string>
}

export type ResponseMetadata =
  | { kind: 'model'; model: string; collection: boolean; paginated?: boolean }
  | { kind: 'resource'; resource: string; collection: boolean; paginated?: boolean }
  | { kind: 'object'; fields: Record<string, ResponseMetadata | { kind: 'primitive'; type: string }> }
  | { kind: 'unknown' }

export interface ParsedRoute {
  name: string
  method: string
  path: string
  auth: boolean
  middleware: string[]
  schema?: Record<string, any>
  group?: string
  action?: string
  response?: ResponseMetadata
}

export interface ParsedColumn {
  name: string
  type: string // SQL type like varchar, int, bigint, etc.
  nullable: boolean
}

export interface ParsedModel {
  name: string // Model class name (e.g. User)
  table: string
  columns: ParsedColumn[]
  hidden?: string[]
  appends?: string[]
  casts?: Record<string, string>
  accessors?: Record<string, any>
  relations?: Record<string, { type: string; model: string }>
}
