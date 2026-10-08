/**
 * optionSplitter.ts
 *
 * Flattens and splits mixed parameters/query/body options for API endpoints.
 *
 * @module sdk/api-runtime/optionSplitter
 */

import type { RouteDefinition, HttpMethod } from '@routesync/core';

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

  const paramKeys = (route.routeParameters ?? (route.routeParameter ? [route.routeParameter] : []))
    .map((parameter) => parameter.name);
  const payloadLocation = route.payloadLocation;
  if (!payloadLocation) {
    throw new Error('RouteSync endpoint is missing the upstream payload-location projection');
  }

  if (paramKeys.length === 0) {
    if (payloadLocation === 'none') {
      return variables;
    }
    return payloadLocation === 'query' ? { query: variables } : { body: variables };
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

  if (payloadLocation === 'none') {
    return { params };
  }
  return payloadLocation === 'query'
    ? { params, query: rest }
    : { params, body: rest };
}
