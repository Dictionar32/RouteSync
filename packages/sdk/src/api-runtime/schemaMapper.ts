/**
 * schemaMapper.ts
 *
 * Schema validation and data mapping pipeline for SDK defineApi.
 *
 * @module sdk/api-runtime/schemaMapper
 */

import type { RouteDefinition, RouteSchemaMap } from '@routesync/core';
import { isSchemaLike, parseWithSchema } from '../mappers/schema';
import type { RouteSchemaPart } from './types';

const routeSchemaKeys = ['params', 'query', 'body', 'request', 'response'];

function defaultSchemaPart(route: RouteDefinition): RouteSchemaPart {
  const schemaRole = route.schemaRole;
  if (!schemaRole) {
    throw new Error('RouteSync endpoint is missing the upstream schema-role capability required for an unkeyed schema');
  }
  return schemaRole === 'response' ? 'response' : 'body';
}

function hasRouteSchemaKeys(value: unknown): value is Partial<RouteSchemaMap> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      routeSchemaKeys.some((key) => key in value)
  );
}

export function pickRouteSchema(route: RouteDefinition, part: RouteSchemaPart): unknown {
  const schema = route.schema;
  if (!schema) return undefined;

  // Prefer the canonical parser contract before interpreting an object as a
  // route-part map; parser implementations may expose unrelated properties.
  if (isSchemaLike(schema)) {
    return defaultSchemaPart(route) === part ? schema : undefined;
  }

  if (hasRouteSchemaKeys(schema)) {
    return schema[part] ?? (part === 'body' ? schema.request : undefined);
  }

  return defaultSchemaPart(route) === part ? schema : undefined;
}

export function parseRouteSchema(
  route: RouteDefinition,
  part: RouteSchemaPart,
  value: unknown
): unknown {
  const schema = pickRouteSchema(route, part);
  if (schema === undefined) return value;
  if (!isSchemaLike(schema)) {
    throw new Error(`RouteSync ${part} schema does not satisfy the upstream parser contract`);
  }
  return parseWithSchema(schema, value);
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
