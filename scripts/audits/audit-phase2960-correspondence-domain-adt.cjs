const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['correspondence rejection outcome is a domain ADT with empty and nonempty cases', /correspondence_rejection_inventory_empty/.test(authority) && /correspondence_rejection_inventory_nonempty/.test(authority)],
  ['rejection ADT exposes include and domain-specific closeCorrespondence operations', /readonly include: \(rejection: LaravelControllerInvocationSemanticJudgmentInventoryRejection\)/.test(authority) && /readonly closeCorrespondence:[\s\S]*?LaravelControllerInvocationInventoryCorrespondenceJudgment/.test(authority)],
  ['correspondence terminal outcome delegates to the domain ADT operation', /return rejections\.closeCorrespondence\(sourceInventory, judgments, missingSources, multiplyJudgedSources, orphanJudgments\)/.test(authority)],
  ['source correspondence walks the source inventory ADT directly', /const partitionSourceCorrespondence = \([\s\S]*?\): Readonly<[\s\S]*?=> sources\.continueWith\([\s\S]*?onSource: \(sourceFile, remaining\)/.test(authority)],
  ['correspondence no longer materializes sources with toSourceFiles', !/sourceInventory\.sources\.toSourceFiles\(\)/.test(authority)],
  ['orphan judgment calculation no longer uses flatMap', !/judgments\.flatMap\(/.test(authority)],
  ['correspondence rejection selection no longer switches on array length', !/switch\s*\(rejections\.length\)/.test(authority)],
  ['generic collection utility file remains empty', collections.length === 0],
  ['source inventory still exposes explicit identity cardinality', /identityCardinalityAs:\s*\(sourceFile: SourceFile\)\s*=> SourceFileIdentityInventoryCardinality/.test(names)],
  ['Phase2960 audit command is registered', packageJson.scripts['audit:phase2960-correspondence-domain-adt'] === 'node scripts/audits/audit-phase2960-correspondence-domain-adt.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
