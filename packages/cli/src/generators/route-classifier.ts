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

import {
  ParsedRoute,
  matchHttpMethod,
  CrudRole,
  CRUD_ROLE_REGISTRY,
  matchCrudRole,
  EndpointContract,
  getRouteContract,
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  matchResourceGroup,
  CrudResourceGroupDescriptor,
  FullCrudResourceGroupDescriptor,
  ReadOnlyCrudResourceGroupDescriptor,
  FlexibleCrudResourceGroupDescriptor,
  SingletonResourceGroupDescriptor,
  CustomResourceGroupDescriptor,
  ResourceGroupDescriptor,
  ClassifiedDomainGraph,
  ResourceGroupGraph,
  RouteManifest,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  ScannedCrudResourceGroupDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature,
  ScannedResourceGroupGraph,
  createResourceGroupGraph,
  MutationCapability,
  ParsedModel
} from '@routesync/core'
import { toIdentifier, toTypeName } from './names'
import { CANONICAL_ACTION_MAP } from './canonical-names'

// ─── Public types ─────────────────────────────────────────────────────────────

export {
  CrudRole,
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  matchResourceGroup,
  ScannedCrudResourceGroupDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature,
  ScannedResourceGroupGraph,
  createResourceGroupGraph
} from '@routesync/core'
export type {
  ResourceGroupDescriptor,
  CrudResourceGroupDescriptor,
  FullCrudResourceGroupDescriptor,
  ReadOnlyCrudResourceGroupDescriptor,
  FlexibleCrudResourceGroupDescriptor,
  SingletonResourceGroupDescriptor,
  CustomResourceGroupDescriptor,
  BaseResourceGroupTypeSignature,
  FullCrudTypeSignature,
  ReadOnlyCrudTypeSignature,
  FlexibleCrudTypeSignature,
  SingletonTypeSignature,
  CustomTypeSignature,
  ResourceGroupTypeSignature,
  ResourceGroupVisitor,
  ExhaustiveFineGrainedResourceGroupVisitor,
  UnifiedCrudResourceGroupVisitor,
  ClassifiedDomainGraph,
  MutationCapability
} from '@routesync/core'

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

function resolveItemPrimaryKeyType(
  targetRoute: ClassifiedRoute,
  models?: readonly ParsedModel[],
  titleName?: string
): string {
  const primaryParam = targetRoute.contract.request.pathParameters[0]
  if (primaryParam && primaryParam.type && ROUTE_PARAMETER_TYPE_REGISTRY[primaryParam.type]) {
    return ROUTE_PARAMETER_TYPE_REGISTRY[primaryParam.type].tsType
  }
  if (models && titleName) {
    const matchedModel = models.find(m => {
      const mTitle = toTypeName(m.name)
      const mShort = toTypeName(m.shortName ?? '')
      return mTitle === titleName || mShort === titleName
        || mTitle + 's' === titleName || mShort + 's' === titleName
        || titleName + 's' === mTitle || titleName.replace(/s$/, '') === mTitle.replace(/s$/, '')
    })
    if (matchedModel?.keySemanticType === 'number') return 'number'
    if (matchedModel?.keySemanticType === 'string') return 'string'
  }
  return RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Crud].defaultPrimaryKeyType
}

interface ResolvedTypeInfo {
  readonly typeName: string
  readonly importedType: string | null
  readonly contractImportedType: string | null
}

function resolveRouteResponseType(route?: ClassifiedRoute): { readonly typeName: string; readonly importedType: string | null } {
  if (!route) return { typeName: 'never', importedType: null }
  let readType = route.contract.response.success.readTypeName
  if (!readType || readType === 'unknown') {
    const rawResp = route.raw.response as any
    readType = rawResp?.semantic?.readTypeName
      ?? (rawResp?.resource ? `${rawResp.resource}Transformed` : undefined)
      ?? (rawResp?.model ? `${rawResp.model}Transformed` : undefined)
      ?? 'never'
  }
  if (readType && readType !== 'void' && readType !== 'unknown' && readType !== 'never') {
    return { typeName: readType, importedType: readType }
  }
  return { typeName: readType || 'never', importedType: null }
}

