/**
 * typeResolver.ts
 *
 * Resolvers for primary keys, response types, form payload types, and group error unions.
 * Pure Functional Composition: 0 'if', 0 'switch'.
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
  const primaryParam = targetRoute.contract.request.pathParameters[0];
  const paramTsType = primaryParam?.type ? ROUTE_PARAMETER_TYPE_REGISTRY[primaryParam.type]?.tsType : undefined;

  const matchedModel = (models && titleName)
    ? models.find(m => {
        const mTitle = toTypeName(m.name);
        const mShort = toTypeName(m.shortName || '');
        return mTitle === titleName || mShort === titleName
          || mTitle + 's' === titleName || mShort + 's' === titleName
          || titleName + 's' === mTitle || titleName.replace(/s$/, '') === mTitle.replace(/s$/, '');
      })
    : undefined;

  const modelKeyType = (matchedModel?.keySemanticType === 'number' || matchedModel?.keySemanticType === 'string')
    ? matchedModel.keySemanticType
    : undefined;

  return paramTsType ?? modelKeyType ?? RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Crud].defaultPrimaryKeyType;
}

function extractRawResponseType(rawResp: { semantic?: { readTypeName?: string }; resource?: string; model?: string } | undefined): string {
  return rawResp?.semantic?.readTypeName
    ?? (rawResp?.resource ? `${rawResp.resource}Transformed` : undefined)
    ?? (rawResp?.model ? `${rawResp.model}Transformed` : undefined)
    ?? 'never';
}

export function resolveRouteResponseType(route?: ClassifiedRoute): { readonly typeName: string; readonly importedType: string | null } {
  const contractType = route?.contract.response.success.readTypeName;
  const rawResp = route?.raw.response as { semantic?: { readTypeName?: string }; resource?: string; model?: string } | undefined;
  const rawType = extractRawResponseType(rawResp);

  const candidateType = (contractType && contractType !== 'unknown') ? contractType : rawType;
  const isImportable = Boolean(candidateType && candidateType !== 'void' && candidateType !== 'unknown' && candidateType !== 'never');

  return {
    typeName: candidateType || 'never',
    importedType: isImportable ? candidateType : null
  };
}

const STANDARD_FORM_ACTIONS: ReadonlySet<string> = new Set(['Create', 'Update', 'Get']);

export function resolveRouteFormType(route?: ClassifiedRoute): ResolvedTypeInfo {
  const hasSchema = Boolean(route?.raw.schema?.rules && Object.keys(route.raw.schema.rules).length > 0);
  const rawAction = route?.actionName ?? '';
  const actionKey = (CANONICAL_ACTION_MAP as Readonly<Record<string, string>>)[rawAction]
    || (rawAction ? rawAction.charAt(0).toUpperCase() + rawAction.slice(1) : '');

  const groupTypeName = toTypeName(route?.groupName ?? '');
  const formName = `${groupTypeName}Form`;
  const contractType = `${groupTypeName}${actionKey}Payload`;

  const isStandard = STANDARD_FORM_ACTIONS.has(actionKey);

  return !route
    ? { typeName: 'never', importedType: null, contractImportedType: null }
    : !hasSchema
    ? { typeName: 'void', importedType: null, contractImportedType: null }
    : isStandard
    ? { typeName: `${formName}['${actionKey}']`, importedType: formName, contractImportedType: null }
    : { typeName: contractType, importedType: null, contractImportedType: contractType };
}

export function resolveGroupErrorType(allRoutes: readonly ClassifiedRoute[]): {
  readonly errorUnionType: string
  readonly errorTypes: readonly string[]
  readonly hasCustomError: boolean
} {
  const errorTypes = new Set<string>();
  for (const route of allRoutes) {
    for (const err of route.contract.response.errors) {
      Boolean(err.typeName) && errorTypes.add(err.typeName);
    }
  }
  const hasCustomError = errorTypes.size > 0;
  const errorUnionType = hasCustomError
    ? Array.from(errorTypes).sort().join(' | ')
    : 'ApiError';
  return {
    errorUnionType,
    errorTypes: Object.freeze(Array.from(errorTypes).sort()),
    hasCustomError
  };
}

export function collectImportedTypes(types: readonly (string | null | undefined)[]): readonly string[] {
  const set = new Set<string>();
  for (const t of types) {
    Boolean(t) && set.add(t as string);
  }
  return Object.freeze(Array.from(set).sort());
}

const MUTATION_SLOTS: readonly (readonly [keyof ResourceCrudMap, string])[] = Object.freeze([
  ['create', 'create'],
  ['update', 'update'],
  ['delete', 'remove'],
]);

export function getStandardMutationKeys(res: ResourceCrudMap): readonly string[] {
  return MUTATION_SLOTS
    .filter(([slot]) => Boolean(res[slot]))
    .map(([, name]) => name);
}
