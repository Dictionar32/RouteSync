const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/source-file-inventory-domain-visitor.phase2921.test.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const contract = names.split('export interface SourceFileInventoryOperations {')[1]?.split('\n}')[0] ?? '';
const checks = [
  ['SourceFileInventoryOperations no longer exposes a generic predicate filter', !/\bfilter\s*:\s*\(predicate:\s*\(sourceFile:\s*SourceFile\)/.test(contract)],
  ['source inventory runtime implementations do not define generic filter callbacks', !/\bfilter:\s*\([^)]*predicate[^)]*\)\s*=>/.test(names)],
  ['identity cardinality remains a first-class source inventory operation', /identityCardinalityAs:\s*\(sourceFile:\s*SourceFile\)\s*=>\s*SourceFileIdentityInventoryCardinality/.test(contract)],
  ['duplicate identity selection remains domain-owned', /duplicateIdentities:\s*\(\)\s*=>\s*SourceFileInventory/.test(contract)],
  ['duplicate identity implementation delegates to identity cardinality', /duplicateIdentities:\s*\(\): SourceFileInventory => \{[\s\S]*identityCardinalityAs\(sourceFile\)\.continueWith/.test(names)],
  ['inventory authority consumes domain duplicate operation', /const duplicates = sources\.duplicateIdentities\(\)/.test(authority)],
  ['focused source inventory tests preserve duplicate identity behavior', /projects duplicate identity entries through a domain operation/.test(test) && /duplicateIdentities\(\)/.test(test)],
  ['source inventory contracts contain no exported function declarations', !/export\s+function\s+[A-Za-z_$]/.test(names)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2958 audit command is registered', packageJson.scripts['audit:phase2958-source-inventory-predicate-retirement'] === 'node scripts/audits/audit-phase2958-source-inventory-predicate-retirement.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
