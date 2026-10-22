/**
 * routeGrouper.ts
 *
 * Projects already-resolved RouteSemanticFlow values into classifier views.
 * Classification is an upstream responsibility: this module never
 * derives CRUD meaning from method/path.
 *
 * @module cli/generators/classifier
 */

import {
  type RouteSemanticFlow,
  CRUD_ROLE_REGISTRY
} from '@routesync/core'
import {
  type ClassifiedRoute,
  ScannedClassifiedRouteDescriptor,
  type ResourceCrudMap
} from './classifierTypes'
import type { RouteCapabilityProjectionInterface } from './routeCapabilityProjectionInterface'
import { routeActionIdentityCapabilityAuthority, type RouteActionIdentityResolution } from '@routesync/core'

/**
 * Project resolved routes into the legacy ClassifiedRoute surface.
 *
 * IMPORTANT:
 * RouteSemanticFlow.capability.crudRole is authoritative.
 * No path inspection, HTTP-method classification, or fallback role exists here.
 */
function projectRoute(
  route: RouteSemanticFlow,
  identity: RouteActionIdentityResolution,
): ClassifiedRoute {
    const method = route.identity.coordinates.method
    const groupName = identity.groupName
    const role = route.capability.crudRole
    const runtimePath = route.identity.coordinates.runtimePath
    const hasParams = route.identity.parameters.all.length > 0
    const hasTrailingParam = CRUD_ROLE_REGISTRY[role].affectsSingleResource

    // Final action identity is already resolved by the upstream capability authority.
    const actionName = identity.actionName.value.value

  return ScannedClassifiedRouteDescriptor.fromRoute(route, {
    groupName,
    actionName,
    runtimePath,
    method,
    hasParams,
    hasTrailingParam,
    crudRole: role,
    contract: route.contract
  })
}

const routeIdentityKey = (route: RouteSemanticFlow): string => [
  route.identity.coordinates.name.value.value,
  route.provenance.sourceFile.value.value,
  String(route.provenance.sourceLine.value),
].join('::')

export function projectRoutes(
  routes: readonly RouteSemanticFlow[],
  groupAliases?: Readonly<Record<string, string>>
): ClassifiedRoute[] {
  const contract = routeActionIdentityCapabilityAuthority.resolve(routes.map(route => ({
    kind: 'route_action_identity_candidate' as const,
    routeKey: routeIdentityKey(route),
    sourceGroupName: route.identity.domain.group.value.value,
    actionName: route.capability.actionName,
    closed: true as const,
  })), groupAliases)
  const resolutions = new Map(contract.resolutions.map(resolution => [resolution.routeKey, resolution]))
  return routes.map(route => {
    const identity = resolutions.get(routeIdentityKey(route))
    if (!identity) throw new Error(`Missing upstream action identity for route ${routeIdentityKey(route)}`)
    return projectRoute(route, identity)
  })
}

/**
 * @deprecated Compatibility alias. Semantic classification is upstream; this
 * name remains only for callers that still use the historical projection API.
 */
export const classifyRoutes = projectRoutes;

/**
 * Group already-classified routes into resource capability slots.
 * The resulting kind is resolved exactly once after all routes are known.
 */
export function buildResourceMap(classified: readonly ClassifiedRoute[]): Map<string, ResourceCrudMap> {
  const map = new Map<string, ResourceCrudMap>()

  for (const route of classified) {
    const existing = map.get(route.groupName)
    const res = existing ?? {
      groupName: route.groupName,
      index: undefined,
      show: undefined,
      create: undefined,
      update: undefined,
      delete: undefined,
      all: []
    }

    res.all.push(route)

    if (route.crudRole === 'index' && !res.index) res.index = route
    if (route.crudRole === 'show' && !res.show) res.show = route
    if (route.crudRole === 'create' && !res.create) res.create = route
    if (route.crudRole === 'update' && !res.update) res.update = route
    if (route.crudRole === 'delete' && !res.delete) res.delete = route

    map.set(route.groupName, res)
  }

  return map
}

/**
 * Flat grouping projection for consumers that need route collections.
 */
export function buildGroupedRoutes(classified: readonly ClassifiedRoute[]): Record<string, ClassifiedRoute[]> {
  const result: Record<string, ClassifiedRoute[]> = {}
  for (const route of classified) {
    const group = result[route.groupName] ?? []
    group.push(route)
    result[route.groupName] = group
  }
  return result
}

/** Concrete downstream wiring for the already-closed upstream route capability. */
export const routeCapabilityProjection: RouteCapabilityProjectionInterface = Object.freeze({
  direction: 'upstream_to_downstream',
  upstreamAuthority: 'upstream',
  project: (route) => projectRoute(route),
});
