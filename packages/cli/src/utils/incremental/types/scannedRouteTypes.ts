/**
 * scannedRouteTypes.ts
 *
 * Level 7 Complete Contract for RouteSemanticFlow.
 * Eliminates sentinel nulls, porous undefined, and naked records.
 *
 * @module cli/utils/incremental/types
 */

import type { SourceRef } from '@routesync/core';
import type {
  RouteSemanticFlowMethod,
  RouteSemanticFlowPath,
  RouteSemanticFlowName,
  ScannedStableHash
} from './nominalAtoms';
import type { RouteResponsePayloadContract } from './responsePayloadTypes';

export interface RouteSemanticFlowContract {
  readonly method: RouteSemanticFlowMethod;
  readonly path: RouteSemanticFlowPath;
  readonly auth: boolean;
  readonly schemaEntries: readonly (readonly [string, unknown])[];
  readonly responsePayload: RouteResponsePayloadContract;
  readonly assignmentEntries: readonly (readonly [string, string])[];
  readonly stableHash: ScannedStableHash;
  readonly name: RouteSemanticFlowName;
  readonly source: SourceRef;
}

export interface RouteSemanticFlowOptions {
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

export type RouteSemanticFlowLegacy = {
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
