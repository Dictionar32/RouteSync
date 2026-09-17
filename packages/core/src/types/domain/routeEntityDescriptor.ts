/**
 * routeEntityDescriptor.ts
 *
 * First-Class Level 7 ADT Descriptor & Semantic Factories for RouteDefContract.
 * Enforces 0 undefined, 0 null, 0 ?: and Object.freeze immutability.
 *
 * @module core/types/domain/routeEntityDescriptor
 */

import type { FieldNode } from '../field';
import {
  type RouteDefContract,
  type RouteIdentityContract,
  type RouteSecurityContract,
  type RoutePayloadContract,
  type RouteProvenanceContract,
  type RawRouteDefInput,
  type HttpVerb,
  createRoutePath,
  createHttpVerb
} from './routeEntityDefinition';


export class RouteDefDescriptor implements RouteDefContract {
  public readonly identity: RouteIdentityContract;
  public readonly security: RouteSecurityContract;
  public readonly payload: RoutePayloadContract;
  public readonly provenance: RouteProvenanceContract;

  constructor(params: RouteDefContract) {
    this.identity = params.identity;
    this.security = params.security;
    this.payload = params.payload;
    this.provenance = params.provenance;
    Object.freeze(this);
  }

  static create(params: RouteDefContract): RouteDefDescriptor {
    return new RouteDefDescriptor(params);
  }

  static fromRouteDef(def: RawRouteDefInput): RouteDefDescriptor {
    const schemaEntries = def.schema
      ? Object.freeze(Object.entries(def.schema).map(([k, v]) => Object.freeze([k, v] as const)))
      : Object.freeze([]);
    const assignments = def.assignments
      ? Object.freeze(Object.entries(def.assignments).map(([k, v]) => Object.freeze([k, v] as const)))
      : Object.freeze([]);

    return new RouteDefDescriptor({
      identity: Object.freeze({
        name: def.name,
        method: createHttpVerb(def.method),
        path: createRoutePath(def.path)
      }),
      security: Object.freeze({
        auth: Boolean(def.auth),
        middleware: Object.freeze([...(def.middleware ?? [])])
      }),
      payload: Object.freeze({
        schemaEntries,
        response: def.response ?? EMPTY_FIELD_NODE,
        assignments
      }),
      provenance: Object.freeze({
        stableHash: def.stableHash ?? '',
        sourceFile: def.sourceFile ?? '',
        sourceLine: def.sourceLine ?? 1
      })
    });
  }
}
