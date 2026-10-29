const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/source-file-inventory-domain-visitor.phase2921.test.ts');
const barrel = read('packages/core/src/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['source inventory exposes closed no/one/multiple identity cardinality variants', /source_file_identity_inventory_no_match/.test(names) && /source_file_identity_inventory_one_match/.test(names) && /source_file_identity_inventory_multiple_matches/.test(names)],
  ['cardinality ADT owns relation accumulation and continuation operations', /interface SourceFileIdentityInventoryCardinalityOperations[\s\S]*includeRelation:[\s\S]*continueWith:/.test(names)],
  ['inventory exposes identityCardinalityAs and duplicateIdentities domain operations', /identityCardinalityAs: \(sourceFile: SourceFile\) => SourceFileIdentityInventoryCardinality/.test(names) && /duplicateIdentities: \(\) => SourceFileInventory/.test(names)],
  ['empty inventory returns no-match cardinality and empty duplicate inventory', /identityCardinalityAs: \(_sourceFile: SourceFile\): SourceFileIdentityInventoryCardinality => sourceFileIdentityInventoryCardinalityFactory\.noMatch\(\)/.test(names) && /duplicateIdentities: \(\): SourceFileInventory => sourceFileInventoryFactory\.empty\(\)/.test(names)],
  ['identity cardinality delegates each comparison to canonical source identity semantics', /remaining\.identityCardinalityAs\(candidate\)\.includeRelation\(laravelSourceIdentitySemantics\.relateSourceFiles\(sourceFile, candidate\)\)/.test(names)],
  ['duplicate projection selects repeated source identities without numeric comparisons', /const duplicatesInRemaining = remaining\.duplicateIdentities\(\)/.test(names) && /onMultipleMatches: \(\) => duplicatesInRemaining\.include\(sourceFile\)/.test(names) && !/countSameIdentityAs/.test(names)],
  ['uniqueness authority consumes duplicateIdentities domain operation', /const duplicates = sources\.duplicateIdentities\(\)/.test(authority)],
  ['orphan judgments use explicit identity cardinality continuation, not count comparisons', /identityCardinalityAs\(judgment\.sourceFile\)\.continueWith\([\s\S]*onNoMatch: \(\) => \[judgment\]/.test(authority) && !/countSameIdentityAs|\.countMatching\(/.test(authority)],
  ['focused tests cover no-match, one-match, multiple-match and duplicate projection', /identityCardinalityAs\(missing\)/.test(test) && /identityCardinalityAs\(other\)/.test(test) && /identityCardinalityAs\(first\)/.test(test) && /duplicateIdentities\(\)/.test(test)],
  ['cardinality contracts are explicitly exported through core barrel', /SourceFileIdentityInventoryCardinalityHandlers/.test(barrel) && /SourceFileIdentityInventoryCardinalityOperations/.test(barrel) && /SourceFileIdentityInventoryCardinality,/.test(barrel)],
  ['generic numeric identity counter and exported function declarations are absent from focused runtime files', !/countSameIdentityAs/.test(names) && !/export\s+function\s+[A-Za-z_$]/.test(names + authority)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2956 audit command is registered', packageJson.scripts['audit:phase2956-source-inventory-identity-cardinality'] === 'node scripts/audits/audit-phase2956-source-inventory-identity-cardinality.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
