const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const contract = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-resource-static-call-applicability.phase2054.test.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2054_CONTROLLER_RESOURCE_STATIC_CALL_JUDGMENT_INTERFACE_FIRST.md');
const prior = read('scripts/audits/audit-phase2053-ast-inline-array-judgment-interface-first.cjs');
const results = [];
const check = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } };
check('candidate ADT carries typed static-call method evidence', () => {
  assert.match(contract, /readonly kind: 'static_call';[\s\S]*?readonly resourceName: ResourceName;[\s\S]*?readonly methodName: MethodName;[\s\S]*?readonly argument: ControllerResourceCollectionArgumentEvidence/);
});
check('existing authority contract owns static-call applicability', () => {
  assert.match(contract, /contractVersion: 5/);
  assert.match(contract, /interface ControllerResourceStaticCallRuleInterface/);
  assert.match(contract, /staticCallRules: readonly ControllerResourceStaticCallRuleInterface\[\]/);
  assert.match(authority, /const resourceCollectionStaticCallRule: ControllerResourceStaticCallRuleInterface/);
  assert.match(authority, /methodName: createMethodName\('collection'\)/);
  assert.doesNotMatch(authority, /switch \(candidate\.methodName\.value\.value\)/);
});
check('non-collection calls receive explicit closed not-applicable judgment', () => {
  assert.match(authority, /case undefined:\s*return \{ kind: 'not_applicable', closed: true \}/);
  assert.match(test, /non-collection static calls outside resource-binding semantics/);
});
check('scanner adapter does not decide collection method applicability', () => {
  const candidateBuilder = scanner.slice(scanner.indexOf('function resourceBindingCandidate'), scanner.indexOf('function staticCollectionModelOriginEvidence'));
  assert.match(candidateBuilder, /kind: 'static_call' as const/);
  assert.doesNotMatch(candidateBuilder, /relationEqual\(candidate\.method, 'collection'\)/);
  assert.match(candidateBuilder, /methodName: createMethodName\(candidate\.method\)/);
});
check('canonical response and model-origin evidence remain reused', () => {
  assert.match(contract, /response: ControllerResponse/);
  assert.match(authority, /judgeModelOrigin\(candidate\.argument\.modelOrigin\)/);
  assert.match(authority, /response: candidate\.response\.response/);
});
check('no relation/foundation subscanner or parallel authority introduced', () => {
  assert.match(report, /does not add a relation\/foundation subscanner/);
  assert.doesNotMatch(contract, /NewControllerResource.*AuthorityInterface/);
  assert.match(prior, /existing `AstClassificationRuleAlgebraInterface`/);
});
check('targeted behavior cases cover collection and non-collection calls', () => {
  assert.match(test, /candidate\('make'\)/);
  assert.match(test, /candidate\('collection'\)/);
  assert.match(test, /reason: 'collection_argument_absent'/);
  assert.match(test, /kind: 'unresolved',[\s\S]*?reason: 'response_absent'/);
});
check('audit command is registered', () => {
  assert.match(read('package.json'), /audit:phase2054-controller-resource-static-call-judgment-interface-first/);
});
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
