const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const inventoryTest = read('packages/core/src/types/upstream/__tests__/source-file-inventory-domain-visitor.phase2921.test.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['inventory contract exposes explicit identity cardinality and duplicate projection', /identityCardinalityAs: \(sourceFile: SourceFile\) => SourceFileIdentityInventoryCardinality/.test(names) && /duplicateIdentities: \(\) => SourceFileInventory/.test(names)],
  ['empty inventory returns explicit no-match cardinality and no duplicate identities', /identityCardinalityAs: \(_sourceFile: SourceFile\): SourceFileIdentityInventoryCardinality => sourceFileIdentityInventoryCardinalityFactory\.noMatch\(\)/.test(names) && /duplicateIdentities: \(\): SourceFileInventory => sourceFileInventoryFactory\.empty\(\)/.test(names)],
  ['entry inventory delegates comparison to canonical identity semantics', /remaining\.identityCardinalityAs\(candidate\)\.includeRelation\(laravelSourceIdentitySemantics\.relateSourceFiles\(sourceFile, candidate\)\)/.test(names)],
  ['generic predicate countMatching has been removed', !/countMatching/.test(names)],
  ['uniqueness authority consumes inventory duplicate projection', /sources\.duplicateIdentities\(\)/.test(inventoryAuthority)],
  ['orphan judgment authority consumes cardinality ADT continuation', /sourceInventory\.sources\.identityCardinalityAs\(judgment\.sourceFile\)\.continueWith/.test(inventoryAuthority)],
  ['inventory authority no longer performs predicate-based identity counting', !/\.countMatching\(/.test(inventoryAuthority)],
  ['identity cardinality tests cover absent, unique and duplicate identities', /identityCardinalityAs\(missing\)/.test(inventoryTest) && /identityCardinalityAs\(other\)/.test(inventoryTest) && /identityCardinalityAs\(first\)/.test(inventoryTest) && /duplicateIdentities\(\)/.test(inventoryTest)],
  ['manifest composition path has no exported function declarations', !/export\s+function\s+[A-Za-z_$]/.test(composition)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2953 audit command is registered', packageJson.scripts['audit:phase2953-inventory-identity-operation'] === 'node scripts/audits/audit-phase2953-inventory-identity-operation.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
