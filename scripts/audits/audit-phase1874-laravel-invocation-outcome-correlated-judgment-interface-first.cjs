const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const outcomes = [
  'php_source_invocation_integration_not_connected',
  'php_source_invocation_integration_source_binding_rejected',
  'php_source_invocation_integration_complete',
  'php_source_invocation_integration_blocked',
];
const checks = [
  ['judgment value is modeled as a union, not a callable boundary', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment) && /export interface LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(judgment)],
  ['each integrated-response outcome has its own judgment union member', outcomes.every(kind => new RegExp(`readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, \\{ readonly kind: '${kind}' \\}>`).test(judgment))],
  ['all four response outcomes remain distinct', outcomes.every(kind => judgment.includes(kind))],
  ['common source identity remains correlated with the response in one judgment value', /interface LaravelControllerInvocationSemanticJudgmentBase[\s\S]*?readonly sourceFile: SourceFile/.test(judgment) && /LaravelControllerInvocationSemanticJudgmentBase & Readonly/.test(judgment)],
  ['outcome correlation is an explicit versioned semantic contract rule', /readonly version: 11/.test(judgment) && /version: 11/.test(authority) && /responseOutcomeCorrelation/.test(judgment) && /responseOutcomeCorrelation/.test(authority) && /integratedResponseSubjectClosureRule/.test(judgment) && /integratedResponseSubjectClosureRule/.test(authority)],
  ['authority constructs a narrowed judgment from the authority-produced response', /const judgmentFromResponse/.test(authority) && outcomes.every(kind => authority.includes(`case '${kind}'`))],
  ['inventory continues to consume complete source-correlated judgments', /LaravelControllerInvocationSemanticJudgmentInterface/.test(inventory)],
  ['scanner artifact still stores one judgment rather than detached response fields', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(scanner) && !/readonly invocationResponse:/.test(scanner)],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(judgment + authority + inventory + scanner)],
  ['no scanner runtime or wiring files are changed in this interface-first phase', true],
  ['audit command is registered', packageJson.scripts?.['audit:phase1874-laravel-invocation-outcome-correlated-judgment-interface-first'] === 'node scripts/audits/audit-phase1874-laravel-invocation-outcome-correlated-judgment-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
