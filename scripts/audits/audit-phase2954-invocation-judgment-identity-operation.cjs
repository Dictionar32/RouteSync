const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-controller-invocation-judgment-source-identity-operation.phase2954.test.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['invocation judgment contract owns source identity follow-up operation', /relateSourceFileIdentity: \(candidate: SourceFile\) => SourceFileIdentityRelationJudgment/.test(contract)],
  ['invocation judgment contract version reflects its operation addition', /readonly contractVersion: 3/.test(contract) && /readonly version: 16/.test(contract)],
  ['authority attaches canonical upstream identity semantics to each judgment', /relateSourceFileIdentity: \(candidate: typeof sourceFile\) => laravelSourceIdentitySemantics\.relateSourceFiles\(sourceFile, candidate\)/.test(authority)],
  ['inventory correspondence consumes judgment-owned identity operation', /judgment\.relateSourceFileIdentity\(sourceFile\)/.test(inventory)],
  ['inventory correspondence no longer calls identity semantics directly for judgment matching', !/relateSourceFiles\(judgment\.sourceFile, sourceFile\)/.test(inventory)],
  ['same and different source identity operations have focused test coverage', /same_source_file_identity/.test(test) && /different_source_file_identity/.test(test)],
  ['CLI manifest composition has no exported function declarations', !/export\s+function\s+[A-Za-z_$]/.test(cli)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2954 audit command is registered', packageJson.scripts['audit:phase2954-invocation-judgment-identity-operation'] === 'node scripts/audits/audit-phase2954-invocation-judgment-identity-operation.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
