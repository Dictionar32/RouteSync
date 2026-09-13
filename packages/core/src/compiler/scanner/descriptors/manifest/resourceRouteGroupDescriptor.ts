/**
 * resourceRouteGroupDescriptor.ts
 *
 * Descriptor class and factories for ResourceRouteGroup.
 *
 * @module core/compiler/scanner/descriptors/manifest
 */

import type { ParsedRoute, ResourceRouteGroup } from '../../../../types/route';
import type { FormAction } from '../../../artifacts/RequestTypesArtifact';

export interface ScannedResourceRouteGroupParams {
  readonly resourceName: string;
  readonly formTypeName: string;
  readonly routes: readonly ParsedRoute[];
  readonly formActions: readonly FormAction[];
}

export class ScannedResourceRouteGroupDescriptor implements ResourceRouteGroup {
  public readonly resourceName: string;
  public readonly formTypeName: string;
  public readonly routes: readonly ParsedRoute[];
  public readonly formActions: readonly FormAction[];

  constructor({ resourceName, formTypeName, routes, formActions }: ScannedResourceRouteGroupParams) {
    this.resourceName = resourceName;
    this.formTypeName = formTypeName;
    this.routes = Object.freeze([...routes]);
    this.formActions = Object.freeze([...formActions]);
    Object.freeze(this);
  }

  public static create({
    resourceName,
    formTypeName = `${resourceName}Form`,
    routes = [],
    formActions = []
  }: {
    readonly resourceName: string;
    readonly formTypeName?: string;
    readonly routes?: readonly ParsedRoute[];
    readonly formActions?: readonly FormAction[];
  }): ScannedResourceRouteGroupDescriptor {
    return new ScannedResourceRouteGroupDescriptor({
      resourceName,
      formTypeName,
      routes,
      formActions
    });
  }
}
