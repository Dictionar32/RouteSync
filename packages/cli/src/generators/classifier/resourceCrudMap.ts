/**
 * resourceCrudMap.ts
 *
 * ResourceCrudMap and ResolvedTypeInfo with Level 7 Complete Contracts.
 * Zero sentinel undefined, zero null.
 *
 * @module cli/generators/classifier
 */

import type { ClassifiedRoute } from './classifiedRouteDescriptor';

export interface CrudActionEntryContract {
  readonly action: 'index' | 'show' | 'create' | 'update' | 'delete';
  readonly route: ClassifiedRoute;
}

/**
 * Level 7 Complete Contract for ResourceCrudMap (0 undefined, 0 null, 0 ?:).
 */
export interface ResourceCrudMapContract {
  readonly groupName: string;
  readonly crudActions: readonly CrudActionEntryContract[];
  readonly allRoutes: readonly ClassifiedRoute[];
}

export type ResourceCrudMap = {
  groupName: string;
  index?: ClassifiedRoute;
  show?: ClassifiedRoute;
  create?: ClassifiedRoute;
  update?: ClassifiedRoute;
  delete?: ClassifiedRoute;
  all: ClassifiedRoute[];
};

/**
 * Level 7 Complete Contract for ResolvedTypeInfo (0 undefined, 0 null, 0 ?:).
 */
export interface ResolvedTypeInfoContract {
  readonly typeName: string;
  readonly importedType: string;
  readonly contractImportedType: string;
}

export type ResolvedTypeInfo = {
  readonly typeName: string;
  readonly importedType: string | null;
  readonly contractImportedType: string | null;
};
