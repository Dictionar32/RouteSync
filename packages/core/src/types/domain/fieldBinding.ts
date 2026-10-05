/** Semantic binding produced after PhpAstNode parsing. */
import type { SemanticResolution } from './semanticResolution';
import type { PhpAstNode } from './phpAst';
import { relationEqual, relationResolve } from '../../semantic/foundation/semanticRelations';

export interface ResolvedFieldBinding {
  readonly kind: 'resolved';
  readonly syntax: PhpAstNode;
  readonly semantic: SemanticResolution;
}

export interface UnresolvedFieldBinding {
  readonly kind: 'unresolved';
  readonly syntax: PhpAstNode;
  readonly semantic: SemanticResolution;
}

export type FieldBinding = ResolvedFieldBinding | UnresolvedFieldBinding;

export function createFieldBinding(
  syntax: PhpAstNode,
  semantic: SemanticResolution
): FieldBinding {
  return relationResolve(
    relationEqual(semantic.status, 'resolved'),
    () => Object.freeze({ kind: 'resolved', syntax, semantic }),
    () => Object.freeze({ kind: 'unresolved', syntax, semantic }),
  );
}
