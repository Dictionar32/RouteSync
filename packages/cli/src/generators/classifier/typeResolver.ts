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
  type ResourceModelKeyCapabilityContract
} from '@routesync/core'
import { toTypeName } from '../names'
import { matchCrudRole } from '@routesync/core'
import type { ClassifiedRoute, ResolvedTypeInfo, ResourceCrudMap } from './classifierTypes'

export function resolveItemPrimaryKeyType(
  targetRoute: ClassifiedRoute,
  capabilities: readonly ResourceModelKeyCapabilityContract[] = [],
): string {
  const primaryParam = targetRoute.contract.request.pathParameters[0];
  const paramTsType = primaryParam?.type ? ROUTE_PARAMETER_TYPE_REGISTRY[primaryParam.type]?.tsType : undefined;
  const resourceCapability = capabilities.find(capability =>
    capability.identity.resource.value.value === targetRoute.identity.domain.resource.value.value
  );
  const modelKeyType = resourceCapability?.key.kind === 'number' || resourceCapability?.key.kind === 'string'
    ? resourceCapability.key.kind
    : undefined;

  return paramTsType ?? modelKeyType ?? RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Crud].defaultPrimaryKeyType;
}

function extractContractResponseType(route: ClassifiedRoute | undefined): string {
  if (!route) return 'never';
  return route.contract.response.success.descriptor.responseTypeName().value;
}

export function resolveRouteResponseType(route?: ClassifiedRoute): { readonly typeName: string; readonly importedType: string | null } {
  const contractType = extractContractResponseType(route);

  const candidateType = contractType;
  const isImportable = Boolean(candidateType && candidateType !== 'void' && candidateType !== 'unknown' && candidateType !== 'never');

  return {
    typeName: candidateType || 'never',
    importedType: isImportable ? candidateType : null
  };
}

const STANDARD_FORM_ACTIONS: ReadonlySet<string> = new Set(['Create', 'Update', 'Get']);

export function resolveRouteFormType(route?: ClassifiedRoute): ResolvedTypeInfo {
  const hasSchema = Boolean(route?.contract.request.body.kind === 'body' && route.contract.request.body.schema.rules && Object.keys(route.contract.request.body.schema.rules).length > 0);
  const actionKey = route
    ? matchCrudRole(route.crudRole, {
        index: () => 'Get',
        show: () => 'Get',
        create: () => 'Create',
        update: () => 'Update',
        delete: () => 'Delete',
        custom: () => route.actionName
          ? route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1)
          : '',
      })
    : '';

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
