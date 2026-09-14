/**
 * normalizerTypes.ts
 *
 * Core domain types and interfaces for the compiler normalizer IR.
 *
 * @module cli/generators/normalizer
 */

export interface SourceLocation {
  readonly file: string
  readonly line: number
  readonly column?: number
}

export type NormalizedField = PrimitiveField | ObjectField | ModelField | ResourceField;

export interface PrimitiveField {
  readonly kind: "primitive"
  readonly type: "string" | "number" | "boolean" | "null"
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface ObjectField {
  readonly kind: "object"
  readonly fields: Readonly<Record<string, NormalizedField>>
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface ModelField {
  readonly kind: "model"
  readonly modelName: string
  readonly collection: boolean
  readonly paginated?: boolean
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export interface ResourceField {
  readonly kind: "resource"
  readonly resourceName: string
  readonly collection: boolean
  readonly paginated?: boolean
  readonly nullable: boolean
  readonly loc?: SourceLocation
}

export * from './normalizedEntities';
export * from './normalizedManifest';

export {
  type SemanticNodeContract,
  type SemanticNode,
  type RuntimeAugmented,
  type ResolutionContext
} from './semanticNormalizerTypes';
