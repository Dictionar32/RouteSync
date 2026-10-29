const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const delivery = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts');
const prepContract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationInterface.ts');
const prepAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['delivery batch entrypoint has an explicit interface-first object export', /export const phpSourceInvocationSemanticPipelineDeliveryBatchFromResults:\s*PhpSourceInvocationSemanticPipelineDeliveryBatchFactoryInterface\s*=\s*Object\.freeze\(/.test(delivery)],
  ['batch factory contract exposes named fromResults operation', /interface PhpSourceInvocationSemanticPipelineDeliveryBatchFactoryInterface[\s\S]*readonly fromResults:/.test(delivery)],
  ['batch factory delegates to canonical delivery operation', /fromResults:[\s\S]*phpSourceInvocationSemanticPipelineDelivery\.deliver\(entries\)/.test(delivery)],
  ['delivery contract preserves complete or blocked pipeline judgments', /each-entry-preserves-the-exact-complete-or-blocked-pipeline-judgment/.test(delivery)],
  ['preparation judgment provides continuation operation', /readonly continueWith:/.test(prepContract)],
  ['preparation delegates to existing pipeline and judgment authorities', /dependencies\.pipeline\.analyze\(document\)/.test(prepAuthority) && /dependencies\.judgmentAuthority\.judge/.test(prepAuthority)],
  ['CLI delegates judgment preparation upstream', /laravelControllerInvocationSemanticJudgmentPreparationFactory\.prepare/.test(composition)],
  ['CLI does not rebuild judgments with inline map', !/invocationPipelineDelivery\.entries\.map/.test(composition)],
  ['CLI does not rebuild source inventory with inline map', !/sources:\s*Object\.freeze\(documents\.map/.test(composition)],
  ['upstream barrel exports delivery contracts', /export \* from '\.\/phpSourceInvocationSemanticPipelineDeliveryInterface'/.test(barrel)],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
for (const [name, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`); if (!ok) failed++; }
process.stdout.write(`Phase2880 audit: ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
