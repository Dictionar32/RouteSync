/**
 * singletonGroupBuilder.ts
 *
 * Builds Custom or Singleton ResourceGroupDescriptors.
 *
 * @module cli/generators/classifier/builders
 */

import {
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  type ResourceGroupDescriptor,
  type SingletonTypeSignature,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature
} from '@routesync/core';
import type { ClassifiedRoute, ResourceCrudMap } from '../classifierTypes';
import {
  resolveRouteResponseType,
  resolveRouteFormType,
  collectImportedTypes
} from '../typeResolver';
import { partitionGroupSubRoutes, type ErrorResolutionResult } from './subRoutePartitioner';

export function buildCustomOrSingletonGroupDescriptor(
  groupName: string,
  keyName: string,
  titleName: string,
  res: ResourceCrudMap,
  errorRes: ErrorResolutionResult,
  standardKeys: readonly string[]
): ResourceGroupDescriptor<ClassifiedRoute> {
  const hasSchema = (route?: ClassifiedRoute): boolean =>
    Boolean(route && route.raw.schema && route.raw.schema.rules && Object.keys(route.raw.schema.rules).length > 0);

  const listRes = res.index ? resolveRouteResponseType(res.index) : { typeName: 'never', importedType: null };

  let detailRes = res.show ? resolveRouteResponseType(res.show) : null;
  if (!detailRes) {
    const customGet = res.all.find(r => r.method === 'GET' && r.crudRole === 'custom');
    detailRes = customGet ? resolveRouteResponseType(customGet) : { typeName: 'never', importedType: null };
  }

  let createRes = res.create ? resolveRouteFormType(res.create) : null;
  if (!createRes) {
    const customPost = res.all.find(r => r.method === 'POST' && r.crudRole === 'custom' && hasSchema(r));
    const customGet = res.all.find(r => r.method === 'GET' && r.crudRole === 'custom' && hasSchema(r));
    const fallback = customPost || customGet;
    createRes = fallback ? resolveRouteFormType(fallback) : { typeName: 'never', importedType: null, contractImportedType: null };
  }

  let updateRes = res.update ? resolveRouteFormType(res.update) : null;
  if (!updateRes) {
    const customUpdate = res.all.find(r => ['PUT', 'PATCH'].includes(r.method) && r.crudRole === 'custom' && hasSchema(r));
    updateRes = customUpdate ? resolveRouteFormType(customUpdate) : { typeName: 'never', importedType: null, contractImportedType: null };
  }

  const groupTypes = new ScannedResourceGroupTypeSignature({
    list: listRes.typeName,
    detail: detailRes.typeName,
    create: createRes.typeName,
    update: updateRes.typeName,
    error: errorRes.errorUnionType,
    hasCustomError: errorRes.hasCustomError,
    importedTypes: collectImportedTypes([listRes.importedType, detailRes.importedType, createRes.importedType, updateRes.importedType, ...errorRes.errorTypes]),
    contractImportedTypes: collectImportedTypes([createRes.contractImportedType, updateRes.contractImportedType])
  });

  const subRoutes = partitionGroupSubRoutes(res.all, standardKeys, false);
  const hasAnyTrailingParam = res.all.some(r => r.hasTrailingParam);

  if (hasAnyTrailingParam) {
    const detailKeyFn = res.show ? res.show.actionName : RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Custom].defaultDetailKeyFn;
    return new ScannedCustomResourceGroupDescriptor<ClassifiedRoute>({
      groupName,
      keyName,
      titleName,
      detailKeyFn,
      types: groupTypes,
      all: Object.freeze(res.all),
      extraMutations: subRoutes.extraMutations,
      customQueries: subRoutes.customQueries
    });
  }

  return new ScannedSingletonResourceGroupDescriptor<ClassifiedRoute>({
    groupName,
    keyName,
    titleName,
    types: groupTypes as SingletonTypeSignature,
    all: Object.freeze(res.all),
    extraMutations: subRoutes.extraMutations,
    customQueries: subRoutes.customQueries
  });
}
