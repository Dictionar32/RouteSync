import { SemanticResolution } from './contract'
import { ManifestMetadata } from './ir'
import { SemanticType } from './semantic'

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

export interface PageConfig {
  component?: string
  layout?: string
  props?: Record<string, unknown>
  meta?: Record<string, unknown>
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
  pages?: Record<string, PageConfig>
}

export interface ParsedChannel {
  name: string
  isPrivate: boolean
  isPresence: boolean
}

export type ResourceFieldKind = (
  | { kind: 'primitive'; type: string }
  | { kind: 'model'; model: string; collection: boolean }
  | { kind: 'resource'; resource: string; collection: boolean }
  | { kind: 'object'; fields: Record<string, ResourceFieldKind> }
  | { kind: 'array'; element: ResourceFieldKind }
  | { kind: 'property_access'; resolved?: { type: string }; nullable?: boolean }  // ✅ Phase 2: Real manifest data
  | { kind: 'nullsafe_property_access'; resolved?: { type: string }; nullable?: boolean }  // ✅ Phase 2: Nullsafe operator
  | { kind: 'variable'; resolved?: { type: string }; nullable?: boolean }         // ✅ Phase 2: Real manifest data
  | { kind: 'type_cast'; resolved?: { type: string }; nullable?: boolean }        // ✅ Phase 2: Type casting
  | { kind: 'binary_expression'; resolved?: { type: string }; nullable?: boolean }  // ✅ Phase 2: Binary operators
  | { kind: 'method_call'; resolved?: { type: string }; nullable?: boolean }      // ✅ Phase 2: Method calls
  | { kind: 'literal'; resolved?: { type: string }; nullable?: boolean }          // ✅ Phase 2: Literals
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution
  semantic?: SemanticResolution
  /** Whether this field can be null in the response payload. */
  nullable?: boolean
}

export interface ParsedResource {
  name: string // e.g., UserResource
  sanitizedName?: string // Sanitized identifier name
  baseModel?: string // Base model name  
  actions?: ActionDefinition[] // Available CRUD actions
  endpoints?: string[] // Associated route endpoints
  fields: Record<string, ResourceFieldKind>
  assignments?: Record<string, string>
  sourceFile?: string | null
  sourceLine?: number | null
  isSynthetic?: boolean // True if this is a synthetic nested object resource (not a real Laravel Resource)
}

// Add ActionDefinition interface for ParsedResource
export interface ActionDefinition {
  name: string
  method: string
  hasBody: boolean
  hasResponse: boolean
  routes: string[]
}

export type ResponseMetadata = (
  | { kind: 'model'; model: string; collection: boolean; paginated?: boolean }
  | { kind: 'resource'; resource: string; collection: boolean; paginated?: boolean }
  | { kind: 'object'; fields: Record<string, ResponseMetadata | { kind: 'primitive'; type: string } | { kind: 'array'; element: ResourceFieldKind }>; collection?: boolean; paginated?: boolean }
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution & { kind?: string; type?: string; fields?: Record<string, SemanticType>; wrapped?: boolean }
  semantic?: SemanticResolution & { kind?: string; type?: string; fields?: Record<string, SemanticType>; wrapped?: boolean }
  /** Runtime-enriched by SemanticKernelV2 — present on all variants via intersection */
  collection?: boolean
  paginated?: boolean
  type?: string
  /** Set by LaravelRouteParser when the JsonResource is subject to Laravel's default $wrap behaviour (wraps payload in `{ data: ... }`). */
  wrapped?: boolean
}

export interface ParsedRoute {
  name: string
  method: string
  path: string
  auth: boolean
  middleware: string[]
  schema?: Record<string, unknown>
  group?: string
  action?: string
  response?: ResponseMetadata
  assignments?: Record<string, string>
  stableHash?: string
  /** Real file/line of the controller action, from ReflectionMethod. Null for closures. */
  sourceFile?: string | null
  sourceLine?: number | null
  /**
   * Legacy/hand-authored manifest naming convention (predates `path`/`action`).
   * Still used by some fixtures and by the stateless normalizer pipeline —
   * kept alongside `path`/`action` rather than removed.
   */
  uri?: string
  actionName?: string
  controllerName?: string
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
