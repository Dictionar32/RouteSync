/**
 * route-classifier.ts
 *
 * Deterministic route classifier — zero heuristics.
 *
 * Grouping strategy (path-driven, not name-driven):
 *   A "resource group" is defined by the subsequence of STATIC path segments,
 *   where dynamic segments ({id}, :id) act as separators between sub-resources.
 *
 *   Examples:
 *     /produk                    → group "produk"
 *     /produk/{id}               → group "produk"       (trailing param stripped)
 *     /produk/{id}/reviews       → group "produkReviews" (param in middle = sub-resource boundary)
 *     /cart/items                → group "cartItems"
 *     /cart/items/{produkItemId} → group "cartItems"    (trailing param stripped)
 *     /admin/produk              → group "adminProduk"
 *     /orders/{id}/invoice       → group "ordersInvoice"
 *
 * CRUD role — determined purely from HTTP method + whether path ends with a param:
 *   GET  no-param  → index
 *   GET  has-param → show
 *   POST no-param  → create
 *   PUT/PATCH + param → update
 *   DELETE + param    → delete
 *   everything else   → custom
 *
 * Action names — deterministic within a group:
 *   Each (method, hasTrailingParam) combination produces a fixed name.
 *   Collisions (two GETs, two POSTs, etc.) are resolved with a numeric suffix.
 */

import { ParsedRoute, matchHttpMethod, CrudRole, CRUD_ROLE_REGISTRY, matchCrudRole, EndpointContract, getRouteContract } from '@routesync/core'
import { toIdentifier, toTypeName } from './names'

// ─── Public types ─────────────────────────────────────────────────────────────

export { CrudRole } from '@routesync/core'

export interface ClassifiedRoute {
  raw: ParsedRoute
  contract: EndpointContract // ✅ Pure CDA Direct Contract SSOT
  /** e.g. "produk", "cartItems", "adminProduk", "produkReviews" */
  groupName: string
  /** e.g. "get", "getById", "post", "patch", "delete" */
  actionName: string
  /** Express-style runtime path, e.g. "/produk/:id" */
  runtimePath: string
  method: string
  /** True when the path contains at least one dynamic segment */
  hasParams: boolean
  /** True when the LAST path segment is dynamic (determines REST role) */
  hasTrailingParam: boolean
  crudRole: CrudRole
}

export interface ScannedClassifiedRouteParams {
  readonly raw: ParsedRoute
  readonly contract?: EndpointContract
  readonly groupName: string
  readonly actionName: string
  readonly runtimePath: string
  readonly method: string
  readonly hasParams: boolean
  readonly hasTrailingParam: boolean
  readonly crudRole: CrudRole
}

/**
 * Reusable Constructor: Scanned Classified Route Descriptor.
 */
export class ScannedClassifiedRouteDescriptor implements ClassifiedRoute {
  public readonly raw: ParsedRoute
  public readonly contract: EndpointContract
  public readonly groupName: string
  public readonly actionName: string
  public readonly runtimePath: string
  public readonly method: string
  public readonly hasParams: boolean
  public readonly hasTrailingParam: boolean
  public readonly crudRole: CrudRole

  constructor(params: ScannedClassifiedRouteParams) {
    this.raw = params.raw
    this.contract = params.contract ?? getRouteContract(params.raw)
    this.groupName = params.groupName
    this.actionName = params.actionName
    this.runtimePath = params.runtimePath
    this.method = params.method
    this.hasParams = params.hasParams
    this.hasTrailingParam = params.hasTrailingParam
    this.crudRole = params.crudRole
    Object.freeze(this)
  }
}

