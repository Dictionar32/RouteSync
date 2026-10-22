const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__test__/laravelControllerInvocationSemanticJudgmentInventory.phase1953.test.ts');
const publicIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['inventory contract and result ADT advance together to v11', /readonly version: 11/.test(contract) && (contract.match(/readonly contractVersion: 11;/g) || []).length === 2 && /version: 11,/.test(contract)],
  ['reasoning is now a first-class interface on the existing inventory authority', /interface LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface/.test(contract) && /readonly reasoning: LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface/.test(contract) && /reasoning,/.test(authority)],
  ['project binding produces a closed accepted/rejected semantic judgment ADT', /kind: 'project_binding_accepted'/.test(contract) && /kind: 'project_binding_rejected'/.test(contract) && /judgeProjectBinding:/.test(authority)],
  ['completeness produces a closed accepted/rejected semantic judgment ADT', /kind: 'completeness_witness_accepted'/.test(contract) && /kind: 'completeness_witness_rejected'/.test(contract) && /judgeCompletenessWitness:/.test(authority)],
  ['source identity uniqueness publishes a typed judgment before closure composition', /kind: 'source_identity_unique'/.test(contract) && /kind: 'source_identity_duplicates_found'/.test(contract) && /judgeSourceIdentityUniqueness:/.test(authority)],
  ['source/judgment correspondence publishes a closed/rejected ADT', /kind: 'judgment_correspondence_closed'/.test(contract) && /kind: 'judgment_correspondence_rejected'/.test(contract) && /judgeJudgmentCorrespondence:/.test(authority)],
  ['close composes semantic judgment outputs rather than repeating their predicates', /reasoning\.judgeProjectBinding\(/.test(authority) && /reasoning\.judgeCompletenessWitness\(/.test(authority) && /reasoning\.judgeSourceIdentityUniqueness\(/.test(authority) && /reasoning\.judgeJudgmentCorrespondence\(/.test(authority) && !/const witnessComplete/.test(authority) && !/const missingJudgments/.test(authority)],
  ['each judgment exposes a typed rejection collection for downstream aggregation', /readonly rejections: readonly \[/.test(contract) && /\.\.\.projectBinding\.rejections/.test(authority) && /\.\.\.correspondence\.rejections/.test(authority)],
  ['the reasoning implementation consumes the canonical upstream identity semantics', /laravelSourceIdentitySemantics\.relateSourceProjects/.test(authority) && /laravelSourceIdentitySemantics\.relateSourceFiles/.test(authority)],
  ['validated receipt retains original judgment identity and integrated outcome preservation', /correspondences: Object\.freeze\(\[\.\.\.input\.judgments\]\)/.test(authority) && /outcomePreservation: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT\.rules\.outcomePreservation/.test(authority)],
  ['the existing non-empty rejected ADT remains the closure result for any findings', /readonly rejections: readonly \[/.test(contract) && /rejections\.reduce<LaravelControllerInvocationSemanticJudgmentInventoryResult>/.test(authority)],
  ['new reasoning and judgment contracts are exported through public core API', ['LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface', 'LaravelControllerInvocationInventoryProjectBindingJudgment', 'LaravelControllerInvocationInventoryCompletenessJudgment', 'LaravelControllerInvocationInventorySourceIdentityJudgment', 'LaravelControllerInvocationInventoryCorrespondenceJudgment'].every(name => publicIndex.includes(name))],
  ['regression test exercises the reasoning interface before closure', test.includes('publishes closed semantic judgments before inventory closure composes the result') && test.includes('reasoning.judgeProjectBinding') && test.includes('contractVersion).toBe(11)')],
  ['prior inventory audits track the current v11 contract', /readonly version: 11/.test(read('scripts/audits/audit-phase1953-invocation-inventory-reasoning-interface-first.cjs')) && /readonly version: 11/.test(read('scripts/audits/audit-phase1954-inventory-executable-reasoning-adt-interface-first.cjs'))],
  ['Phase 1955 audit is registered', packageJson.scripts['audit:phase1955-inventory-semantic-judgment-interface-first'] === 'node scripts/audits/audit-phase1955-inventory-semantic-judgment-interface-first.cjs'],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
const summary = { phase: 1955, audit: 'inventory-semantic-judgment-interface-first', passed, total: checks.length, checks: checks.map(([name, result]) => ({ name, passed: Boolean(result) })) };
fs.writeFileSync(path.join(root, 'PHASE1955_AUDIT.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
