const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['source judgment cardinality uses a named domain traversal', /const judgeSourceJudgmentCardinality = \(/.test(authority) && !/judgments\.reduce<LaravelControllerInvocationJudgmentMatchCardinality>/.test(authority)],
  ['orphan judgments use a named identity-cardinality traversal', /const judgeOrphanJudgments = \(/.test(authority) && !/judgments\.reduce<readonly LaravelControllerInvocationSemanticJudgmentInterface\[\]>/.test(authority)],
  ['orphan rejections are added through the correspondence ADT', /const includeOrphanJudgmentRejections = \(/.test(authority) && /inventory\.include\(Object\.freeze\(\{[\s\S]*kind: rule\.orphanJudgmentRejectionKind/.test(authority)],
  ['rejection accumulation invokes the ADT operation directly', /includeCorrespondenceRejections\(inventory\.include\(rejection\), rejections, position \+ 1\)/.test(authority)],
  ['correspondence path no longer uses flatMap', !/\.flatMap\(/.test(authority)],
  ['missing-source rejections remain first in established ordering', /correspondenceRejectionInventory\.empty\(\),\s*missingInvocationJudgmentRejections\(missingSources\)/.test(authority)],
  ['multiply-judged source rejections remain before orphan rejections', /const rejections = includeOrphanJudgmentRejections\(\s*orphanJudgments,\s*includeCorrespondenceRejections\(\s*includeCorrespondenceRejections\(\s*correspondenceRejectionInventory\.empty\(\),\s*missingInvocationJudgmentRejections\(missingSources\),\s*\),\s*multipleInvocationJudgmentRejections\(multiplyJudgedSources\)/.test(authority)],
  ['closed correspondence still owns terminal decision', /rejections\.closeCorrespondence\(sourceInventory, judgments, missingSources, multiplyJudgedSources, orphanJudgments\)/.test(authority)],
  ['generic collections file remains empty', collections.length === 0],
  ['Phase2962 audit command is registered', packageJson.scripts['audit:phase2962-correspondence-explicit-traversal'] === 'node scripts/audits/audit-phase2962-correspondence-explicit-traversal.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
