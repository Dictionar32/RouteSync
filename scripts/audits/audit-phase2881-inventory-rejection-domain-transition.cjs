const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const barrel = read('packages/core/src/index.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const closeBody = authority.slice(authority.indexOf('export const laravelControllerInvocationSemanticJudgmentInventoryAuthority:'));
const checks = [
  ['inventory rejection accumulation is a domain-specific operation contract', /interface LaravelControllerInvocationSemanticJudgmentInventoryRejectionAccumulation[\s\S]*readonly includeRejection:/.test(contract)],
  ['validated inventory outcome can transition to a rejected judgment', /interface LaravelControllerInvocationSemanticJudgmentInventoryValidated extends LaravelControllerInvocationSemanticJudgmentInventoryRejectionAccumulation/.test(contract)],
  ['rejected inventory outcome can accumulate additional rejections', /interface LaravelControllerInvocationSemanticJudgmentInventoryRejected extends LaravelControllerInvocationSemanticJudgmentInventoryRejectionAccumulation/.test(contract)],
  ['validated result transitions using domain operation', /includeRejection:\s*\(rejection:[\s\S]*rejectedInventoryResult\(receipt\.sourceInventory, Object\.freeze\(\[rejection\]\)\)/.test(authority)],
  ['rejected result appends without losing existing rejection ledger', /includeRejection:\s*\(rejection:[\s\S]*Object\.freeze\(\[\.\.\.rejections, rejection\]\)/.test(authority)],
  ['inventory authority folds rejections through the ADT operation', /rejections\.reduce<LaravelControllerInvocationSemanticJudgmentInventoryResult>\(\s*\(result, rejection\) => result\.includeRejection\(rejection\)/.test(closeBody)],
  ['inventory rejection fold no longer switches on result discriminator', !/rejections\.reduce[\s\S]*?switch\s*\(result\.kind\)/.test(closeBody)],
  ['new operation type is exported from the core type barrel', /LaravelControllerInvocationSemanticJudgmentInventoryRejectionAccumulation/.test(barrel)],
  ['existing upstream barrel continues exporting inventory contract', /export \* from '\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface'/.test(upstreamBarrel)],
  ['upstream collections file remains empty', fs.statSync(collections).size === 0],
];
let failed = 0;
for (const [name, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`); if (!ok) failed++; }
process.stdout.write(`Phase2881 audit: ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
