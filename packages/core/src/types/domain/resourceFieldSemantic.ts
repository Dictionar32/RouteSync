import type { SemanticType } from '../../compiler/types/SemanticType';
import type { BoundSemanticNode, BoundUnsupportedNode } from './boundAst';

export type VerifiedBoundSemantic = Exclude<BoundSemanticNode, BoundUnsupportedNode>;

export type ResourceFieldSemantic =
  | {
      readonly kind: 'verified';
      readonly type: SemanticType;
      readonly bound: VerifiedBoundSemantic;
    }
  | {
      readonly kind: 'rejected';
      readonly bound: BoundUnsupportedNode;
    };

export const createResourceFieldSemantic = (
  type: SemanticType,
  bound: BoundSemanticNode,
): ResourceFieldSemantic => {
  if (bound.kind === 'bound_unsupported') {
    return Object.freeze({ kind: 'rejected', bound });
  }
  return Object.freeze({ kind: 'verified', type, bound });
};

export const requireResourceFieldType = (semantic: ResourceFieldSemantic): SemanticType => {
  if (semantic.kind === 'verified') return semantic.type;
  throw new Error(`Resource field semantic rejected: ${semantic.bound.reason}`);
};
