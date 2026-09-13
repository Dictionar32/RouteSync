/**
 * routeNormalizer.ts
 *
 * Normalizes scanned route definitions into NormalizedRoute models.
 *
 * @module cli/generators/normalizer/entities
 */

import type {
  RouteManifest,
  SemanticResolutionKernel,
  FieldNode
} from '@routesync/core';
import { PhpCodeParser } from '../../../parsers/PhpCodeParser';
import type {
  NormalizedRoute,
  SemanticNode,
  RuntimeAugmented,
  ResolutionContext
} from '../normalizerTypes';
import { mapToNormalizedField } from '../fieldNormalizer';

export function normalizeRoutes(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedRoute[] {
  const normalizedRoutes: NormalizedRoute[] = [];
  if (!manifest.routes) return normalizedRoutes;

  manifest.routes.forEach(route => {
    const parsedAssignments: Record<string, unknown> = {};
    const resolvedAssignments: Record<string, SemanticNode> = {};
    const context: ResolutionContext = {
      layer: 'route',
      fileName: route.name,
      modelMap: {},
      relationMap: {},
      assignments: parsedAssignments,
      resolvedAssignments: resolvedAssignments
    };

    if (route.assignments) {
      for (const varName in route.assignments) {
        const code = route.assignments[varName];
        const ast = PhpCodeParser.parseExpression(code, {});
        parsedAssignments[varName] = ast;
        const resolved = kernel.resolve(ast, context);
        if (resolved && resolved.status !== 'unknown') {
          resolvedAssignments[varName] = resolved as SemanticNode;
        }
      }
    }

    const resolveResponse = (meta: unknown) => {
      if (!meta) return;
      const augmentedMeta = meta as RuntimeAugmented;
      if (augmentedMeta.kind === 'object' && augmentedMeta.fields) {
        Object.values(augmentedMeta.fields).forEach((field: unknown) => {
          const augmentedField = field as RuntimeAugmented;
          const ast = augmentedField.parsed_ast || (augmentedField.node && (augmentedField.node as RuntimeAugmented).parsed_ast)
            || (augmentedField.kind && augmentedField.kind !== 'object' && augmentedField.kind !== 'raw_code' ? augmentedField : null);
          if (ast) {
            const resolved = kernel.resolve(ast as FieldNode, context);
            if (resolved && resolved.status !== 'unknown') {
              augmentedField.resolved = resolved;
            }
          }
          resolveResponse(field);
        });
      }
    };
    resolveResponse(route.response);

    const visited = new Set<string>();
    const responseDef = route.binding ? route.binding.response : route.response;
    const responseField = mapToNormalizedField(responseDef, 'response', visited);

    const routeId = route.identity ? route.identity.name : (route.name || route.uri);
    const routeUri = route.identity ? route.identity.path : (route.uri || route.path);
    const actionName = route.binding ? route.binding.actionName : (route.actionName || 'index');
    const controllerName = route.binding ? route.binding.controllerName : (route.controllerName || '');
    const upperMethod = (route.identity ? route.identity.method : route.method).toUpperCase();
    const method = (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(upperMethod)
      ? upperMethod
      : "GET") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

    normalizedRoutes.push({
      symbolId: `route:${routeId}`,
      method,
      uri: routeUri,
      actionName,
      controllerName,
      response: responseField
    });
  });

  return normalizedRoutes;
}
