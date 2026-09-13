/**
 * routesObjectBuilder.ts
 *
 * Generates ROUTES constant map lines from RouteManifest.
 *
 * @module cli/generators/constants
 */

import {
  RouteManifest,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  getRouteContract
} from '@routesync/core';

export function buildRoutesLines(manifest: RouteManifest): string[] {
  const lines: string[] = [];

  lines.push(`export const ROUTES = {`);
  lines.push(`  HOME: '/',`);

  const addedRoutes = new Set<string>();
  addedRoutes.add('/');

  const getRoutes = manifest.routes.filter(r => r.method.toUpperCase() === 'GET');
  for (const route of getRoutes) {
    const cleanPath = route.path.replace(/^\/|\/$/g, '');
    if (!cleanPath || addedRoutes.has('/' + cleanPath)) continue;

    const contract = route.contract ?? getRouteContract(route);
    const segments = cleanPath.split('/');
    const routeKey = segments.map(s => {
      if ((s.startsWith('{') && s.endsWith('}')) || s.startsWith(':')) {
        return 'DETAIL';
      }
      return s.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    }).filter(Boolean).join('_');

    const hasExplicitParams = Boolean(route.pathParameters && route.pathParameters.length > 0);
    const pathParams = contract.request.pathParameters.map(p => ({
      name: p.name,
      propertyName: p.propertyName,
      type: hasExplicitParams ? ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType : 'string | number'
    }));

    if (pathParams.length > 0) {
      let bodyTemplate = contract.runtimePath.startsWith('/') ? contract.runtimePath : '/' + contract.runtimePath;
      for (const p of pathParams) {
        bodyTemplate = bodyTemplate.split(`:${p.name}`).join('${' + p.propertyName + '}');
      }
      if (!bodyTemplate.startsWith('/')) {
        bodyTemplate = '/' + bodyTemplate;
      }
      const argsStr = pathParams.map(p => `${p.propertyName}: ${p.type}`).join(', ');
      lines.push(`  ${routeKey}: (${argsStr}) => \`${bodyTemplate}\`,`);
    } else {
      lines.push(`  ${routeKey}: '/${cleanPath}',`);
    }
    addedRoutes.add('/' + cleanPath);
  }
  lines.push(`} as const`);
  lines.push(``);

  return lines;
}
