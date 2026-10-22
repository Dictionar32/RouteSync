const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const tests = read('packages/core/src/types/upstream/__tests__/controller-static-call-model-catalog-identity.phase2059.test.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2059_STATIC_CALL_MODEL_CATALOG_IDENTITY_INTERFACE_FIRST.md');
const checks = [
  ['static-call input carries canonical typed model-class identities', () => { assert.match(contract, /interface ControllerStaticCallModelClassIdentity[\s\S]*?className: ClassName[\s\S]*?modelName: ModelName/); assert.match(contract, /readonly modelClasses: readonly ControllerStaticCallModelClassIdentity\[\]/); }],
  ['model-class resolution is owned by a versioned interface and closed judgment', () => { assert.match(contract, /ControllerStaticCallModelClassIdentityJudgment[\s\S]*?kind: 'resolved'[\s\S]*?kind: 'not_found'[\s\S]*?kind: 'ambiguous/); assert.match(contract, /interface ControllerStaticCallModelClassIdentityRuleInterface[\s\S]*?judge: \(input: ControllerStaticCallOriginInput, classReferenceJudgment: ControllerStaticCallClassReferenceResolutionJudgment\) => ControllerStaticCallModelClassIdentityJudgment/); }],
  ['static-class origin uses canonical catalog identity instead of deriving ModelName from class text', () => { assert.match(authority, /modelClassIdentityRule\.judge\(input, classReferenceJudgment\)/); assert.match(authority, /name: identityJudgment\.identity\.modelName/); assert.doesNotMatch(authority, /createModelName\(input\.className/); }],
  ['unknown and ambiguous model identities produce distinct closed outcomes', () => { assert.match(authority, /static_call_class_not_in_model_catalog/); assert.match(authority, /static_call_model_class_ambiguous/); assert.match(tests, /arbitrary static class name/); assert.match(tests, /short class identity is ambiguous/); assert.match(tests, /fully qualified references/); }],
  ['source pipeline builds model-class evidence from scanned model definitions', () => { assert.match(pipeline, /modelBundle\.classIdentities/); assert.match(pipeline, /modelClasses: controllerModelClasses/); }],
  ['typed model catalog is wired through scanner input and action contract', () => { assert.match(scannerInterface, /readonly modelClasses: readonly ControllerStaticCallModelClassIdentity\[\]/); assert.match(controllerScanner, /input\.modelClasses/); assert.match(resolver, /readonly modelClasses: readonly ControllerStaticCallModelClassIdentity\[\]/); assert.match(resolver, /context\.modelClasses/); }],
  ['scanner passes catalog as evidence and does not call origin authority directly', () => { assert.match(dataflow, /staticCallOriginInput\(candidate, modelClasses, classNameResolutionContextEvidence\)/); assert.match(dataflow, /modelClasses,/); assert.doesNotMatch(dataflow, /controllerStaticCallOriginAuthority/); }],
  ['regression tests cover resolved, absent, ambiguous, and DB table cases', () => { assert.match(tests, /canonical model catalog/); assert.match(tests, /not infer model identity/); assert.match(tests, /ambiguous/); assert.match(tests, /database table rule/); }],
  ['authority versions and documentation record the interface-first migration', () => { assert.match(contract, /contractVersion: 11/); assert.match(authority, /contractVersion: 11/); assert.match(docs, /No `relation\/foundation` subscanner was introduced/); assert.match(docs, /No duplicate invocation, response, AST, or model-origin authority was added/); }],
  ['audit is registered in package scripts', () => { assert.match(read('package.json'), /audit:phase2059-static-call-model-catalog-identity-interface-first/); }],
];
const results = checks.map(([name, check]) => {
  try { check(); console.log(`PASS ${name}`); return true; }
  catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; }
});
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;
