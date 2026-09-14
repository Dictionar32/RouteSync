/**
 * incrementalTypes.ts
 *
 * Types and interfaces for incremental manifest scanning and resolution.
 * Conforms to Level 6/7 Correct-by-Construction: Zero sentinel null, zero porous undefined.
 *
 * @module cli/utils/incremental/incrementalTypes
 */

import { IRNodeRegistry } from '@routesync/core';

export type ModelAccessorInfo = {
  readonly type?: string;
  readonly expression?: string;
  readonly expression_code?: string;
  readonly sourceFile?: string;
  readonly sourceLine?: number;
  readonly ast?: unknown;
  readonly semantic?: unknown;
  readonly source?: { readonly file: string; readonly line?: number };
};

export type ScannedRoute = {
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

export type ScannedModel = {
  name: string;
  accessors?: Record<string, ModelAccessorInfo>;
};

export type ScannedResource = {
  name: string;
  model?: string;
  assignments?: Record<string, string>;
  fields?: Record<string, unknown>;
  sourceFile?: string | null;
  sourceLine?: number | null;
};

export interface ScannedManifestContract {
  readonly routes: readonly ScannedRoute[];
  readonly models: readonly ScannedModel[];
  readonly resources: readonly ScannedResource[];
}

export type ScannedManifest = {
  routes?: ScannedRoute[];
  models?: ScannedModel[];
  resources?: ScannedResource[];
};

export type ResolutionTraceNode = Readonly<Record<string, unknown>>;

/**
 * Level 7 Complete Contract for KernelResolutionResult (0 undefined, 0 null, 0 ?:).
 */
export interface KernelResolutionResultContract {
  readonly status: string;
  readonly type: string;
  readonly confidence: number;
  readonly traceEntries: readonly (readonly [string, unknown])[];
}

export type KernelResolutionResult = {
  readonly status: string;
  readonly type?: string;
  readonly confidence?: number;
  readonly trace?: readonly Record<string, unknown>[];
};

export interface KernelResolver {
  resolve(ast: unknown, context: Record<string, unknown>): KernelResolutionResult;
  getModels?(): Record<string, unknown>[];
}

export interface ResolveManifestResult {
  manifest: ScannedManifest;
  /** Stage 2 (IR v3) output — every resolved field as a real, addressable SemanticIRNode. */
  irRegistry: IRNodeRegistry;
}
