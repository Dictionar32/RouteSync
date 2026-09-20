/**
 * resourceRouteGroupDescriptor.ts
 *
 * Descriptor class and factories for ResourceRouteGroup.
 *
 * @module core/compiler/scanner/descriptors/manifest
 */

import type { ParsedRoute, ResourceRouteGroup } from '../../../../types/route';
import type { ParsedResource } from '../../../../types/domain/expressions';
import type { ParsedModel } from '../../../../types/domain/models';
import type { BaseResourceGroupParams } from '../../../../types/domain/resourceGroupDescriptors';
import {
  ResourceGroupKind,
  ScannedCustomResourceGroupDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature,
  type FullCrudTypeSignature,
  type ReadOnlyCrudTypeSignature,
  type FlexibleCrudTypeSignature,
  type SingletonTypeSignature,
  type CustomTypeSignature
} from '../../../../types/domain/resourceGroupDescriptors';

export interface ScannedResourceRouteGroupParams {
  readonly routes: readonly ParsedRoute[];
  readonly resources: readonly ParsedResource[];
  readonly models: readonly ParsedModel[];
}

function responseType(route: ParsedRoute): string {
  return route.contract.response.success.descriptor.responseTypeName().value.value;
}

interface ResolvedResourceGroupTypes {
  readonly list: string;
  readonly detail: string;
  readonly create: string;
  readonly update: string;
  readonly error: string;
}

function typeSignature(types: ResolvedResourceGroupTypes): ScannedResourceGroupTypeSignature {
  return new ScannedResourceGroupTypeSignature({
    list: types.list,
    detail: types.detail,
    create: types.create,
    update: types.update,
    error: types.error,
    hasCustomError: types.error !== 'ApiError',
    importedTypes: Object.freeze([]),
    contractImportedTypes: Object.freeze([])
  });
}

function responseTypeOrNever(route: ParsedRoute | undefined): string {
  return route === undefined ? 'never' : responseType(route);
}

function buildParams(routes: readonly ParsedRoute[], resources: readonly ParsedResource[], models: readonly ParsedModel[]) {
  const resourceName = routes[0].identity.domain.resource.value.value;
  const resource = resources.find(item => item.identity.name.value.value === resourceName);
  if (resource === undefined) throw new Error(`Resource '${resourceName}' is missing from the scanned resource surface`);
  const binding = resource.binding.model;
  if (binding.kind !== 'model') throw new Error(`Resource '${resourceName}' is not bound to a model`);
  const model = models.find(item => item.semantic.identity.name.value.value === binding.modelName);
  if (model === undefined) throw new Error(`Model '${binding.modelName}' is missing for resource '${resourceName}'`);
  const index = routes.find(route => route.capability.crudRole === 'index');
  const show = routes.find(route => route.capability.crudRole === 'show');
  const create = routes.find(route => route.capability.crudRole === 'create');
  const update = routes.find(route => route.capability.crudRole === 'update');
  const remove = routes.find(route => route.capability.crudRole === 'delete');
  return {
    groupName: resourceName,
    keyName: model.semantic.identity.primaryKey.value.value,
    titleName: resourceName,
    primaryKeyType: model.semantic.key.type,
    index, show, create, update, delete: remove, all: routes,
    extraMutations: routes.filter(route => route.capability.crudRole === 'custom' && route.capability.hookKind === 'mutation'),
    customQueries: routes.filter(route => route.capability.crudRole === 'custom' && route.capability.hookKind !== 'mutation')
  };
}

export class ScannedResourceRouteGroupDescriptor {
  public static createMany({ routes, resources, models }: ScannedResourceRouteGroupParams): readonly ResourceRouteGroup[] {
    const grouped = new Map<string, ParsedRoute[]>();
    for (const route of routes) {
      const key = route.identity.domain.resource.value.value;
      const current = grouped.get(key);
      if (current === undefined) {
        grouped.set(key, [route]);
      } else {
        current.push(route);
      }
    }
    return Object.freeze(Array.from(grouped.values()).map(group =>
      ScannedResourceRouteGroupDescriptor.create({ routes: group, resources, models })
    ));
  }

