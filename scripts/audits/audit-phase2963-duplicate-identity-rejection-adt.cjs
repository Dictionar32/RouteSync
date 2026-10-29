const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['duplicate identity rejection begins from the domain inventory continuation', /onSource: \(firstDuplicate, remainingDuplicates\) =>/.test(authority)],
  ['first duplicate rejection preserves the configured domain rejection kind', /kind: rule\.rejectionKind,\s*sourceFile: firstDuplicate/.test(authority)],
  ['remaining duplicate rejections traverse the remaining source inventory', /duplicateSourceRejections\(remainingDuplicates\)/.test(authority)],
  ['duplicate rejection tuple is built from a proven first duplicate', /rejections: inventoryRejections\(firstRejection, remainingRejections\)/.test(authority)],
  ['unsafe first-element cast is removed from source identity judgment', !/rejections\[0\]\s+as\s+Extract/.test(authority)],
  ['slice-based duplicate rejection extraction is removed', !/const rest = rejections\.slice\(1\)/.test(authority)],
  ['empty duplicate inventory still yields unique identity judgment', /onEmpty: \(\) => Object\.freeze\(\{ kind: 'source_identity_unique', sources, rejections: Object\.freeze\(\[\]\) \}\)/.test(authority)],
  ['generic collections file remains empty', collections.length === 0],
  ['Phase2963 audit command is registered', packageJson.scripts['audit:phase2963-duplicate-identity-rejection-adt'] === 'node scripts/audits/audit-phase2963-duplicate-identity-rejection-adt.cjs'],
  ['runtime authority remains interface-first', /export const laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(authority)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
