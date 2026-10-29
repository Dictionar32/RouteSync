const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8');
const sourceModel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts'), 'utf8');
const checks = [
  ['SourceDiscovery matcher interface exists', /export interface SourceDiscoveryMatcherInterface/.test(collections)],
  ['SourceDiscovery matcher exported as typed const object', /export const sourceDiscoveryMatcher:\s*SourceDiscoveryMatcherInterface\s*=\s*Object\.freeze\(/.test(collections)],
  ['No exported function declaration for matchSourceDiscovery', !/export function matchSourceDiscovery\s*</.test(collections)],
  ['Runtime source-model path uses object operation', /sourceDiscoveryMatcher\.match\(discovery,\s*\{/.test(sourceModel)],
  ['not_scanned branch remains explicit', /if \(discovery\.kind === 'not_scanned'\)/.test(collections)],
  ['scanned branch remains explicit', /return visitor\.scanned\(discovery\)/.test(collections)],
  ['catalog conversion remains visible for follow-up migration', /sequenceAlgebra\.fromArray\(scanned\.items\)/.test(sourceModel)],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures++;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures ? 1 : 0;