  public static create({ routes, resources, models }: ScannedResourceRouteGroupParams): ResourceRouteGroup {
    if (routes.length === 0) throw new Error('Resource route group cannot be created without routes');
    const params = buildParams(routes, resources, models);
  const base: BaseResourceGroupParams<ParsedRoute> = {
    groupName: params.groupName, keyName: params.keyName, titleName: params.titleName,
    all: params.all,
    primaryRoute: params.show ?? params.index ?? params.all[0], extraMutations: params.extraMutations, customQueries: params.customQueries
  };
    const hasIndex = params.index !== undefined;
    const hasShow = params.show !== undefined;
    const hasCreate = params.create !== undefined;
    const hasUpdate = params.update !== undefined;
    const hasDelete = params.delete !== undefined;
    const error = routes[0].contract.response.errorUnionType.value.value;

    if (hasIndex && hasShow && hasCreate && hasUpdate && hasDelete) {
      return new ScannedFullCrudResourceGroupDescriptor<ParsedRoute>({
        ...base, primaryKeyType: params.primaryKeyType, index: params.index as ParsedRoute, show: params.show as ParsedRoute, create: params.create as ParsedRoute, update: params.update as ParsedRoute, delete: params.delete as ParsedRoute,
        types: typeSignature({ list: responseType(params.index as ParsedRoute), detail: responseType(params.show as ParsedRoute), create: responseType(params.create as ParsedRoute), update: responseType(params.update as ParsedRoute), error }) as FullCrudTypeSignature
      });
    }
    if (hasIndex && hasShow && !hasCreate && !hasUpdate && !hasDelete) {
      return new ScannedReadOnlyCrudResourceGroupDescriptor<ParsedRoute>({
        ...base, primaryKeyType: params.primaryKeyType, index: params.index as ParsedRoute, show: params.show as ParsedRoute,
        types: typeSignature({ list: responseType(params.index as ParsedRoute), detail: responseType(params.show as ParsedRoute), create: 'never', update: 'never', error }) as ReadOnlyCrudTypeSignature
      });
    }
    if (hasIndex && hasShow) {
      return new ScannedFlexibleCrudResourceGroupDescriptor<ParsedRoute>({
        ...base, primaryKeyType: params.primaryKeyType, index: params.index as ParsedRoute, show: params.show as ParsedRoute,
        create: hasCreate ? { available: true, route: params.create as ParsedRoute } : { available: false },
        update: hasUpdate ? { available: true, route: params.update as ParsedRoute } : { available: false },
        delete: hasDelete ? { available: true, route: params.delete as ParsedRoute } : { available: false },
        types: typeSignature({ list: responseType(params.index as ParsedRoute), detail: responseType(params.show as ParsedRoute), create: responseTypeOrNever(params.create), update: responseTypeOrNever(params.update), error }) as FlexibleCrudTypeSignature
      });
    }
    if (hasCreate || hasUpdate || hasDelete) {
      return new ScannedSingletonResourceGroupDescriptor<ParsedRoute>({
        ...base,
        types: typeSignature({ list: 'never', detail: responseTypeOrNever(params.show), create: responseTypeOrNever(params.create), update: responseTypeOrNever(params.update), error }) as SingletonTypeSignature
      });
    }
    return new ScannedCustomResourceGroupDescriptor<ParsedRoute>({
      ...base, detailKeyFn: ResourceGroupKind.Custom,
      types: typeSignature({ list: responseTypeOrNever(params.index), detail: responseTypeOrNever(params.show), create: responseTypeOrNever(params.create), update: responseTypeOrNever(params.update), error }) as CustomTypeSignature
    });
  }
}
