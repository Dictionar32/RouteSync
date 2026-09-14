/**
 * classifiedRouteDescriptor.ts
 *
 * Classified route types and ScannedClassifiedRouteDescriptor.
 *
 * @module cli/generators/classifier
 */

import {
  type ParsedRoute,
  type EndpointContract,
  type CrudRole,
  getRouteContract
} from '@routesync/core';

export interface ClassifiedRouteContract {
  readonly raw: ParsedRoute;
  readonly contract: EndpointContract;
  readonly groupName: string;
  readonly actionName: string;
  readonly runtimePath: string;
  readonly method: string;
  readonly hasParams: boolean;
  readonly hasTrailingParam: boolean;
  readonly crudRole: CrudRole;
}

export type ClassifiedRoute = {
  raw: ParsedRoute;
  contract: EndpointContract;
  groupName: string;
  actionName: string;
  runtimePath: string;
  method: string;
  hasParams: boolean;
  hasTrailingParam: boolean;
  crudRole: CrudRole;
};

export interface ScannedClassifiedRouteParams {
  readonly raw: ParsedRoute;
  readonly contract: EndpointContract;
  readonly groupName: string;
  readonly actionName: string;
  readonly runtimePath: string;
  readonly method: string;
  readonly hasParams: boolean;
  readonly hasTrailingParam: boolean;
  readonly crudRole: CrudRole;
}

export class ScannedClassifiedRouteDescriptor implements ClassifiedRoute {
  public readonly raw: ParsedRoute;
  public readonly contract: EndpointContract;
  public readonly groupName: string;
  public readonly actionName: string;
  public readonly runtimePath: string;
  public readonly method: string;
  public readonly hasParams: boolean;
  public readonly hasTrailingParam: boolean;
  public readonly crudRole: CrudRole;

  constructor(params: ScannedClassifiedRouteParams) {
    this.raw = params.raw;
    this.contract = params.contract;
    this.groupName = params.groupName;
    this.actionName = params.actionName;
    this.runtimePath = params.runtimePath;
    this.method = params.method;
    this.hasParams = params.hasParams;
    this.hasTrailingParam = params.hasTrailingParam;
    this.crudRole = params.crudRole;
    Object.freeze(this);
  }

  public static fromRoute(
    raw: ParsedRoute,
    meta: {
      readonly groupName: string; readonly actionName: string; readonly runtimePath: string;
      readonly method: string; readonly hasParams: boolean; readonly hasTrailingParam: boolean;
      readonly crudRole: CrudRole; readonly contract?: EndpointContract;
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
    });
  }
}
