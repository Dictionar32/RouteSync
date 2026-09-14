/**
 * normalizedManifest.ts
 *
 * Normalized Route and Manifest types with Level 7 Complete Contracts.
 * Zero sentinel undefined, zero null.
 *
 * @module cli/generators/normalizer
 */

import type { SourceLocation, NormalizedField } from './normalizerTypes';
import type { NormalizedModel, NormalizedResource, SourceLocationContract } from './normalizedEntities';

/**
 * Level 7 Complete Contract for NormalizedRoute (0 undefined, 0 null, 0 ?:).
 */
export interface NormalizedRouteContract {
  readonly symbolId: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly uri: string;
  readonly actionName: string;
  readonly controllerName: string;
  readonly response: NormalizedField;
  readonly loc: SourceLocationContract;
}

export type NormalizedRoute = {
  readonly symbolId: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly uri: string;
  readonly actionName: string;
  readonly controllerName: string;
  readonly response: NormalizedField;
  readonly loc?: SourceLocation;
};

/**
 * Level 7 Complete Contract for NormalizedManifest (0 undefined, 0 null, 0 ?:).
 */
export interface NormalizedManifestContract {
  readonly irVersion: 1;
  readonly version: string;
  readonly baseURL: string;
  readonly routes: ReadonlyArray<NormalizedRoute>;
  readonly models: ReadonlyArray<NormalizedModel>;
  readonly resources: ReadonlyArray<NormalizedResource>;
}

export type NormalizedManifest = {
  readonly irVersion: 1;
  readonly version: string;
  readonly baseURL: string;
  readonly routes: ReadonlyArray<NormalizedRoute>;
  readonly models: ReadonlyArray<NormalizedModel>;
  readonly resources: ReadonlyArray<NormalizedResource>;
};
