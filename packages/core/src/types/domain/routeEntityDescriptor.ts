/** Canonical immutable descriptor for a scanned route entity. */

import type { RouteDefContract, RawRouteDefInput } from './routeEntityDefinition';
import {
  createHttpVerb,
  createRouteName,
  createRoutePath,
  type RouteMiddlewareName,
  type RouteAssignmentEntry,
  type RouteSchemaEntry,
  type StableRouteHash,
} from './routeEntityDefinition';
import { SemanticValueFactory } from './semanticValues';

export class RouteDefDescriptor implements RouteDefContract {
  public readonly identity: RouteDefContract['identity'];
  public readonly security: RouteDefContract['security'];
  public readonly payload: RouteDefContract['payload'];
  public readonly provenance: RouteDefContract['provenance'];

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
    const middleware: readonly RouteMiddlewareName[] = Object.freeze(
      def.middleware.map(value => Object.freeze({
        kind: 'route_middleware_name' as const,
        value: SemanticValueFactory.propertyName(value),
      })),
    );

    const stableHash: StableRouteHash = Object.freeze({
      kind: 'stable_route_hash',
      value: def.stableHash,
    });

    const schemaEntries: readonly RouteSchemaEntry[] = Object.freeze([...def.schema]);
    const assignments: readonly RouteAssignmentEntry[] = Object.freeze([...def.assignments]);

    return new RouteDefDescriptor({
      identity: Object.freeze({
        name: createRouteName(def.name),
        method: createHttpVerb(def.method),
        path: createRoutePath(def.path),
      }),
      security: Object.freeze({
        auth: def.auth,
        middleware,
      }),
      payload: Object.freeze({
        schemaEntries,
        response: def.response,
        assignments,
      }),
      provenance: Object.freeze({
        stableHash,
        sourceFile: def.sourceFile,
        sourceLine: def.sourceLine,
      }),
    });
  }
}
