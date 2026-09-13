/**
 * routeGrouper.ts
 *
 * Route grouping and per-group action name deduplication.
 * Maps classified routes into ResourceCrudMaps and grouped records.
 *
 * @module cli/generators/classifier
 */

import {
  type ParsedRoute,
  CrudRole,
  CRUD_ROLE_REGISTRY,
  matchCrudRole
} from '@routesync/core'
import {
  type ClassifiedRoute,
  ScannedClassifiedRouteDescriptor,
  type ResourceCrudMap
} from './classifierTypes'

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
    const groupName = groupAliases && groupAliases[route.groupName] ? groupAliases[route.groupName] : route.groupName
    const role = (route.crudRole as CrudRole) || CrudRole.Custom
    const runtimePath = route.runtimePath
    const hasParams = route.pathParameters ? route.pathParameters.length > 0 : false
    const roleSpec = CRUD_ROLE_REGISTRY[role] || CRUD_ROLE_REGISTRY[CrudRole.Custom]
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

    return ScannedClassifiedRouteDescriptor.fromRoute(route, {
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
    if (!result[route.groupName]) {
      result[route.groupName] = []
    }
    result[route.groupName].push(route)
  }
  return result
}
