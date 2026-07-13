import { SemanticResolution } from './contract'

/**
 * Resolved domain intent config, produced by `IntentResolver` and consumed at runtime by
 * `defineHooks()` (see `@routesync/react`). A domain entry starts life as either a plain string
 * shorthand (`"cart"`) authored by hand in `routesync.manifest.json`, or gets replaced in-place
 * by `IntentResolver.resolve()` with the fully-resolved object shape below. The `string` variant
 * is kept in the union for backward compatibility with hand-authored manifests written before
 * `IntentResolver` existed.
 */
export interface DomainIntentConfig {
  type: string
  operations: Record<string, string>
  config: Record<string, string>
}

export interface RouteManifest {
  version: string
  baseURL: string
  routes: ParsedRoute[]
  channels?: ParsedChannel[]
  models?: ParsedModel[]
  resources?: ParsedResource[]
  generatedAt: string
  frontend?: {
    router?: string
    groupAliases?: Record<string, string>
    domains?: Record<string, string | DomainIntentConfig>
  }
  pages?: Record<string, any>
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
  sourceFile?: string | null
  sourceLine?: number | null
}

export type ResponseMetadata = (
  | { kind: 'model'; model: string; collection: boolean; paginated?: boolean }
  | { kind: 'resource'; resource: string; collection: boolean; paginated?: boolean }
  | { kind: 'object'; fields: Record<string, ResponseMetadata | { kind: 'primitive'; type: string }>; collection?: boolean; paginated?: boolean }
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution & { kind?: string; type?: string; fields?: Record<string, any> }
  semantic?: SemanticResolution & { kind?: string; type?: string; fields?: Record<string, any> }
  /** Runtime-enriched by SemanticKernelV2 — present on all variants via intersection */
  collection?: boolean
  paginated?: boolean
  type?: string
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
  response?: ResponseMetadata
  assignments?: Record<string, string>
  stableHash?: string
  /** Real file/line of the controller action, from ReflectionMethod. Null for closures. */
  sourceFile?: string | null
  sourceLine?: number | null
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