/**
 * classifierTypes.ts
 *
 * Core domain types and descriptors for classified routes and resource CRUD maps.
 *
 * @module cli/generators/classifier
 */

import {
  type ParsedRoute,
  type EndpointContract,
  type CrudRole,
  getRouteContract
} from '@routesync/core'

export interface ClassifiedRoute {
  raw: ParsedRoute
  contract: EndpointContract // Pure CDA Direct Contract SSOT
  /** e.g. "produk", "cartItems", "adminProduk", "produkReviews" */
  groupName: string
  /** e.g. "get", "getById", "post", "patch", "delete" */
  actionName: string
  /** Express-style runtime path, e.g. "/produk/:id" */
  runtimePath: string
  method: string
  /** True when the path contains at least one dynamic segment */
  hasParams: boolean
  /** True when the LAST path segment is dynamic (determines REST role) */
  hasTrailingParam: boolean
  crudRole: CrudRole
}

export interface ScannedClassifiedRouteParams {
  readonly raw: ParsedRoute
  readonly contract: EndpointContract
  readonly groupName: string
  readonly actionName: string
  readonly runtimePath: string
  readonly method: string
  readonly hasParams: boolean
  readonly hasTrailingParam: boolean
  readonly crudRole: CrudRole
}

/**
 * Reusable Constructor: Scanned Classified Route Descriptor.
 */
export class ScannedClassifiedRouteDescriptor implements ClassifiedRoute {
  public readonly raw: ParsedRoute
  public readonly contract: EndpointContract
  public readonly groupName: string
  public readonly actionName: string
  public readonly runtimePath: string
  public readonly method: string
  public readonly hasParams: boolean
  public readonly hasTrailingParam: boolean
  public readonly crudRole: CrudRole

  constructor(params: ScannedClassifiedRouteParams) {
    this.raw = params.raw
    this.contract = params.contract
    this.groupName = params.groupName
    this.actionName = params.actionName
    this.runtimePath = params.runtimePath
    this.method = params.method
    this.hasParams = params.hasParams
    this.hasTrailingParam = params.hasTrailingParam
    this.crudRole = params.crudRole
    Object.freeze(this)
  }

  public static fromRoute(
    raw: ParsedRoute,
    meta: {
      readonly groupName: string
      readonly actionName: string
      readonly runtimePath: string
      readonly method: string
      readonly hasParams: boolean
      readonly hasTrailingParam: boolean
      readonly crudRole: CrudRole
      readonly contract?: EndpointContract
    }
  ): ScannedClassifiedRouteDescriptor {
    return new ScannedClassifiedRouteDescriptor({
      raw,
      contract: meta.contract ?? getRouteContract(raw),
      groupName: meta.groupName,
      actionName: meta.actionName,
      runtimePath: meta.runtimePath,
      method: meta.method,
      hasParams: meta.hasParams,
      hasTrailingParam: meta.hasTrailingParam,
      crudRole: meta.crudRole
    })
  }
}

export interface ResourceCrudMap {
  groupName: string
  /** GET /resource */
  index?: ClassifiedRoute
  /** GET /resource/:id */
  show?: ClassifiedRoute
  /** POST /resource */
  create?: ClassifiedRoute
  /** PUT or PATCH /resource/:id */
  update?: ClassifiedRoute
  /** DELETE /resource/:id */
  delete?: ClassifiedRoute
  /** All routes in this group (including sub-resources classified as "custom") */
  all: ClassifiedRoute[]
}

export interface ResolvedTypeInfo {
  readonly typeName: string
  readonly importedType: string | null
  readonly contractImportedType: string | null
}
