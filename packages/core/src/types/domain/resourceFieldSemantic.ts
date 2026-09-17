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
  bound: BoundSemanticNode | undefined,
): ResourceFieldSemantic => {
  if (bound === undefined || bound.kind === 'bound_unsupported') {
    const rejected: BoundUnsupportedNode = bound ?? {
      kind: 'bound_unsupported',
      reason: 'invalid_boundary_input',
    };
    return Object.freeze({ kind: 'rejected', bound: rejected });
  }
  return Object.freeze({ kind: 'verified', type, bound });
};

export const requireResourceFieldType = (semantic: ResourceFieldSemantic): SemanticType => {
  if (semantic.kind === 'verified') return semantic.type;
  throw new Error(`Resource field semantic rejected: ${semantic.bound.reason}`);
};
