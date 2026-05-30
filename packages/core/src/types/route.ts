export interface RouteManifest {
  version: string
  baseURL: string
  routes: ParsedRoute[]
  channels?: ParsedChannel[]
  models?: ParsedModel[]
  generatedAt: string
}

export interface ParsedChannel {
  name: string
  isPrivate: boolean
  isPresence: boolean
}

export interface ParsedRoute {
  name: string
  method: string
  path: string
  auth: boolean
  middleware: string[]
  schema?: Record<string, any>
  group?: string
  action?: string
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
}
