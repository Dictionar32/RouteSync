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
  readonly model: string;
  readonly collection: boolean;
  readonly paginated: boolean;
  readonly confidence: number;
}

export interface ObjectMethodRuleContract {
  readonly kind: 'object';
  readonly fields: readonly (readonly [string, string])[];
  readonly confidence: number;
}

export interface ScalarMethodRuleContract {
  readonly kind: 'scalar';
  readonly returns: SemanticType;
  readonly confidence: number;
}

/**
 * Level 7 Complete Closed ADT for FrameworkMethodRule (0 undefined, 0 null, 0 ?:).
 */
export type FrameworkMethodRuleContract =
  | ModelMethodRuleContract
  | ObjectMethodRuleContract
  | ScalarMethodRuleContract;
