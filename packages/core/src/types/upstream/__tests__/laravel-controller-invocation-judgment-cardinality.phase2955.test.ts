import { describe, expect, it } from 'vitest';
import { type SourceFile, sourceFileInventoryFactory, sourceFileIdentityFactory, stringValue } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticInputFactory } from '../laravelControllerInvocationSemanticJudgmentAuthority';
import { laravelControllerInvocationSemanticJudgmentInventoryAuthority } from '../laravelControllerInvocationSemanticJudgmentInventoryAuthority';
import type { LaravelControllerSourceInventoryInterface } from '../laravelControllerInvocationSemanticJudgmentInventoryInterface';
import { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT } from '../laravelControllerInvocationSemanticJudgmentInventoryInterface';

const sourceProject = createLaravelSourceProjectIdentity.create(sourceFileIdentityFactory.create(stringValue.create('/workspace/app')));
const sourceFile = sourceFileIdentityFactory.create(stringValue.create('/workspace/app/app/Http/Controllers/OrderController.php'));
const missingSourceFile = sourceFileIdentityFactory.create(stringValue.create('/workspace/app/app/Http/Controllers/InvoiceController.php'));
const inventory = (files: readonly SourceFile[]): LaravelControllerSourceInventoryInterface => ({
  kind: 'laravel_controller_source_inventory',
  contractVersion: 2,
  sourceProject,
  sources: files.reduce((sources, file) => sources.include(file), sourceFileInventoryFactory.empty()),
  completeness: {
    kind: 'laravel_controller_source_inventory_completeness_witness',
    sourceProject,
    obligations: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT.reasoning.rules.completenessWitness.requiredObligations,
  },
});

const judgmentFor = (file: SourceFile) => laravelControllerInvocationSemanticJudgmentAuthority.judge(
  laravelControllerInvocationSemanticInputFactory.withoutPipeline(file),
);

describe('Phase2955 invocation judgment match cardinality ADT', () => {
  it('partitions source files with no matching judgment through a domain outcome', () => {
    const result = laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.judgeJudgmentCorrespondence(
      inventory([sourceFile, missingSourceFile]),
      [judgmentFor(sourceFile)],
    );

    expect(result.kind).toBe('judgment_correspondence_rejected');
    if (result.kind === 'judgment_correspondence_rejected') {
      expect(result.missingSources.toSourceFiles().map(file => file.value.value)).toEqual([missingSourceFile.value.value]);
      expect(result.multiplyJudgedSources.toSourceFiles()).toEqual([]);
    }
  });

  it('partitions duplicate matching judgments as a distinct domain outcome', () => {
    const result = laravelControllerInvocationSemanticJudgmentInventoryAuthority.reasoning.judgeJudgmentCorrespondence(
      inventory([sourceFile]),
      [judgmentFor(sourceFile), judgmentFor(sourceFileIdentityFactory.create(stringValue.create(sourceFile.value.value)))],
    );

    expect(result.kind).toBe('judgment_correspondence_rejected');
    if (result.kind === 'judgment_correspondence_rejected') {
      expect(result.missingSources.toSourceFiles()).toEqual([]);
      expect(result.multiplyJudgedSources.toSourceFiles().map(file => file.value.value)).toEqual([sourceFile.value.value]);
    }
  });
});
