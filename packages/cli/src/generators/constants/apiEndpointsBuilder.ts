/**
 * apiEndpointsBuilder.ts
 *
 * Generates API_ENDPOINTS constant map lines from RouteManifest.
 *
 * @module cli/generators/constants
 */

import {
  type RouteManifest,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  getRouteContract
} from '@routesync/core';
import { resolveRouteKey } from './routeKeyResolver';

export function buildApiEndpointsLines(manifest: RouteManifest): string[] {
  const lines: string[] = [];

  const uniqueRoutesMap = new Map<string, any>();
  for (const route of manifest.routes) {
    const path = route.identity.coordinates.path.value;
    if (!uniqueRoutesMap.has(path)) {
      uniqueRoutesMap.set(path, route);
    }
  }

  const uniqueRoutes = Array.from(uniqueRoutesMap.values());
  uniqueRoutes.sort((a, b) => a.identity.coordinates.path.value.localeCompare(b.identity.coordinates.path.value));

  const routeKeys = uniqueRoutes.map(route => {
    const endpointKey = resolveRouteKey(route.identity.coordinates.path.value);
    return { route, endpointKey };
  });

  lines.push(`export const API_ENDPOINTS = {`);
  for (const { route, endpointKey } of routeKeys) {
    const contract = route.contract ?? getRouteContract(route);
    const hasExplicitParams = route.identity.parameters.path.length > 0;
    const pathParams = contract.request.pathParameters.map(p => ({
      name: p.name,
      propertyName: p.propertyName,
      type: hasExplicitParams ? ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType : 'string | number'
    }));

    const normalizedPath = contract.runtimePath.startsWith('/')
      ? contract.runtimePath
      : '/' + contract.runtimePath;

    if (pathParams.length > 0) {
      let bodyTemplate = normalizedPath;
      for (const p of pathParams) {
        bodyTemplate = bodyTemplate.split(`:${p.name}`).join('${' + p.propertyName + '}');
      }
      if (!bodyTemplate.startsWith('/')) {
        bodyTemplate = '/' + bodyTemplate;
      }

      const argsStr = pathParams.map(p => `${p.propertyName}: ${p.type}`).join(', ');
      lines.push(`  ${endpointKey}: (${argsStr}) => \`${bodyTemplate}\`,`);
    } else {
      lines.push(`  ${endpointKey}: '${normalizedPath}',`);
    }
  }
  lines.push(`} as const`);
  lines.push(``);

  return lines;
}
