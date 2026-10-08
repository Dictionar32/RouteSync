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
import { projectRoutes, buildResourceMap } from './routeGrouper';
import { resourceGroupCapabilitiesFromRoutes } from '@routesync/core';
import { resolveGroupErrorType, getStandardMutationKeys } from './typeResolver';
import { buildCrudGroupDescriptor, buildCustomOrSingletonGroupDescriptor } from './builders';

export function buildClassifiedDomainGraph(manifest: RouteManifest): ClassifiedDomainGraph<ClassifiedRoute> {
  const groupAliases = manifest.frontend && manifest.frontend.groupAliases ? manifest.frontend.groupAliases : undefined;
  const classified = projectRoutes(manifest.routes, groupAliases);
  const rawResources = buildResourceMap(classified);
  const groupCapabilities = manifest.resourceGroupCapabilities ?? resourceGroupCapabilitiesFromRoutes(manifest.routes);
  const groupCapabilityByName = new Map(groupCapabilities.map(capability => [capability.groupName, capability]));

  const resourceGroups: ResourceGroupDescriptor<ClassifiedRoute>[] = [];

  for (const [groupName, res] of rawResources) {
    const capability = groupCapabilityByName.get(groupName) ?? groupCapabilityByName.get(res.all[0]?.identity.domain.group.value.value);
    if (!capability || capability.closed !== true) {
      throw new Error(`Missing closed upstream ResourceGroupCapability for group: ${groupName}`);
    }
    const KEY = groupName.toUpperCase();
    const Title = toTypeName(groupName);
    const errorRes = resolveGroupErrorType(res.all);
    const standardKeys = getStandardMutationKeys(res);

    if (capability.shape === 'full_crud' || capability.shape === 'read_only_crud' || capability.shape === 'flexible_crud') {
      if (!res.index || !res.show) {
        throw new Error(`Upstream group capability ${capability.shape} requires index and show routes: ${groupName}`);
      }
      resourceGroups.push(
        buildCrudGroupDescriptor(groupName, KEY, Title, res, errorRes, standardKeys, manifest.resourceModelKeyCapabilities, capability.shape)
      );
    } else {
      resourceGroups.push(
        buildCustomOrSingletonGroupDescriptor(groupName, KEY, Title, res, errorRes, standardKeys, capability.shape)
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
