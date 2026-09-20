/** Compatibility algebra over the canonical SemanticType ADT. */
import type {
  SemanticType,
  SemanticTypeVisitor,
} from '../../compiler/types/SemanticType';

export type ResolvedSemanticType = SemanticType;
export type ResolvedSemanticTypeVisitor<R> = SemanticTypeVisitor<R>;

export function matchResolvedSemanticType<R>(
  type: SemanticType,
  visitor: SemanticTypeVisitor<R>,
): R {
  return type.accept(visitor);
}

export const matchResolvedSemanticTypeIR = matchResolvedSemanticType;
