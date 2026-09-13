/**
 * crudGroupBuilder.ts
 *
 * Builds FullCrud, ReadOnlyCrud, or FlexibleCrud ResourceGroupDescriptors.
 *
 * @module cli/generators/classifier/builders
 */

import {
  type ResourceGroupDescriptor,
  type FullCrudTypeSignature,
  type ReadOnlyCrudTypeSignature,
  type FlexibleCrudTypeSignature,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature,
  MutationCapability,
  type ParsedModel
} from '@routesync/core';
import type { ClassifiedRoute, ResourceCrudMap } from '../classifierTypes';
import {
  resolveItemPrimaryKeyType,
  resolveRouteResponseType,
  resolveRouteFormType,
  collectImportedTypes
} from '../typeResolver';
import { partitionGroupSubRoutes, type ErrorResolutionResult } from './subRoutePartitioner';

export function buildCrudGroupDescriptor(
  groupName: string,
  keyName: string,
  titleName: string,
  res: ResourceCrudMap,
  errorRes: ErrorResolutionResult,
  standardKeys: readonly string[],
  models?: readonly ParsedModel[]
): ResourceGroupDescriptor<ClassifiedRoute> {
  const primaryKeyType = resolveItemPrimaryKeyType(res.show!, models, titleName);
  const listRes = resolveRouteResponseType(res.index);
  const detailRes = resolveRouteResponseType(res.show);
  const createRes = res.create ? resolveRouteFormType(res.create) : { typeName: 'never', importedType: null, contractImportedType: null };
  const updateRes = res.update ? resolveRouteFormType(res.update) : { typeName: 'never', importedType: null, contractImportedType: null };
  const subRoutes = partitionGroupSubRoutes(res.all, standardKeys, true);

  if (res.create && res.update && res.delete) {
    const types: FullCrudTypeSignature = new ScannedResourceGroupTypeSignature({
      list: listRes.typeName,
      detail: detailRes.typeName,
      create: createRes.typeName,
      update: updateRes.typeName,
      error: errorRes.errorUnionType,
      hasCustomError: errorRes.hasCustomError,
      importedTypes: collectImportedTypes([listRes.importedType, detailRes.importedType, createRes.importedType, updateRes.importedType, ...errorRes.errorTypes]),
      contractImportedTypes: collectImportedTypes([createRes.contractImportedType, updateRes.contractImportedType])
    });

    return new ScannedFullCrudResourceGroupDescriptor<ClassifiedRoute>({
      groupName,
      keyName,
      titleName,
      primaryKeyType,
      types,
      index: res.index!,
      show: res.show!,
      create: res.create,
      update: res.update,
      delete: res.delete,
      all: Object.freeze(res.all),
      extraMutations: subRoutes.extraMutations,
      customQueries: subRoutes.customQueries
    });
  }

  if (!res.create && !res.update && !res.delete) {
    const types: ReadOnlyCrudTypeSignature = new ScannedResourceGroupTypeSignature({
      list: listRes.typeName,
      detail: detailRes.typeName,
      create: 'never',
      update: 'never',
      error: errorRes.errorUnionType,
      hasCustomError: errorRes.hasCustomError,
      importedTypes: collectImportedTypes([listRes.importedType, detailRes.importedType, ...errorRes.errorTypes]),
      contractImportedTypes: Object.freeze([])
    }) as ReadOnlyCrudTypeSignature;

    return new ScannedReadOnlyCrudResourceGroupDescriptor<ClassifiedRoute>({
      groupName,
      keyName,
      titleName,
      primaryKeyType,
      types,
      index: res.index!,
      show: res.show!,
      all: Object.freeze(res.all),
      extraMutations: subRoutes.extraMutations,
      customQueries: subRoutes.customQueries
    });
  }

  const types: FlexibleCrudTypeSignature = new ScannedResourceGroupTypeSignature({
    list: listRes.typeName,
    detail: detailRes.typeName,
    create: createRes.typeName,
    update: updateRes.typeName,
    error: errorRes.errorUnionType,
    hasCustomError: errorRes.hasCustomError,
    importedTypes: collectImportedTypes([listRes.importedType, detailRes.importedType, createRes.importedType, updateRes.importedType, ...errorRes.errorTypes]),
    contractImportedTypes: collectImportedTypes([createRes.contractImportedType, updateRes.contractImportedType])
  });

  return new ScannedFlexibleCrudResourceGroupDescriptor<ClassifiedRoute>({
    groupName,
    keyName,
    titleName,
    primaryKeyType,
    types,
    index: res.index!,
    show: res.show!,
    create: MutationCapability.fromNullable(res.create),
    update: MutationCapability.fromNullable(res.update),
    delete: MutationCapability.fromNullable(res.delete),
    all: Object.freeze(res.all),
    extraMutations: subRoutes.extraMutations,
    customQueries: subRoutes.customQueries
  });
}
