const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const cli = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationInterface.ts'), 'utf8');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts'), 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const checks = [
  ['upstream preparation contract is domain-specific', contract.includes('LaravelControllerInvocationSemanticJudgmentPreparationFactoryInterface')],
  ['prepared judgment exposes continueWith', contract.includes('readonly continueWith:')],
  ['preparation consumes typed pipeline and delivery contracts', contract.includes('PhpSourceInvocationSemanticPipelineInterface') && contract.includes('PhpSourceInvocationSemanticPipelineDeliveryInterface')],
  ['preparation delegates judgments to semantic judgment authority', authority.includes('dependencies.judgmentAuthority.judge')],
  ['preparation creates project-bound source inventory', authority.includes('laravel_controller_source_inventory_completeness_witness')],
  ['CLI delegates pipeline/judgment preparation upstream', cli.includes('laravelControllerInvocationSemanticJudgmentPreparationFactory.prepare')],
  ['CLI no longer maps documents into pipeline results', !cli.includes('documents.map(document => dependencies.sourceInvocationPipeline.analyze(document))')],
  ['CLI no longer maps pipeline entries into judgments', !cli.includes('invocationPipelineDelivery.entries.map')],
  ['CLI no longer maps documents into inventory sources', !cli.includes('sources: Object.freeze(documents.map(document => document.sourceFile))')],
  ['upstream barrel explicitly exports preparation contract', barrel.includes("export * from './laravelControllerInvocationSemanticJudgmentPreparationInterface'")],
  ['upstream barrel explicitly exports preparation factory', barrel.includes("export { laravelControllerInvocationSemanticJudgmentPreparationFactory } from './laravelControllerInvocationSemanticJudgmentPreparationAuthority'")],
  ['collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
for (const [name, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`); if (!ok) failed++; }
process.stdout.write(`Phase2879 audit: ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
