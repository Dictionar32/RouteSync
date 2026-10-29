const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const routeSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const barrel = read('packages/core/src/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['source-file identity relation has named domain handlers', /interface SourceFileIdentityRelationHandlers<Result>[\s\S]*?onSame:[\s\S]*?onDifferent:/.test(identity)],
  ['source-file identity relation exposes a continuation operation', /interface SourceFileIdentityRelationOperations[\s\S]*?continueWith:/.test(identity)],
  ['same identity judgment carries the continuation operation', /kind: 'same_source_file_identity'[\s\S]*?SourceFileIdentityRelationOperations/.test(identity)],
  ['different identity judgment carries the continuation operation', /kind: 'different_source_file_identity'[\s\S]*?SourceFileIdentityRelationOperations/.test(identity)],
  ['same/different relation operation returns the matching domain arm', /handlers\.onSame\(relation\)/.test(identity) && /handlers\.onDifferent\(relation\)/.test(identity)],
  ['route source selection consumes identity via continuation', /relateSourceFiles\(file, missingFile\)\.continueWith\(\{ onSame: \(\) => true, onDifferent: \(\) => false \}\)/.test(routeSelection)],
  ['inventory uniqueness consumes the inventory-owned duplicate identity projection', /sources\.duplicateIdentities\(\)/.test(inventory)],
  ['inventory correspondence folds canonical judgments into the Phase2955 domain cardinality ADT', /current\.includeRelation\(judgment\.relateSourceFileIdentity\(sourceFile\)\)/.test(inventory) && /sourceInventory\.sources\.identityCardinalityAs\(judgment\.sourceFile\)\.continueWith/.test(inventory)],
  ['upstream barrel exports the source-file relation operation contracts', /SourceFileIdentityRelationHandlers/.test(barrel) && /SourceFileIdentityRelationOperations/.test(barrel)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2952 audit command is registered', packageJson.scripts['audit:phase2952-source-file-identity-continuations'] === 'node scripts/audits/audit-phase2952-source-file-identity-continuations.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
