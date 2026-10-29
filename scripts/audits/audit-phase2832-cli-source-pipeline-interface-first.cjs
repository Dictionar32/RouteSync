'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/cli/src/parsers/php/index.ts');
const contracts = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['existing upstream pipeline authority factory remains the implementation source', /createPhpSourceInvocationSemanticPipelineAuthority\(/.test(pipeline)],
  ['implementation authority is private rather than a public runtime export', /const phpSourceInvocationSemanticPipelineAuthority\s*=/.test(pipeline) && !/^\s*export\s+const\s+phpSourceInvocationSemanticPipeline\s*=/m.test(pipeline)],
  ['runtime operation reuses existing upstream pipeline interface without a duplicate local contract', /export const phpSourceInvocationSemanticPipelineOperations:\s*PhpSourceInvocationSemanticPipelineInterface/.test(pipeline) && !/export interface PhpSourceInvocationSemanticPipelineOperationsInterface/.test(pipeline)],
  ['public pipeline operation object is interface-first and frozen', /export const phpSourceInvocationSemanticPipelineOperations:\s*PhpSourceInvocationSemanticPipelineInterface\s*=\s*Object\.freeze\(/.test(pipeline)],
  ['single-document operation delegates to the private upstream authority', /analyze:[\s\S]*?phpSourceInvocationSemanticPipelineAuthority\.analyze\(document\)/.test(pipeline)],
  ['batch delivery uses the existing upstream delivery contract at composition', /sourceInvocationPipelineDelivery\.deliver\(/.test(composition) && /PhpSourceInvocationSemanticPipelineDeliveryInterface/.test(contracts) && !/analyzeBatch/.test(pipeline)],
  ['manifest composition injects the interface-first operation object', /import \{ phpSourceInvocationSemanticPipelineOperations \} from '\.\/sourceInvocationPipeline'/.test(composition) && /sourceInvocationPipeline:\s*phpSourceInvocationSemanticPipelineOperations/.test(composition)],
  ['composition contract continues to depend on the existing upstream pipeline interface', /readonly sourceInvocationPipeline:\s*PhpSourceInvocationSemanticPipelineInterface/.test(contracts)],
  ['CLI barrel exposes operations but no longer exposes raw authority instance', /export \{ phpSourceInvocationSemanticPipelineOperations \}/.test(barrel) && !/export \{[^}]*phpSourceInvocationSemanticPipeline,/.test(barrel)],
  ['delivery remains a separately typed upstream operation', /sourceInvocationPipelineDelivery:\s*phpSourceInvocationSemanticPipelineDelivery/.test(composition) && /PhpSourceInvocationSemanticPipelineDeliveryInterface/.test(contracts)],
  ['Phase 2832 audit package script is registered', packageJson.scripts?.['audit:phase2832-cli-source-pipeline-interface-first'] === 'node scripts/audits/audit-phase2832-cli-source-pipeline-interface-first.cjs'],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2832 CLI source-pipeline interface-first audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (failed) process.exitCode = 1;
