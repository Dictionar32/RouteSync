/**
 * routeEntityDefinition.ts
 *
 * RouteDef domain definition and Level 7 Subatomic Complete Contract.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/types/domain
 */

import type { FieldNode } from '../field';

export type RoutePath = string & { readonly __brand: unique symbol };
import type { HttpMethod } from './httpVocabulary';

export type HttpVerb = HttpMethod;
export type HttpStatus = 200 | 201 | 204 | 301 | 302 | 400 | 401 | 403 | 404 | 422 | 500;

export function createRoutePath(path: string): RoutePath {
  if (!path.startsWith('/')) {
    throw new Error(`Route path must start with '/': ${path}`);
  }
  return path as RoutePath;
}

export function createHttpVerb(verb: string): HttpVerb {
  const normalized = verb.toUpperCase();
  switch (normalized) {
    case 'GET':
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
    case 'OPTIONS':
    case 'HEAD':
      return normalized;
    default:
      throw new Error(`Unsupported HTTP method: ${verb}`);
  }
}

export interface RouteIdentityContract {
  readonly name: string;
  readonly method: HttpVerb;
  readonly path: RoutePath;
}

export interface RouteSecurityContract {
  readonly auth: boolean;
  readonly middleware: readonly string[];
}

export interface RoutePayloadContract {
  readonly schemaEntries: readonly (readonly [string, unknown])[];
  readonly response: FieldNode;
  readonly assignments: readonly (readonly [string, string])[];
}

export interface RouteProvenanceContract {
  readonly stableHash: string;
  readonly sourceFile: string;
  readonly sourceLine: number;
}

/**
 * Level 7 Complete Guaranteed Contract for RouteDef (0 undefined, 0 null, 0 ?:).
 */
export interface RouteDefContract {
  readonly identity: RouteIdentityContract;
  readonly security: RouteSecurityContract;
  readonly payload: RoutePayloadContract;
  readonly provenance: RouteProvenanceContract;
}

/**
 * RawRouteDefInput is the unvalidated boundary representation.
 * It is intentionally separate from the canonical RouteDef contract.
 */
export interface RawRouteDefInput {
  readonly name: string;
  readonly method: string;
  readonly path: string;
  readonly auth: boolean;
  readonly middleware: readonly string[];
  readonly schema: Record<string, unknown>;
  readonly response: FieldNode;
  readonly assignments: Record<string, string>;
  readonly stableHash: string;
  readonly sourceFile: string;
  readonly sourceLine: number;
}

/**
 * Canonical RouteDef. All semantic absence is represented by the nested ADT
 * contracts above, never by optional or nullable fields.
 */
export type RouteDef = RouteDefContract;
