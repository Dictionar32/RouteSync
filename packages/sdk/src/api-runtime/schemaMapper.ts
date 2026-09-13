/**
 * schemaMapper.ts
 *
 * Schema validation and data mapping pipeline for SDK defineApi.
 *
 * @module sdk/api-runtime/schemaMapper
 */

import type { RouteDefinition } from '@routesync/core';
import { SchemaLike, parseWithSchema } from '../mappers/schema';
import type { RouteSchemaPart } from './types';

const routeSchemaKeys = ['params', 'query', 'body', 'request', 'response'];

function defaultSchemaPart(method: RouteDefinition['method']): RouteSchemaPart {
  return method === 'GET' || method === 'DELETE' ? 'response' : 'body';
}

function hasRouteSchemaKeys(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      routeSchemaKeys.some((key) => key in value)
  );
}

export function pickRouteSchema(route: RouteDefinition, part: RouteSchemaPart): unknown {
  const schema = route.schema;
  if (!schema) return undefined;

  if (hasRouteSchemaKeys(schema)) {
    return schema[part] ?? (part === 'body' ? schema.request : undefined);
  }

  return defaultSchemaPart(route.method) === part ? schema : undefined;
}

export function parseRouteSchema(
  route: RouteDefinition,
  part: RouteSchemaPart,
  value: unknown
): unknown {
  if (value === undefined) return undefined;
  const schema = pickRouteSchema(route, part);
  return parseWithSchema(schema as SchemaLike<unknown> | undefined, value);
}

export function applyMapper(
  route: RouteDefinition,
  part: RouteSchemaPart,
  value: unknown
): unknown {
  if (value === undefined || !route.mapper) return value;

  if (typeof route.mapper === 'function') {
    return part === 'response' ? route.mapper(value) : value;
  }

  const mapper =
    route.mapper[part] ?? (part === 'body' ? route.mapper.request : undefined);

  return mapper ? mapper(value) : value;
}
