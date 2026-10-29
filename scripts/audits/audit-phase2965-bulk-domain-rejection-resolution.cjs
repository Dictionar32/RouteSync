const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const closeStart = authority.indexOf('close: (input: LaravelControllerInvocationSemanticJudgmentInventoryInput)');
const closeBody = authority.slice(closeStart);
const checks = [
  ['result contract exposes one bulk domain resolution operation', /interface LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution[\s\S]*?withRejections:/.test(contract)],
  ['validated and rejected result variants share the domain resolution operation', /interface LaravelControllerInvocationSemanticJudgmentInventoryValidated extends LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution/.test(contract) && /interface LaravelControllerInvocationSemanticJudgmentInventoryRejected extends LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution/.test(contract)],
  ['legacy includeRejection operation is removed from the runtime and contract', !/includeRejection/.test(authority + contract)],
  ['legacy rejection accumulator helper is removed', !/includeInventoryRejections/.test(authority)],
  ['close resolves the complete rejection judgment once', /return validatedResult\.withRejections\(Object\.freeze\(\[/.test(closeBody)],
  ['rejection groups remain in the documented domain order', /\.\.\.projectBinding\.rejections,[\s\S]*\.\.\.completeness\.rejections,[\s\S]*\.\.\.sourceIdentity\.rejections,[\s\S]*\.\.\.correspondence\.rejections,/.test(closeBody)],
  ['close no longer uses reduce or a mutable rejection accumulator', !/\.reduce\s*\(/.test(closeBody) && !/let\s+result\s*=/.test(closeBody)],
  ['authority runtime export remains interface-first', /export const laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(authority)],
  ['generic collections file remains empty', collections.length === 0],
  ['Phase2965 audit command is registered', packageJson.scripts['audit:phase2965-bulk-domain-rejection-resolution'] === 'node scripts/audits/audit-phase2965-bulk-domain-rejection-resolution.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
