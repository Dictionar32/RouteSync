const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['rejection accumulation delegates each item to the result ADT operation', /result = result\.includeRejection\(rejection\)/.test(authority)],
  ['rejection accumulation uses explicit iteration rather than reduce', /const includeInventoryRejections[\s\S]*?for \(const rejection of rejections\)/.test(authority) && !/rejections\.reduce<LaravelControllerInvocationSemanticJudgmentInventoryResult>/.test(authority)],
  ['close no longer materializes a combined rejection array with spread', !/const rejections: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection\[\] = Object\.freeze\(\[\s*\.\.\.projectBinding\.rejections/.test(authority)],
  ['project-binding rejections are included through the ADT operation', /includeInventoryRejections\(validatedResult, projectBinding\.rejections\)/.test(authority)],
  ['completeness rejections preserve their order in the ADT operation chain', /\),\s*completeness\.rejections,/.test(authority)],
  ['source-identity rejections are included through the ADT operation chain', /\),\s*sourceIdentity\.rejections,/.test(authority)],
  ['correspondence rejections are included last to preserve existing order', /\),\s*correspondence\.rejections,\s*\);/.test(authority)],
  ['authority runtime export remains interface-first', /export const laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(authority)],
  ['generic collections file remains empty', collections.length === 0],
  ['Phase2964 audit command is registered', packageJson.scripts['audit:phase2964-domain-rejection-accumulation'] === 'node scripts/audits/audit-phase2964-domain-rejection-accumulation.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
