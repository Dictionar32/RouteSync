/**
 * scannedManifestTypes.ts
 *
 * Level 7 Complete Contract for ScannedManifest.
 *
 * @module cli/utils/incremental/types
 */

import type { IRNodeRegistry } from '@routesync/core';
import type { ScannedRouteContract, ScannedRouteLegacy } from './scannedRouteTypes';
import type { ScannedModelContract, ScannedModelLegacy } from './scannedModelTypes';
import type { ScannedResourceContract, ScannedResourceLegacy } from './scannedResourceTypes';

export interface ScannedManifestContract {
  readonly routes: readonly ScannedRouteContract[];
  readonly models: readonly ScannedModelContract[];
  readonly resources: readonly ScannedResourceContract[];
}

export interface ScannedManifestOptions {
  readonly routes?: readonly (ScannedRouteContract | ScannedRouteLegacy)[];
  readonly models?: readonly (ScannedModelContract | ScannedModelLegacy)[];
  readonly resources?: readonly (ScannedResourceContract | ScannedResourceLegacy)[];
}

export type ScannedManifestLegacy = {
  routes?: any[];
  models?: any[];
  resources?: any[];
};

export type ResolutionTraceNode = Readonly<Record<string, unknown>>;

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

export interface ResolveManifestResult<T = any> {
  manifest: T;
  irRegistry: IRNodeRegistry;
}
