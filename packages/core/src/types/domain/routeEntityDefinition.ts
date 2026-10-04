/**
 * Canonical route entity vocabulary.
 * Raw scanner values are converted once at this boundary; downstream receives
 * only semantic values and explicit collections.
 */

import type { PhpAstNode } from './phpAst';
import {
  SemanticValueFactory,
  type RouteName,
  type RoutePath,
  type PropertyName,
  type SourceFilePath,
  type SourceLineNumber,
} from './semanticValues';
import type { HttpMethod } from './httpVocabulary';
import { relationGate, relationFirstOption, relationOptionFold } from '../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationTextStartsWith } from '../../semantic/kernel/relationalSequence';

export type { RouteName, RoutePath, PropertyName, SourceFilePath, SourceLineNumber };

export type HttpVerb = HttpMethod;
export type HttpStatus = 200 | 201 | 204 | 301 | 302 | 400 | 401 | 403 | 404 | 422 | 500;

export interface RouteMiddlewareName {
  readonly kind: 'route_middleware_name';
  readonly value: PropertyName;
}

export interface RouteSchemaEntry {
  readonly kind: 'route_schema_entry';
  readonly name: PropertyName;
  readonly value: PhpAstNode;
}

export interface RouteAssignmentEntry {
  readonly kind: 'route_assignment_entry';
  readonly name: PropertyName;
  readonly value: PhpAstNode;
}

export interface StableRouteHash {
  readonly kind: 'stable_route_hash';
  readonly value: string;
}

const HTTP_VERB_CATALOG: readonly HttpVerb[] = Object.freeze([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
]);

export function createRoutePath(path: string): RoutePath {
  return relationGate(
    relationTextStartsWith(path, '/'),
    () => SemanticValueFactory.routePath(path),
    () => { throw Error(`Route path must start with '/': ${path}`); },
  );
}

export function createRouteName(name: string): RouteName {
  return SemanticValueFactory.routeName(name);
}

export function createHttpVerb(verb: string): HttpVerb {
  const normalized = verb.toUpperCase();
  return relationOptionFold(
    relationFirstOption(HTTP_VERB_CATALOG, candidate => relationEqual(candidate, normalized)),
    () => { throw Error(`Unsupported HTTP method: ${verb}`); },
    value => value,
  );
}

export interface RouteEntityIdentityContract {
  readonly name: RouteName;
  readonly method: HttpVerb;
  readonly path: RoutePath;
}

export interface RouteSecurityContract {
  readonly auth: boolean;
  readonly middleware: readonly RouteMiddlewareName[];
}

export interface RoutePayloadContract {
  readonly schemaEntries: readonly RouteSchemaEntry[];
  readonly response: PhpAstNode;
  readonly assignments: readonly RouteAssignmentEntry[];
}

export interface RouteEntityProvenanceContract {
  readonly stableHash: StableRouteHash;
  readonly sourceFile: SourceFilePath;
  readonly sourceLine: SourceLineNumber;
}

export interface RouteDefContract {
  readonly identity: RouteEntityIdentityContract;
  readonly security: RouteSecurityContract;
  readonly payload: RoutePayloadContract;
  readonly provenance: RouteEntityProvenanceContract;
}

/**
 * Unvalidated scanner boundary. It is intentionally explicit rather than a
 * generic Record so the route descriptor can preserve field meaning.
 */
export interface RawRouteDefInput {
  readonly name: string;
  readonly method: string;
  readonly path: string;
  readonly auth: boolean;
  readonly middleware: readonly string[];
  readonly schema: readonly RouteSchemaEntry[];
  readonly response: PhpAstNode;
  readonly assignments: readonly RouteAssignmentEntry[];
  readonly stableHash: string;
  readonly sourceFile: SourceFilePath;
  readonly sourceLine: SourceLineNumber;
}

export type RouteDef = RouteDefContract;
