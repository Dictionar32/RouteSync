import { sourceFileAcquisition } from '../sourceFiles';
import path from 'node:path';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import { createSourceFile } from '../../../types/upstream/names';
import { laravelControllerInvocationSemanticJudgmentAuthority } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';
import { laravelControllerInvocationSemanticJudgmentInventoryAuthority } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority';
import type {
  LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
  LaravelControllerInvocationSemanticJudgmentInventoryResult,
  LaravelControllerSourceInventoryInterface,
} from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface';

/** Test-only receipt factory: missing invocation integration remains explicitly not-connected. */
export async function createNotConnectedControllerInventoryReceipt(
  sourceProject: SourceProjectIdentity,
): Promise<LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt> {
  const sourceFiles = await sourceFileAcquisition.collectPhpFiles(path.join(sourceProject.root.value.value, 'app', 'Http', 'Controllers'));
  const sources = Object.freeze(sourceFiles.map(createSourceFile));
  const sourceInventory: LaravelControllerSourceInventoryInterface = Object.freeze({
    kind: 'laravel_controller_source_inventory',
    contractVersion: 1,
    sourceProject,
    sources,
    completeness: Object.freeze({
      kind: 'laravel_controller_source_inventory_completeness_witness',
      sourceProject,
      obligations: Object.freeze([
        'source-project-identity-matches-the-inventory-project',
        'all-controller-source-files-discovered-for-the-source-project',
        'empty-controller-source-set-is-explicitly-certified-when-applicable',
        'each-source-file-identity-is-canonical-and-unique',
      ] as const),
    }),
  });
  const judgments = Object.freeze(sources.map(sourceFile =>
    laravelControllerInvocationSemanticJudgmentAuthority.judge({
      kind: 'controller_invocation_pipeline_not_provided',
      sourceFile,
    }),
  ));
  const result: LaravelControllerInvocationSemanticJudgmentInventoryResult =
    laravelControllerInvocationSemanticJudgmentInventoryAuthority.close({
      kind: 'laravel_controller_invocation_semantic_judgment_inventory_input',
      sourceInventory,
      judgments,
    });
  switch (result.kind) {
    case 'laravel_controller_invocation_semantic_judgment_inventory_validated':
      return result.receipt;
    case 'laravel_controller_invocation_semantic_judgment_inventory_rejected':
      throw new Error(`Test inventory rejected: ${result.rejections.map(rejection => rejection.kind).join(', ')}`);
  }
}