function resolveRouteFormType(route?: ClassifiedRoute): ResolvedTypeInfo {
  if (!route) return { typeName: 'never', importedType: null, contractImportedType: null }
  const hasSchema = !!(route.raw.schema?.rules && Object.keys(route.raw.schema.rules).length > 0)
  if (!hasSchema) return { typeName: 'void', importedType: null, contractImportedType: null }

  const rawAction = route.actionName
  const actionKey = (CANONICAL_ACTION_MAP as Record<string, string>)[rawAction] || (rawAction.charAt(0).toUpperCase() + rawAction.slice(1))
  const standardFormActions = ['Create', 'Update', 'Get']
  if (standardFormActions.includes(actionKey)) {
    const formName = `${toTypeName(route.groupName)}Form`
    return { typeName: `${formName}['${actionKey}']`, importedType: formName, contractImportedType: null }
  }
  const contractType = `${toTypeName(route.groupName)}${actionKey}Payload`
  return { typeName: contractType, importedType: null, contractImportedType: contractType }
}

function resolveGroupErrorType(allRoutes: readonly ClassifiedRoute[]): {
  readonly errorUnionType: string
  readonly errorTypes: readonly string[]
  readonly hasCustomError: boolean
} {
  const errorTypes = new Set<string>()
  for (const route of allRoutes) {
    const errorList = route.contract?.response?.errors ?? route.raw?.contract?.response?.errors ?? route.raw?.errorResponses ?? []
    for (const err of errorList) {
      if (err.typeName) {
        errorTypes.add(err.typeName)
      }
    }
  }
  const hasCustomError = errorTypes.size > 0
  const errorUnionType = hasCustomError
    ? Array.from(errorTypes).sort().join(' | ')
    : 'ApiError'
  return {
    errorUnionType,
    errorTypes: Object.freeze(Array.from(errorTypes).sort()),
    hasCustomError
  }
}

/**
 * Top-Level Domain Graph Classifier (Origin Boundary).
 *
 * Atomically classifies all routes into deterministic SSOT ResourceGroupDescriptors
 * (Crud, Singleton, or Custom) with guaranteed non-nullable primaryKeyType,
 * listKeyFn, detailKeyFn, layout keys, and pre-resolved TypeScript types.
 */
