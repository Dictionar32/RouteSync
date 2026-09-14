/**
 * normalizedEntities.ts
 *
 * Normalized entity types (Resource, Accessor, Model)
 * with Level 7 Complete Contracts. Zero sentinel undefined, zero null.
 *
 * @module cli/generators/normalizer
 */

import type { SourceLocation, NormalizedField } from './normalizerTypes';

export interface SourceLocationContract {
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

/**
 * Level 7 Complete Contract for NormalizedResource (0 undefined, 0 null, 0 ?:).
 */
export interface NormalizedResourceContract {
  readonly symbolId: string;
  readonly name: string;
  readonly fields: readonly (readonly [string, NormalizedField])[];
  readonly loc: SourceLocationContract;
}

export type NormalizedResource = {
  readonly symbolId: string;
  readonly name: string;
  readonly fields: Readonly<Record<string, NormalizedField>>;
  readonly loc?: SourceLocation;
};

/**
 * Level 7 Complete Contract for NormalizedAccessor (0 undefined, 0 null, 0 ?:).
 */
export interface NormalizedAccessorContract {
  readonly name: string;
  readonly returnType: NormalizedField;
  readonly loc: SourceLocationContract;
}

export type NormalizedAccessor = {
  readonly name: string;
  readonly returnType: NormalizedField;
  readonly loc?: SourceLocation;
};

/**
 * Level 7 Complete Contract for NormalizedModel (0 undefined, 0 null, 0 ?:).
 */
export interface NormalizedModelContract {
  readonly symbolId: string;
  readonly name: string;
  readonly tableName: string;
  readonly fields: readonly (readonly [string, NormalizedField])[];
  readonly accessors: readonly (readonly [string, NormalizedAccessor])[];
  readonly appends: readonly string[];
  readonly loc: SourceLocationContract;
}

export type NormalizedModel = {
  readonly symbolId: string;
  readonly name: string;
  readonly tableName: string;
  readonly fields: Readonly<Record<string, NormalizedField>>;
  readonly accessors?: Readonly<Record<string, NormalizedAccessor>>;
  readonly appends?: ReadonlyArray<string>;
  readonly loc?: SourceLocation;
};
