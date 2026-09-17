/**
 * routeResponseResolver.ts
 *
 * Resolves fields and canonicalizes collection descriptors on route responses.
 *
 * @module cli/utils/incremental
 */

import type { SourceRef } from '@routesync/core';
import type { ScannedRoute } from './incrementalTypes';
import { canonicalizeCollectionDescriptor } from './collectionCanonicalizer';
import type { FieldResolverFn } from './fieldResolver';

export function resolveRouteResponse(
  route: ScannedRoute,
  parsedAssignments: Record<string, unknown>,
  resolvedAssignments: Record<string, unknown>,
  resolveField: FieldResolverFn
): void {
  const routeSource: SourceRef = {
    file: route.sourceFile ?? '',
    line: route.sourceLine ?? undefined,
    context: 'route'
  };
  const routeId = `route:${route.method}:${route.path}`;
  const responseKind = route.response.kind;
  const isSemanticResponse = responseKind === 'resource'
    || responseKind === 'model'
    || responseKind === 'inline'
    || responseKind === 'void';

  if (route.response && !isSemanticResponse && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
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
}
