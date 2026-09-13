/**
 * typeResolver.ts
 *
 * Resolvers for primary keys, response types, form payload types, and group error unions.
 *
 * @module cli/generators/classifier
 */

import {
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  type ParsedModel
} from '@routesync/core'
import { toTypeName } from '../names'
import { CANONICAL_ACTION_MAP } from '../canonical-names'
import type { ClassifiedRoute, ResolvedTypeInfo, ResourceCrudMap } from './classifierTypes'

export function resolveItemPrimaryKeyType(
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
      const mShort = toTypeName(m.shortName || '')
      return mTitle === titleName || mShort === titleName
        || mTitle + 's' === titleName || mShort + 's' === titleName
        || titleName + 's' === mTitle || titleName.replace(/s$/, '') === mTitle.replace(/s$/, '')
    })
    if (matchedModel && matchedModel.keySemanticType === 'number') return 'number'
    if (matchedModel && matchedModel.keySemanticType === 'string') return 'string'
  }
  return RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Crud].defaultPrimaryKeyType
}

export function resolveRouteResponseType(route?: ClassifiedRoute): { readonly typeName: string; readonly importedType: string | null } {
  if (!route) return { typeName: 'never', importedType: null }
  let readType = route.contract.response.success.readTypeName
  if (!readType || readType === 'unknown') {
    const rawResp = route.raw.response as { semantic?: { readTypeName?: string }; resource?: string; model?: string } | undefined
    if (rawResp) {
      if (rawResp.semantic && rawResp.semantic.readTypeName) {
        readType = rawResp.semantic.readTypeName
      } else if (rawResp.resource) {
        readType = `${rawResp.resource}Transformed`
      } else if (rawResp.model) {
        readType = `${rawResp.model}Transformed`
      } else {
        readType = 'never'
      }
    } else {
      readType = 'never'
    }
  }
  if (readType && readType !== 'void' && readType !== 'unknown' && readType !== 'never') {
    return { typeName: readType, importedType: readType }
  }
  return { typeName: readType || 'never', importedType: null }
}

export function resolveRouteFormType(route?: ClassifiedRoute): ResolvedTypeInfo {
  if (!route) return { typeName: 'never', importedType: null, contractImportedType: null }
  const hasSchema = Boolean(route.raw.schema && route.raw.schema.rules && Object.keys(route.raw.schema.rules).length > 0)
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

export function resolveGroupErrorType(allRoutes: readonly ClassifiedRoute[]): {
  readonly errorUnionType: string
  readonly errorTypes: readonly string[]
  readonly hasCustomError: boolean
} {
  const errorTypes = new Set<string>()
  for (const route of allRoutes) {
    for (const err of route.contract.response.errors) {
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

export function collectImportedTypes(types: readonly (string | null | undefined)[]): readonly string[] {
  const set = new Set<string>()
  for (const t of types) {
    if (t) set.add(t)
  }
  return Object.freeze(Array.from(set).sort())
}

export function getStandardMutationKeys(res: ResourceCrudMap): readonly string[] {
  const keys: string[] = []
  if (res.create) keys.push('create')
  if (res.update) keys.push('update')
  if (res.delete) keys.push('remove')
  return keys
}
