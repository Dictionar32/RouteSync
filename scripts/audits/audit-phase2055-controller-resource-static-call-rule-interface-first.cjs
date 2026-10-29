const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-resource-static-call-applicability.phase2054.test.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2055_CONTROLLER_RESOURCE_STATIC_CALL_RULE_INTERFACE_FIRST.md');
const results = [];
const check = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } };
check('typed rule interface declares method identity and semantic judgment', () => {
  assert.match(contract, /interface ControllerResourceStaticCallRuleInterface[\s\S]*?methodName: MethodName[\s\S]*?judge:/);
});
check('existing resource authority registers its collection rule through the interface', () => {
  assert.match(authority, /resourceCollectionStaticCallRule: ControllerResourceStaticCallRuleInterface/);
  assert.match(authority, /staticCallRules: controllerResourceStaticCallRules/);
  assert.match(authority, /methodName: createMethodName\('collection'\)/);
});
check('method-name semantic switch is removed from authority', () => {
  assert.doesNotMatch(authority, /switch\s*\(candidate\.methodName\.value\.value\)/);
  assert.match(authority, /controllerResourceStaticCallRules\.find/);
  assert.match(authority, /matchingRule\.judge\(candidate\)/);
});
check('scanner still submits typed static-call evidence without classifying applicability', () => {
  const candidateBuilder = scanner.slice(scanner.indexOf('function resourceBindingCandidate'), scanner.indexOf('function staticCollectionModelOriginEvidence'));
  assert.match(candidateBuilder, /methodName: createMethodName\(candidate\.method\)/);
  assert.doesNotMatch(candidateBuilder, /relationEqual\(candidate\.method, 'collection'\)/);
});
check('closed judgment remains authoritative for unknown method names', () => {
  assert.match(authority, /case undefined:[\s\S]*?kind: 'not_applicable',[\s\S]*?closed: true/);
  assert.match(test, /keeps non-collection static calls outside resource-binding semantics/);
});
check('rule interface reuses existing response and model-origin judgments', () => {
  assert.match(authority, /judgeResourceCollection/);
  assert.match(authority, /judgeModelOrigin\(candidate\.argument\.modelOrigin\)/);
  assert.match(authority, /response: candidate\.response\.response/);
});
check('no parallel authority or relation/foundation subscanner is introduced', () => {
  assert.doesNotMatch(contract, /NewControllerResource.*AuthorityInterface/);
  assert.match(report, /does not add a relation\/foundation subscanner/);
  assert.match(report, /existing ControllerResourceBindingAuthorityInterface/);
});
check('authority rule contract has behavior-focused coverage', () => {
  assert.match(test, /declares applicability through the authority rule interface/);
  assert.match(test, /candidate\('collection'\)/);
  assert.match(test, /candidate\('make'\)/);
});
check('audit is registered in package scripts', () => {
  assert.match(read('package.json'), /audit:phase2055-controller-resource-static-call-rule-interface-first/);
});
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
