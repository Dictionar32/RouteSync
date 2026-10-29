const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/source-file-inventory-domain-visitor.phase2921.test.ts');
const barrel = read('packages/core/src/index.ts');
const uniqueness = authority.split('judgeSourceIdentityUniqueness:')[1]?.split('judgeJudgmentCorrespondence:')[0] ?? '';
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['source inventory declares domain handlers for empty and populated variants', /interface SourceFileInventoryHandlers<Result>[\s\S]*onEmpty:[\s\S]*onSource:/.test(names)],
  ['source inventory contract exposes continueWith as a domain operation', /interface SourceFileInventoryOperations[\s\S]*continueWith: <Result>\(handlers: SourceFileInventoryHandlers<Result>\) => Result/.test(names)],
  ['empty inventory delegates continuation to onEmpty', /continueWith: <Result>\(handlers: SourceFileInventoryHandlers<Result>\): Result => handlers\.onEmpty/.test(names)],
  ['populated inventory delegates continuation with source and remainder', /continueWith: <Result>\(handlers: SourceFileInventoryHandlers<Result>\): Result => handlers\.onSource\(sourceFile, remaining/.test(names)],
  ['duplicate identity judgment selects uniqueness via inventory ADT continuation', /return duplicates\.continueWith\(\{[\s\S]*onEmpty: \(\) => Object\.freeze\(\{ kind: 'source_identity_unique'/.test(authority) && /onSource: \(\) => \{[\s\S]*kind: 'source_identity_duplicates_found'/.test(authority)],
  ['source uniqueness no longer branches on rejection array length', !/switch \(rejections\.length\)/.test(uniqueness)],
  ['inventory continuation handler contract is explicitly exported from core barrel', /SourceFileInventoryHandlers/.test(barrel)],
  ['focused test covers empty and populated inventory continuations', /continues through empty and populated inventories/.test(test) && /empty\.continueWith/.test(test) && /populated\.continueWith/.test(test)],
  ['runtime inventory files do not add exported function declarations', !/export\s+function\s+[A-Za-z_$]/.test(names + authority)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2957 audit command is registered', packageJson.scripts['audit:phase2957-inventory-continuation-uniqueness'] === 'node scripts/audits/audit-phase2957-inventory-continuation-uniqueness.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