export function classifyDomainGraph(manifest: RouteManifest): ClassifiedDomainGraph<ClassifiedRoute> {
  const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
  const rawResources = buildResourceMap(classified)

  const resourceGroups: ResourceGroupDescriptor<ClassifiedRoute>[] = []

  for (const [groupName, res] of rawResources) {
    const KEY = groupName.toUpperCase()
    const Title = toTypeName(groupName)
    const errorRes = resolveGroupErrorType(res.all)

    if (res.index && res.show) {
      const primaryKeyType = resolveItemPrimaryKeyType(res.show, manifest.models, Title)
      if (res.create && res.update && res.delete) {
        const listRes = resolveRouteResponseType(res.index)
        const detailRes = resolveRouteResponseType(res.show)
        const createRes = resolveRouteFormType(res.create)
        const updateRes = resolveRouteFormType(res.update)

        const importedTypes = new Set<string>()
        if (listRes.importedType) importedTypes.add(listRes.importedType)
        if (detailRes.importedType) importedTypes.add(detailRes.importedType)
        if (createRes.importedType) importedTypes.add(createRes.importedType)
        if (updateRes.importedType) importedTypes.add(updateRes.importedType)
        for (const e of errorRes.errorTypes) importedTypes.add(e)

        const contractImportedTypes = new Set<string>()
        if (createRes.contractImportedType) contractImportedTypes.add(createRes.contractImportedType)
        if (updateRes.contractImportedType) contractImportedTypes.add(updateRes.contractImportedType)

        const types: FullCrudTypeSignature = new ScannedResourceGroupTypeSignature({
          list: listRes.typeName,
          detail: detailRes.typeName,
          create: createRes.typeName,
          update: updateRes.typeName,
          error: errorRes.errorUnionType,
          hasCustomError: errorRes.hasCustomError,
          importedTypes: Object.freeze(Array.from(importedTypes).sort()),
          contractImportedTypes: Object.freeze(Array.from(contractImportedTypes).sort())
        })

        resourceGroups.push(new ScannedFullCrudResourceGroupDescriptor<ClassifiedRoute>({
          groupName,
          keyName: KEY,
          titleName: Title,
          primaryKeyType,
          types,
          index: res.index,
          show: res.show,
          create: res.create,
          update: res.update,
          delete: res.delete,
          all: Object.freeze(res.all)
        }))
      } else if (!res.create && !res.update && !res.delete) {
        const listRes = resolveRouteResponseType(res.index)
        const detailRes = resolveRouteResponseType(res.show)

        const importedTypes = new Set<string>()
        if (listRes.importedType) importedTypes.add(listRes.importedType)
        if (detailRes.importedType) importedTypes.add(detailRes.importedType)
        for (const e of errorRes.errorTypes) importedTypes.add(e)

        const types: ReadOnlyCrudTypeSignature = new ScannedResourceGroupTypeSignature({
          list: listRes.typeName,
          detail: detailRes.typeName,
          create: 'never',
          update: 'never',
          error: errorRes.errorUnionType,
          hasCustomError: errorRes.hasCustomError,
          importedTypes: Object.freeze(Array.from(importedTypes).sort()),
          contractImportedTypes: Object.freeze([])
        }) as ReadOnlyCrudTypeSignature

        resourceGroups.push(new ScannedReadOnlyCrudResourceGroupDescriptor<ClassifiedRoute>({
          groupName,
          keyName: KEY,
          titleName: Title,
          primaryKeyType,
          types,
          index: res.index,
          show: res.show,
          all: Object.freeze(res.all)
        }))
      } else {
        const listRes = resolveRouteResponseType(res.index)
        const detailRes = resolveRouteResponseType(res.show)
        const createRes = res.create ? resolveRouteFormType(res.create) : { typeName: 'never', importedType: null, contractImportedType: null }
        const updateRes = res.update ? resolveRouteFormType(res.update) : { typeName: 'never', importedType: null, contractImportedType: null }

        const importedTypes = new Set<string>()
        if (listRes.importedType) importedTypes.add(listRes.importedType)
        if (detailRes.importedType) importedTypes.add(detailRes.importedType)
        if (createRes.importedType) importedTypes.add(createRes.importedType)
        if (updateRes.importedType) importedTypes.add(updateRes.importedType)
        for (const e of errorRes.errorTypes) importedTypes.add(e)

        const contractImportedTypes = new Set<string>()
        if (createRes.contractImportedType) contractImportedTypes.add(createRes.contractImportedType)
        if (updateRes.contractImportedType) contractImportedTypes.add(updateRes.contractImportedType)

        const types: FlexibleCrudTypeSignature = new ScannedResourceGroupTypeSignature({
          list: listRes.typeName,
          detail: detailRes.typeName,
          create: createRes.typeName,
          update: updateRes.typeName,
          error: errorRes.errorUnionType,
          hasCustomError: errorRes.hasCustomError,
          importedTypes: Object.freeze(Array.from(importedTypes).sort()),
          contractImportedTypes: Object.freeze(Array.from(contractImportedTypes).sort())
        })

        resourceGroups.push(new ScannedFlexibleCrudResourceGroupDescriptor<ClassifiedRoute>({
          groupName,
          keyName: KEY,
          titleName: Title,
          primaryKeyType,
          types,
          index: res.index,
          show: res.show,
          create: MutationCapability.fromNullable(res.create),
          update: MutationCapability.fromNullable(res.update),
          delete: MutationCapability.fromNullable(res.delete),
          all: Object.freeze(res.all)
        }))
      }
    } else {
      const hasSchema = (route?: ClassifiedRoute): boolean =>
        !!(route?.raw.schema?.rules && Object.keys(route.raw.schema.rules).length > 0)

      const listRes = res.index ? resolveRouteResponseType(res.index) : { typeName: 'never', importedType: null }

      let detailRes = res.show ? resolveRouteResponseType(res.show) : null
      if (!detailRes) {
        const customGet = res.all.find(r => r.method === 'GET' && r.crudRole === 'custom')
        detailRes = customGet ? resolveRouteResponseType(customGet) : { typeName: 'never', importedType: null }
      }

      let createRes = res.create ? resolveRouteFormType(res.create) : null
      if (!createRes) {
        const customPost = res.all.find(r => r.method === 'POST' && r.crudRole === 'custom' && hasSchema(r))
        const customGet = res.all.find(r => r.method === 'GET' && r.crudRole === 'custom' && hasSchema(r))
        const fallback = customPost ?? customGet
        createRes = fallback ? resolveRouteFormType(fallback) : { typeName: 'never', importedType: null, contractImportedType: null }
      }

      let updateRes = res.update ? resolveRouteFormType(res.update) : null
      if (!updateRes) {
        const customUpdate = res.all.find(r => ['PUT', 'PATCH'].includes(r.method) && r.crudRole === 'custom' && hasSchema(r))
        updateRes = customUpdate ? resolveRouteFormType(customUpdate) : { typeName: 'never', importedType: null, contractImportedType: null }
      }

      const importedTypes = new Set<string>()
      if (listRes.importedType) importedTypes.add(listRes.importedType)
      if (detailRes.importedType) importedTypes.add(detailRes.importedType)
      if (createRes.importedType) importedTypes.add(createRes.importedType)
      if (updateRes.importedType) importedTypes.add(updateRes.importedType)
      for (const e of errorRes.errorTypes) importedTypes.add(e)

      const contractImportedTypes = new Set<string>()
      if (createRes.contractImportedType) contractImportedTypes.add(createRes.contractImportedType)
      if (updateRes.contractImportedType) contractImportedTypes.add(updateRes.contractImportedType)

      const groupTypes = new ScannedResourceGroupTypeSignature({
        list: listRes.typeName,
        detail: detailRes.typeName,
        create: createRes.typeName,
        update: updateRes.typeName,
        error: errorRes.errorUnionType,
        hasCustomError: errorRes.hasCustomError,
        importedTypes: Object.freeze(Array.from(importedTypes).sort()),
        contractImportedTypes: Object.freeze(Array.from(contractImportedTypes).sort())
      })

      const hasAnyTrailingParam = res.all.some(r => r.hasTrailingParam)
      if (hasAnyTrailingParam) {
        const detailKeyFn = res.show ? res.show.actionName : RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Custom].defaultDetailKeyFn
        resourceGroups.push(new ScannedCustomResourceGroupDescriptor<ClassifiedRoute>({
          groupName,
          keyName: KEY,
          titleName: Title,
          detailKeyFn,
          types: groupTypes,
          all: Object.freeze(res.all)
        }))
      } else {
        resourceGroups.push(new ScannedSingletonResourceGroupDescriptor<ClassifiedRoute>({
          groupName,
          keyName: KEY,
          titleName: Title,
          types: groupTypes as SingletonTypeSignature,
          all: Object.freeze(res.all)
        }))
      }
    }
  }

  const frozenResourceGroups = Object.freeze(resourceGroups)

  const resourceGroupMap = new Map<string, ResourceGroupDescriptor<ClassifiedRoute>>(
    frozenResourceGroups.map(group => [group.groupName, group])
  )

  const resourceGroupGraph = createResourceGroupGraph<ClassifiedRoute>(frozenResourceGroups)

  return Object.freeze({
    manifest,
    contracts: Object.freeze(classified.map(c => c.contract)),
    resourceGroups: frozenResourceGroups,
    resourceGroupMap,
    resourceGroupGraph,
    models: Object.freeze(manifest.models ?? [])
  })
}

