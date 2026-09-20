/**
 * routeGrouper.ts
 *
 * Projects already-resolved ParsedRoute values into classifier views.
 * Classification is an upstream responsibility: this module never
 * derives CRUD meaning from method/path.
 *
 * @module cli/generators/classifier
 */

import {
  type ParsedRoute,
  CRUD_ROLE_REGISTRY,
  matchCrudRole
} from '@routesync/core'
import {
  type ClassifiedRoute,
  ScannedClassifiedRouteDescriptor,
  type ResourceCrudMap
} from './classifierTypes'

/**
 * Project resolved routes into the legacy ClassifiedRoute surface.
 *
 * IMPORTANT:
 * ParsedRoute.capability.crudRole is authoritative.
 * No path inspection, HTTP-method classification, or fallback role exists here.
 */
export function classifyRoutes(
  routes: readonly ParsedRoute[],
  groupAliases?: Readonly<Record<string, string>>
): ClassifiedRoute[] {
  const usedActions = new Map<string, Set<string>>()

  return routes.map(route => {
    const method = route.identity.method
    const sourceGroupName = route.identity.groupName
    const groupName = groupAliases?.[sourceGroupName] ?? sourceGroupName
    const role = route.capability.crudRole
    const runtimePath = route.identity.runtimePath
    const hasParams = route.identity.parameters.all.length > 0
    const hasTrailingParam = CRUD_ROLE_REGISTRY[role].affectsSingleResource

    const baseAction = matchCrudRole(role, {
      index: spec => spec.defaultActionName,
      show: spec => spec.defaultActionName,
      create: spec => spec.defaultActionName,
      update: spec => spec.defaultActionName,
      delete: spec => spec.defaultActionName,
      custom: () => method.toLowerCase(),
    })

    const used = usedActions.get(groupName) ?? new Set<string>()
    usedActions.set(groupName, used)

    let actionName = baseAction
    if (used.has(actionName)) {
      let suffix = 2
      while (used.has(`${baseAction}${suffix}`)) suffix += 1
      actionName = `${baseAction}${suffix}`
    }
    used.add(actionName)

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
  })
}

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