export interface ResourceCrudMap {
  groupName: string
  /** GET /resource */
  index?: ClassifiedRoute
  /** GET /resource/:id */
  show?: ClassifiedRoute
  /** POST /resource */
  create?: ClassifiedRoute
  /** PUT or PATCH /resource/:id */
  update?: ClassifiedRoute
  /** DELETE /resource/:id */
  delete?: ClassifiedRoute
  /** All routes in this group (including sub-resources classified as "custom") */
  all: ClassifiedRoute[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isDynamic(segment: string): boolean {
  return segment.startsWith('{') || segment.startsWith(':')
}

function toRuntimePath(path: string): string {
  return path.replace(/\{([^}/]+)\}/g, ':$1')
}

/**
 * Derive the group name from the URL path.
 *
 * Algorithm:
 *   Walk path segments left-to-right.
 *   Static segments accumulate into a "bucket".
 *   Dynamic segments flush the current bucket and reset it
 *     (the param is a boundary — what comes after is a sub-resource).
 *   All flushed buckets are joined with spaces and camelCased.
 *
 * Trailing dynamic segments are ignored (they don't start a new sub-resource).
 */
export function deriveGroupName(path: string): string {
  const segments = path.replace(/^\//, '').split('/').filter(Boolean)

  const parts: string[] = []
  let current: string[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (isDynamic(seg)) {
      // Is there any static segment after this param?
      const hasStaticAfter = segments.slice(i + 1).some(s => !isDynamic(s))
      if (hasStaticAfter) {
        // Non-trailing param: flush current bucket as completed sub-resource
        if (current.length > 0) {
          parts.push(current.join('_'))
          current = []
        }
      }
      // Trailing param: just skip — it belongs to the current resource
    } else {
      current.push(seg)
    }
  }

  // Flush remaining
  if (current.length > 0) parts.push(current.join('_'))

  return toIdentifier(parts.join(' '))
}

/**
 * Classify the CRUD role using only HTTP method + trailing-param flag.
 * No path string inspection, no model lookup.
 */
function classifyCrudRole(method: string, hasTrailingParam: boolean, paramCount: number): CrudRole {
  return matchHttpMethod(method, {
    GET: () => {
      if (hasTrailingParam && paramCount === 1) return CrudRole.Show
      if (!hasTrailingParam && paramCount === 0) return CrudRole.Index
      return CrudRole.Custom
    },
    POST: () => (!hasTrailingParam && paramCount === 0) ? CrudRole.Create : CrudRole.Custom,
    PUT: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
    PATCH: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
    DELETE: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Delete : CrudRole.Custom,
    OPTIONS: () => CrudRole.Custom,
    HEAD: () => CrudRole.Custom
  })
}

/**
 * Canonical base action name for a CRUD role (SSOT derived from CRUD_ROLE_REGISTRY).
 */
const ROLE_ACTION: Record<CrudRole, string> = Object.freeze(
  Object.fromEntries(
    Object.values(CRUD_ROLE_REGISTRY).map(spec => [spec.role, spec.defaultActionName])
  ) as Record<CrudRole, string>
)

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Classify every route in the manifest.
 * Returns routes in the same order as the input array.
 */
export function classifyRoutes(
  routes: ParsedRoute[],
  groupAliases?: Record<string, string>
): ClassifiedRoute[] {
  // Per-group action-name deduplication
  const usedActions = new Map<string, Set<string>>()

  return routes.map(route => {
    const method = route.method.toUpperCase()
    const groupName = groupAliases?.[route.groupName] ?? route.groupName
    const role = (route.crudRole as CrudRole) || CrudRole.Custom
    const runtimePath = route.runtimePath
    const hasParams = route.pathParameters ? route.pathParameters.length > 0 : false
    const roleSpec = CRUD_ROLE_REGISTRY[role] ?? CRUD_ROLE_REGISTRY[CrudRole.Custom]
    const hasTrailingParam = roleSpec.affectsSingleResource

    // Build action name: start from role canonical name via matchCrudRole catamorphism
    const baseAction = matchCrudRole(role, {
      index: spec => spec.defaultActionName,
      show: spec => spec.defaultActionName,
      create: spec => spec.defaultActionName,
      update: spec => spec.defaultActionName,
      delete: spec => spec.defaultActionName,
      custom: () => method.toLowerCase(),
    })

    if (!usedActions.has(groupName)) usedActions.set(groupName, new Set())
    const used = usedActions.get(groupName)!

    let actionName = baseAction
    if (used.has(actionName)) {
      let i = 2
      while (used.has(`${baseAction}${i}`)) i++
      actionName = `${baseAction}${i}`
    }
    used.add(actionName)

    return new ScannedClassifiedRouteDescriptor({
      raw: route,
      groupName,
      actionName,
      runtimePath,
      method,
      hasParams,
      hasTrailingParam,
      crudRole: role,
    })
  })
}

/**
 * Group routes by resource and map CRUD slots (first-wins per slot).
 */
export function buildResourceMap(classified: ClassifiedRoute[]): Map<string, ResourceCrudMap> {
  const map = new Map<string, ResourceCrudMap>()

  for (const route of classified) {
    if (!map.has(route.groupName)) {
      map.set(route.groupName, { groupName: route.groupName, all: [] })
    }
    const res = map.get(route.groupName)!
    res.all.push(route)

    if (route.crudRole === 'index'  && !res.index)  res.index  = route
    if (route.crudRole === 'show'   && !res.show)   res.show   = route
    if (route.crudRole === 'create' && !res.create) res.create = route
    if (route.crudRole === 'update' && !res.update) res.update = route
    if (route.crudRole === 'delete' && !res.delete) res.delete = route
  }

  return map
}

/**
 * Flat Record<groupName, ClassifiedRoute[]> — drop-in for buildGeneratedRoutes.
 */
export function buildGroupedRoutes(classified: ClassifiedRoute[]): Record<string, ClassifiedRoute[]> {
  const result: Record<string, ClassifiedRoute[]> = {}
  for (const route of classified) {
    ;(result[route.groupName] ??= []).push(route)
  }
  return result
}

export { toTypeName }
