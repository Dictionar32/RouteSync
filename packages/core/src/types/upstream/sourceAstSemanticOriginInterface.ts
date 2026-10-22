import type { ExpressionOrigin } from './ast';
import type { SourceAstEvidenceKind } from './sourceAstEvidenceAcquisitionInterface';

/** Evidence required to derive an expression's canonical semantic owner. */
export interface SourceAstSemanticOriginEvidence {
  readonly kind: 'source_ast_semantic_origin_evidence';
  readonly sourceKind: SourceAstEvidenceKind;
  readonly owner: string;
  readonly member: string;
  readonly field: string;
  readonly closed: true;
}

/** Closed semantic-origin judgment. Consumers must not reclassify its source family. */
export interface SourceAstSemanticOriginJudgment {
  readonly kind: 'source_ast_semantic_origin_judgment';
  readonly evidence: SourceAstSemanticOriginEvidence;
  readonly origin: ExpressionOrigin;
  readonly closed: true;
}

export interface SourceAstSemanticOriginInterface {
  readonly kind: 'source_ast_semantic_origin_interface';
  readonly closed: true;
  resolve(evidence: SourceAstSemanticOriginEvidence): SourceAstSemanticOriginJudgment;
}
