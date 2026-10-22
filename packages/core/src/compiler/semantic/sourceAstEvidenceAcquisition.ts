import path from 'node:path';
import { sourceFileAcquisition } from '../scanner/sourceFiles';
import { relationAsyncFold } from '../../semantic/relations/relationalSequence';
import type { SourceProjectIdentity } from '../../types/upstream/highLevelSourceModel';
import type {
  SourceAstEvidenceAcquisitionContract,
  SourceAstEvidenceAcquisitionInterface,
  SourceAstEvidenceKind,
  SourceAstFileEvidence,
} from '../../types/upstream/sourceAstEvidenceAcquisitionInterface';

const sourceRoots: readonly (readonly [string, SourceAstEvidenceKind])[] = [
  ['app/Models', 'model'],
  ['app/Http/Resources', 'resource'],
  ['app/Http/Controllers', 'controller'],
  ['app/Services', 'service'],
];

export const sourceAstEvidenceAcquisition: SourceAstEvidenceAcquisitionInterface = Object.freeze({
  kind: 'source_ast_evidence_acquisition_interface',
  closed: true,
  async acquire(sourceProject: SourceProjectIdentity): Promise<SourceAstEvidenceAcquisitionContract> {
    const root = sourceProject.root.value.value;
    const files = await relationAsyncFold(
      sourceRoots,
      [] as SourceAstFileEvidence[],
      async (collected, [relativeRoot, sourceKind]) => {
        const paths = await sourceFileAcquisition.collectPhpFiles(path.join(root, relativeRoot));
        return relationAsyncFold(paths, collected, async (current, file) => {
          const text = await sourceFileAcquisition.readSourceText(file);
          const evidence: SourceAstFileEvidence = Object.freeze({
            kind: 'source_ast_file_evidence',
            sourceKind,
            path: file,
            text,
            closed: true,
          });
          return [...current, evidence];
        }, 0);
      },
      0,
    );
    return Object.freeze({
      kind: 'source_ast_evidence_acquisition',
      closed: true,
      files: Object.freeze(files),
    });
  },
});
