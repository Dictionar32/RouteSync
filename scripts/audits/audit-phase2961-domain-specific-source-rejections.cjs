const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['generic sourceFileRejections helper retired', !/sourceFileRejections/.test(authority)],
  ['duplicate-source rejection mapping has a domain-specific operation', /const duplicateSourceRejections = \(\s*sources: SourceFileInventory/.test(authority)],
  ['missing-judgment rejection mapping has a domain-specific operation', /const missingInvocationJudgmentRejections = \(\s*sources: SourceFileInventory/.test(authority)],
  ['multiple-judgment rejection mapping has a domain-specific operation', /const multipleInvocationJudgmentRejections = \(\s*sources: SourceFileInventory/.test(authority)],
  ['domain rejection variants are constructed with explicit discriminants', /kind: 'controller_source_inventory_contains_duplicate_source' as const/.test(authority) && /kind: 'controller_source_has_no_invocation_judgment' as const/.test(authority) && /kind: 'controller_source_has_multiple_invocation_judgments' as const/.test(authority)],
  ['duplicate-source judgment consumes the first duplicate through domain continuation', /onSource: \(firstDuplicate, remainingDuplicates\) =>/.test(authority) && /duplicateSourceRejections\(remainingDuplicates\)/.test(authority)],
  ['missing and multiply-judged sources use domain-specific traversals', /missingInvocationJudgmentRejections\(missingSources\)/.test(authority) && /multipleInvocationJudgmentRejections\(multiplyJudgedSources\)/.test(authority)],
  ['correspondence remains represented by domain operations', /rejections\.closeCorrespondence\(sourceInventory, judgments, missingSources, multiplyJudgedSources, orphanJudgments\)/.test(authority)],
  ['generic collection utility file remains empty', collections.length === 0],
  ['Phase2961 audit command is registered', packageJson.scripts['audit:phase2961-domain-specific-source-rejections'] === 'node scripts/audits/audit-phase2961-domain-specific-source-rejections.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
