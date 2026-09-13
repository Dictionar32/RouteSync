/**
 * domainGraphBuilder.ts
 *
 * Assembles ClassifiedDomainGraph from RouteManifest and classified routes.
 *
 * @module cli/generators/classifier
 */

import {
  type RouteManifest,
  type ClassifiedDomainGraph,
  type ResourceGroupDescriptor,
  createResourceGroupGraph
} from '@routesync/core';
import { toTypeName } from '../names';
import type { ClassifiedRoute } from './classifierTypes';
import { classifyRoutes, buildResourceMap } from './routeGrouper';
import { resolveGroupErrorType, getStandardMutationKeys } from './typeResolver';
import { buildCrudGroupDescriptor, buildCustomOrSingletonGroupDescriptor } from './builders';

export function buildClassifiedDomainGraph(manifest: RouteManifest): ClassifiedDomainGraph<ClassifiedRoute> {
  const groupAliases = manifest.frontend && manifest.frontend.groupAliases ? manifest.frontend.groupAliases : undefined;
  const classified = classifyRoutes(manifest.routes, groupAliases);
  const rawResources = buildResourceMap(classified);

  const resourceGroups: ResourceGroupDescriptor<ClassifiedRoute>[] = [];

  for (const [groupName, res] of rawResources) {
    const KEY = groupName.toUpperCase();
    const Title = toTypeName(groupName);
    const errorRes = resolveGroupErrorType(res.all);
    const standardKeys = getStandardMutationKeys(res);

    if (res.index && res.show) {
      resourceGroups.push(
        buildCrudGroupDescriptor(groupName, KEY, Title, res, errorRes, standardKeys, manifest.models)
      );
    } else {
      resourceGroups.push(
        buildCustomOrSingletonGroupDescriptor(groupName, KEY, Title, res, errorRes, standardKeys)
      );
    }
  }

  const frozenResourceGroups = Object.freeze(resourceGroups);

  const resourceGroupMap = new Map<string, ResourceGroupDescriptor<ClassifiedRoute>>(
    frozenResourceGroups.map(group => [group.groupName, group])
  );

  const resourceGroupGraph = createResourceGroupGraph<ClassifiedRoute>(frozenResourceGroups);

  return Object.freeze({
    manifest,
    contracts: Object.freeze(classified.map(c => c.contract)),
    resourceGroups: frozenResourceGroups,
    resourceGroupMap,
    resourceGroupGraph,
    models: Object.freeze(manifest.models ? [...manifest.models] : [])
  });
}
