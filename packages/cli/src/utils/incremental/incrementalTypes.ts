/**
 * incrementalTypes.ts
 *
 * Types and interfaces for incremental manifest scanning and resolution.
 *
 * @module cli/utils/incremental/incrementalTypes
 */

import { IRNodeRegistry } from '@routesync/core';

export interface ScannedRoute {
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
}

export interface ScannedModel {
  name: string;
  accessors?: Record<string, {
    type?: string;
    expression?: string | null;
    expression_code?: string | null;
    sourceFile?: string | null;
    sourceLine?: number | null;
    ast?: unknown;
    semantic?: unknown;
    source?: { file: string; line?: number };
  }>;
}

export interface ScannedResource {
  name: string;
  model?: string;
  assignments?: Record<string, string>;
  fields?: Record<string, unknown>;
  sourceFile?: string | null;
  sourceLine?: number | null;
}

export interface ScannedManifest {
  routes?: ScannedRoute[];
  models?: ScannedModel[];
  resources?: ScannedResource[];
}

export interface KernelResolver {
  resolve(ast: unknown, context: Record<string, unknown>): {
    status: string;
    type?: string;
    confidence?: number;
    trace?: Array<Record<string, unknown>>;
  };
  getModels?(): Record<string, unknown>[];
}

export interface ResolveManifestResult {
  manifest: ScannedManifest;
  /** Stage 2 (IR v3) output — every resolved field as a real, addressable SemanticIRNode. */
  irRegistry: IRNodeRegistry;
}
