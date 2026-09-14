/**
 * scannedRouteTypes.ts
 *
 * Level 7 Complete Contract for ScannedRoute.
 * Eliminates sentinel nulls, porous undefined, and naked records.
 *
 * @module cli/utils/incremental/types
 */

import type { SourceRef } from '@routesync/core';
import type {
  ScannedRouteMethod,
  ScannedRoutePath,
  ScannedRouteName,
  ScannedStableHash
} from './nominalAtoms';
import type { RouteResponsePayloadContract } from './responsePayloadTypes';

export interface ScannedRouteContract {
  readonly method: ScannedRouteMethod;
  readonly path: ScannedRoutePath;
  readonly auth: boolean;
  readonly schemaEntries: readonly (readonly [string, unknown])[];
  readonly responsePayload: RouteResponsePayloadContract;
  readonly assignmentEntries: readonly (readonly [string, string])[];
  readonly stableHash: ScannedStableHash;
  readonly name: ScannedRouteName;
  readonly source: SourceRef;
}

export interface ScannedRouteOptions {
  readonly method: string;
  readonly path: string;
  readonly auth?: boolean;
  readonly schema?: Record<string, unknown> | readonly (readonly [string, unknown])[] | null;
  readonly response?: unknown;
  readonly assignments?: Record<string, string> | readonly (readonly [string, string])[] | null;
  readonly stableHash?: string;
  readonly name?: string;
  readonly sourceFile?: string | null;
  readonly sourceLine?: number | null;
  readonly source?: SourceRef;
}

export type ScannedRouteLegacy = {
  method: string;
  path: string;
  auth: boolean;
  schema?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  assignments?: Record<string, string> | null;
  stableHash?: string;
  name?: string;
  sourceFile?: string | null;
  sourceLine?: number | null;
};
