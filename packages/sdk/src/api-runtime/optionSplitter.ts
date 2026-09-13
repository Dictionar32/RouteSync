/**
 * optionSplitter.ts
 *
 * Flattens and splits mixed parameters/query/body options for API endpoints.
 *
 * @module sdk/api-runtime/optionSplitter
 */

import { PathResolver, type RouteDefinition, type HttpMethod } from '@routesync/core';

export function splitFlatOptions(
  route: RouteDefinition<unknown, unknown, unknown, HttpMethod>,
  variables: unknown
): unknown {
  if (!variables || typeof variables !== 'object') {
    return variables;
  }

  const varObj = variables as Record<string, unknown>;

  // If variables is already formatted with params/body/query options, return it as is
  if ('params' in varObj || 'body' in varObj || 'query' in varObj) {
    return variables;
  }

  const paramKeys = PathResolver.extractParams(route.path);
  const method = route.method ?? 'POST';

  if (paramKeys.length === 0) {
    if (method === 'GET') {
      return { query: variables };
    }
    return { body: variables };
  }

  const params: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};

  for (const key of Object.keys(varObj)) {
    if (paramKeys.includes(key)) {
      params[key] = varObj[key];
    } else {
      rest[key] = varObj[key];
    }
  }

  if (method === 'GET') {
    return { params, query: rest };
  }
  return { params, body: rest };
}
