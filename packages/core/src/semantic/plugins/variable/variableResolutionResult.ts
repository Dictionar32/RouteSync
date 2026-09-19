import type { SemanticResolution } from '../../../types/domain/semanticResolution';

/** High-level variable lookup outcome. Absence is data, never null. */
export type VariableResolutionResult =
  | { readonly kind: 'resolved'; readonly value: SemanticResolution }
  | { readonly kind: 'not_found'; readonly reason: 'no_context_model' | 'no_assignment' | 'no_model' };
