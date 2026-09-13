/**
 * routeResolver.ts
 *
 * Incrementally resolves route definitions and response payloads.
 *
 * @module cli/utils/incremental/routeResolver
 */

import { SourceRef, SemanticIRNode, IRNodeRegistry } from '@routesync/core';
import { PhpCodeParser } from '../../parsers/PhpCodeParser';
import { ScannedManifest, ScannedRoute, ScannedModel, KernelResolver } from './incrementalTypes';
import { calculateRouteHash } from './routeHasher';
import { canonicalizeCollectionDescriptor } from './collectionCanonicalizer';
import { FieldResolverFn } from './fieldResolver';

export interface ResolveRoutesParams {
  manifest: ScannedManifest;
  prevRouteMap: Map<string, ScannedRoute>;
  prevIRNodes: Record<string, SemanticIRNode>;
  models: ScannedModel[] | undefined;
  kernel: KernelResolver;
  irRegistry: IRNodeRegistry;
  resolveField: FieldResolverFn;
}

export function resolveRoutes({
  manifest,
  prevRouteMap,
  prevIRNodes,
  models,
  kernel,
  irRegistry,
  resolveField
}: ResolveRoutesParams): void {
  const availableModelNames = (models || []).map((m) => m.name);
  if (!manifest.routes) return;

  manifest.routes.forEach((route: ScannedRoute) => {
    const hash = calculateRouteHash(route, availableModelNames);
    route.stableHash = hash;

    const cachedRoute = prevRouteMap.get(`${route.method}:${route.path}`);
    if (cachedRoute && cachedRoute.stableHash === hash) {
      route.response = cachedRoute.response && typeof cachedRoute.response === 'object'
        ? canonicalizeCollectionDescriptor(cachedRoute.response)
        : cachedRoute.response;
      route.assignments = cachedRoute.assignments;

      const cachedRouteId = `route:${route.method}:${route.path}`;
      for (const [nodeId, node] of Object.entries(prevIRNodes)) {
        if (nodeId === cachedRouteId || nodeId.startsWith(`${cachedRouteId}#`)) {
          irRegistry.add(node);
        }
      }
      return;
    }

    const parsedAssignments: Record<string, unknown> = {};
    const resolvedAssignments: Record<string, unknown> = {};
    const contextForAssignments = {
      modelMap: {},
      relationMap: {},
      layer: 'route',
      fileName: route.name,
      assignments: parsedAssignments,
      resolvedAssignments: resolvedAssignments
    };

    if (route.assignments) {
      for (const varName in route.assignments) {
        const code = route.assignments[varName];
        const ast = PhpCodeParser.parseExpression(code, {});
        parsedAssignments[varName] = ast;
        const resolved = kernel.resolve(ast, contextForAssignments);
        if (resolved && resolved.status !== 'unknown') {
          resolvedAssignments[varName] = resolved;
        }
      }
    }

    const routeSource: SourceRef = {
      file: route.sourceFile ?? '',
      line: route.sourceLine ?? undefined,
      context: 'route',
    };
    const routeId = `route:${route.method}:${route.path}`;

    if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
      route.response = resolveField(
        route.response as Record<string, unknown>,
        null,
        parsedAssignments,
        resolvedAssignments,
        `${routeId}#response`,
        routeSource,
        [routeId]
      ) as Record<string, unknown>;
    } else if (route.response && route.response.kind === 'object' && route.response.fields) {
      const fields = route.response.fields as Record<string, unknown>;
      for (const key in fields) {
        const field = fields[key] as Record<string, unknown>;
        if (field.kind && field.kind !== 'primitive') {
          fields[key] = resolveField(
            field,
            null,
            parsedAssignments,
            resolvedAssignments,
            `${routeId}#response.fields.${key}`,
            routeSource,
            [routeId]
          ) as Record<string, unknown>;
        }
      }
    }

    if (route.response && typeof route.response === 'object') {
      route.response = canonicalizeCollectionDescriptor(route.response);
    }
  });
}
