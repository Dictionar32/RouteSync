/**
 * scannedModelTypes.ts
 *
 * Level 7 Complete Contract for ScannedModel and Accessors.
 *
 * @module cli/utils/incremental/types
 */

import type { SourceRef } from '@routesync/core';

export interface ModelAccessorInfoContract {
  readonly type: string;
  readonly expression: string;
  readonly expressionCode: string;
  readonly source: SourceRef;
  readonly ast: unknown;
  readonly semantic: unknown;
}

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

export interface ScannedModelContract {
  readonly name: string;
  readonly accessorEntries: readonly (readonly [string, ModelAccessorInfoContract])[];
}

export type ScannedModelLegacy = {
  name: string;
  accessors?: Record<string, ModelAccessorInfo>;
};
