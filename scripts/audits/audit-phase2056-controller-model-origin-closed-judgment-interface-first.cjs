const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-model-origin-closed-judgment.phase2056.test.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2056_CONTROLLER_MODEL_ORIGIN_CLOSED_JUDGMENT_INTERFACE_FIRST.md');
const checks = [
  ['model-origin evidence carries typed static-call input rather than a precomputed judgment', () => { assert.match(contract, /static_call_origin_input[\s\S]*?ControllerStaticCallOriginInput/); assert.doesNotMatch(contract, /static_call_origin_judgment/); }],
  ['closed model-origin judgment distinguishes resolved, missing, and unresolved', () => assert.match(contract, /type ControllerResourceModelOriginJudgment[\s\S]*?kind: 'resolved'[\s\S]*?kind: 'missing'[\s\S]*?kind: 'unresolved'[\s\S]*?closed: true/)],
  ['existing resource authority interface exposes model-origin judgment', () => { assert.match(contract, /contractVersion: 5/); assert.match(contract, /judgeModelOrigin: \(evidence: ControllerResourceModelOriginEvidence\) => ControllerResourceModelOriginJudgment/); }],
  ['resource authority composes the existing static-call origin authority upstream', () => { assert.match(authority, /controllerStaticCallOriginAuthority\.judge\(evidence\.input\)/); assert.match(authority, /judgeModelOrigin,/); }],
  ['resource binding consumes one closed model-origin judgment rather than an optional domain value', () => { assert.match(authority, /const modelJudgment = judgeModelOrigin\(candidate\.modelOrigin\)/); assert.doesNotMatch(authority, /modelOriginFromEvidence/); assert.doesNotMatch(authority, /ControllerModelOrigin \| undefined/); }],
  ['scanner projects typed evidence and no longer invokes the static-call authority', () => { assert.match(scanner, /classReference: classReferenceEvidence\(value\.classReference\)/); assert.match(scanner, /kind: 'static_call_origin_input' as const, input: staticCallOriginInput\(candidate, modelClasses, classNameResolutionContextEvidence\)/); assert.doesNotMatch(scanner, /controllerStaticCallOriginAuthority/); }],
  ['tests cover missing, unresolved, and resolved static-call origin evidence', () => { assert.match(test, /distinguishes absent variable semantics/); assert.match(test, /composes static-call origin judgment upstream/); assert.match(test, /closes unresolved DB table evidence/); }],
  ['no relation/foundation subscanner or parallel authority is introduced', () => { assert.match(report, /No new authority was introduced/); assert.doesNotMatch(contract + authority + scanner, /semantic\/foundation/); }],
  ['audit is registered in package scripts', () => assert.match(read('package.json'), /audit:phase2056-controller-model-origin-closed-judgment-interface-first/)],
];
const results = checks.map(([name, check]) => {
  try { check(); console.log(`PASS ${name}`); return true; }
  catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; }
});
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;
