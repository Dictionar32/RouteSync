const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const inventoryInterface = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const trace = read('packages/core/src/types/upstream/PHASE2919_UPSTREAM_CLI_MANIFEST_RUNTIME_TRACE.md');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['inventory rejection tuple is named for its domain', /type InventoryRejections\s*=\s*readonly \[/.test(authority)],
  ['generic nonEmpty<T> helper has been retired', !/const nonEmpty\s*=\s*<T>/.test(authority)],
  ['rejection tuple construction has explicit inventory rejection types', /const inventoryRejections = \([\s\S]*first: LaravelControllerInvocationSemanticJudgmentInventoryRejection[\s\S]*\): InventoryRejections/.test(authority)],
  ['project-binding rejection uses the domain tuple operation', /rejections: inventoryRejections\(Object\.freeze\(/.test(authority)],
  ['completeness rejection uses the domain tuple operation', /kind: 'completeness_witness_rejected'[\s\S]*rejections: inventoryRejections\(/.test(authority)],
  ['duplicate source rejection uses the domain tuple operation', /rejections: inventoryRejections\(first, rest\)/.test(authority)],
  ['correspondence rejection uses the domain tuple operation', /kind: 'judgment_correspondence_rejected'[\s\S]*rejections: inventoryRejections\(first, rest\)/.test(authority)],
  ['authority reuses the existing inventory authority interface', /LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(authority) && /LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface/.test(inventoryInterface)],
  ['CLI manifest production path is documented by an existing trace', /controllerInvocationManifestCompositionAuthority/.test(trace) && /inventory authority closes source\/judgment correspondence/.test(trace)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2959 audit command is registered', packageJson.scripts['audit:phase2959-domain-rejection-tuple'] === 'node scripts/audits/audit-phase2959-domain-rejection-tuple.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
