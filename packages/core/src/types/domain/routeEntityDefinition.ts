/**
 * routeEntityDefinition.ts
 *
 * RouteDef domain definition and Level 7 Subatomic Complete Contract.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/types/domain
 */

import type { FieldNode } from '../field';

export interface RouteIdentityContract {
  readonly name: string;
  readonly method: string;
  readonly path: string;
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

export type RouteDef = {
  name: string;
  method: string;
  path: string;
  auth: boolean;
  middleware: string[];
  schema?: Record<string, unknown> | null;
  response?: FieldNode | null;
  assignments?: Record<string, string> | null;
  stableHash?: string;
  sourceFile?: string | null;
  sourceLine?: number | null;
};
