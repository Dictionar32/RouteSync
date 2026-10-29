const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-controller-invocation-judgment-cardinality.phase2955.test.ts');
const barrel = read('packages/core/src/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['cardinality is a closed domain ADT with no-match, one-match and multiple-match outcomes', /no_invocation_judgment_matches_source/.test(contract) && /one_invocation_judgment_matches_source/.test(contract) && /multiple_invocation_judgments_match_source/.test(contract)],
  ['cardinality ADT owns includeRelation and continueWith operations', /interface LaravelControllerInvocationJudgmentMatchCardinalityOperations\s*\{[\s\S]*includeRelation:[\s\S]*continueWith:/.test(contract)],
  ['identity relation accumulation is modeled as cardinality, not true/false callbacks', /current\.includeRelation\(judgment\.relateSourceFileIdentity\(sourceFile\)\)/.test(authority) && !/onSame:\s*\(\)\s*=>\s*true/.test(authority) && !/onDifferent:\s*\(\)\s*=>\s*false/.test(authority)],
  ['source correspondence partitions missing and multiply-judged sources through ADT operations', /onNoMatch:[\s\S]*missingSources\.include\(sourceFile\)/.test(authority) && /onMultipleMatches:[\s\S]*multiplyJudgedSources\.include\(sourceFile\)/.test(authority)],
  ['existing canonical judgment-owned identity relation is reused', /judgment\.relateSourceFileIdentity\(sourceFile\)/.test(authority)],
  ['focused test covers missing and multiple judgment outcomes', /partitions source files with no matching judgment/.test(test) && /partitions duplicate matching judgments/.test(test)],
  ['cardinality contracts are exported from the core barrel', /LaravelControllerInvocationJudgmentMatchCardinalityHandlers/.test(barrel) && /LaravelControllerInvocationJudgmentMatchCardinalityOperations/.test(barrel) && /LaravelControllerInvocationJudgmentMatchCardinality,/.test(barrel)],
  ['CLI manifest composition has no exported function declarations', !/export\s+function\s+[A-Za-z_$]/.test(cli)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2955 audit command is registered', packageJson.scripts['audit:phase2955-invocation-judgment-match-cardinality'] === 'node scripts/audits/audit-phase2955-invocation-judgment-match-cardinality.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
