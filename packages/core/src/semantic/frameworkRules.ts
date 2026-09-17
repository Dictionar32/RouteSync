/**
 * frameworkRules.ts
 *
 * Framework method rules and Level 7 Complete Closed ADT variants.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/semantic
 */

import type { SemanticType } from '../types/semantic';

export interface ModelMethodRuleContract {
  readonly kind: 'model';
  readonly model: import('../types/domain/semanticValues').ModelName;
  readonly cardinality: import('../types/domain/semanticResolution').ResolutionCardinality;
  readonly confidence: number;
}

export interface ObjectMethodRuleContract {
  readonly kind: 'object';
  readonly fields: readonly (readonly [import('../types/domain/semanticValues').ResponseFieldName, SemanticType])[];
  readonly confidence: number;
}

export interface ScalarMethodRuleContract {
  readonly kind: 'scalar';
  readonly returns: SemanticType;
  readonly confidence: number;
}

export type FrameworkMethodRuleContract =
  | ModelMethodRuleContract
  | ObjectMethodRuleContract
  | ScalarMethodRuleContract;
