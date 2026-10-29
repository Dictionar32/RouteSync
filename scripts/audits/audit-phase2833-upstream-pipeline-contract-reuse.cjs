'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contracts = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const barrel = read('packages/cli/src/parsers/php/index.ts');
const upstream = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const delivery = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['reuse existing upstream pipeline interface instead of a duplicate CLI interface', /export const phpSourceInvocationSemanticPipelineOperations:\s*PhpSourceInvocationSemanticPipelineInterface/.test(pipeline) && !/export interface PhpSourceInvocationSemanticPipelineOperationsInterface/.test(pipeline)],
  ['runtime object is explicitly typed, frozen, and provides the domain analyze operation', /export const phpSourceInvocationSemanticPipelineOperations:\s*PhpSourceInvocationSemanticPipelineInterface\s*=\s*Object\.freeze\(/.test(pipeline) && /readonly analyze:/.test(upstream) && /analyze: \(document: PhpSourceDocument\)/.test(pipeline)],
  ['runtime object reuses the existing upstream semantic pipeline contract', /PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT/.test(pipeline) && /contract: PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT/.test(pipeline)],
  ['existing upstream authority remains the semantic implementation', /createPhpSourceInvocationSemanticPipelineAuthority\(/.test(pipeline) && /phpSourceInvocationSemanticPipelineAuthority\.analyze\(document\)/.test(pipeline)],
  ['batch delivery remains owned by the existing delivery operation', /sourceInvocationPipelineDelivery\.deliver\(/.test(composition) && /PhpSourceInvocationSemanticPipelineDeliveryInterface/.test(contracts) && /readonly deliver:/.test(delivery)],
  ['composition consumes the existing pipeline interface through its dependency contract', /sourceInvocationPipeline:\s*phpSourceInvocationSemanticPipelineOperations/.test(composition) && /readonly sourceInvocationPipeline:\s*PhpSourceInvocationSemanticPipelineInterface/.test(contracts)],
  ['CLI barrel exports the operation object without exporting a duplicate local interface', /export \{ phpSourceInvocationSemanticPipelineOperations \}/.test(barrel) && !/PhpSourceInvocationSemanticPipelineOperationsInterface/.test(barrel)],
  ['unused local analyzeBatch wrapper removed; batch delivery is not duplicated', !/analyzeBatch/.test(pipeline)],
  ['audit script registered in package scripts', pkg.scripts?.['audit:phase2833-upstream-pipeline-contract-reuse'] === 'node scripts/audits/audit-phase2833-upstream-pipeline-contract-reuse.cjs'],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2833 upstream pipeline contract reuse audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (failed) process.exitCode = 1;
