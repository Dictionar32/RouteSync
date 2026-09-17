/** Semantic binding produced after FieldNode parsing. */
import type { SemanticResolution } from '../semanticResolution';
import type { FieldNode } from '../field';

export interface ResolvedFieldBinding {
  readonly kind: 'resolved';
  readonly syntax: FieldNode;
  readonly semantic: SemanticResolution;
}

export interface UnresolvedFieldBinding {
  readonly kind: 'unresolved';
  readonly syntax: FieldNode;
  readonly semantic: SemanticResolution;
}

export type FieldBinding = ResolvedFieldBinding | UnresolvedFieldBinding;

export function createFieldBinding(
  syntax: FieldNode,
  semantic: SemanticResolution
): FieldBinding {
  return semantic.status === 'resolved'
    ? Object.freeze({ kind: 'resolved', syntax, semantic })
    : Object.freeze({ kind: 'unresolved', syntax, semantic });
}
