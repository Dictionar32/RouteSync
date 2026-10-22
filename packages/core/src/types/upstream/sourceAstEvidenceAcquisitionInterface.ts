import type { SourceProjectIdentity } from './highLevelSourceModel';

export type SourceAstEvidenceKind = 'model' | 'resource' | 'controller' | 'service';

export interface SourceAstFileEvidence {
  readonly kind: 'source_ast_file_evidence';
  readonly sourceKind: SourceAstEvidenceKind;
  readonly path: string;
  readonly text: string;
  readonly closed: true;
}

export interface SourceAstEvidenceAcquisitionContract {
  readonly kind: 'source_ast_evidence_acquisition';
  readonly closed: true;
  readonly files: readonly SourceAstFileEvidence[];
}

export interface SourceAstEvidenceAcquisitionInterface {
  readonly kind: 'source_ast_evidence_acquisition_interface';
  readonly closed: true;
  acquire(sourceProject: SourceProjectIdentity): Promise<SourceAstEvidenceAcquisitionContract>;
}
