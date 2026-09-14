/**
 * scannedResourceTypes.ts
 *
 * Level 7 Complete Contract for ScannedResource.
 *
 * @module cli/utils/incremental/types
 */

import type { SourceRef } from '@routesync/core';

export interface ScannedResourceContract {
  readonly name: string;
  readonly model: string;
  readonly assignmentEntries: readonly (readonly [string, string])[];
  readonly fieldEntries: readonly (readonly [string, unknown])[];
  readonly source: SourceRef;
}

export interface ScannedResourceOptions {
  readonly name: string;
  readonly model?: string;
  readonly assignments?: Record<string, string> | readonly (readonly [string, string])[] | null;
  readonly fields?: Record<string, unknown> | readonly (readonly [string, unknown])[] | null;
  readonly sourceFile?: string | null;
  readonly sourceLine?: number | null;
  readonly source?: SourceRef;
}

export type ScannedResourceLegacy = {
  name: string;
  model?: string;
  assignments?: Record<string, string>;
  fields?: Record<string, unknown>;
  sourceFile?: string | null;
  sourceLine?: number | null;
};
