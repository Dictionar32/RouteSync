const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-static-call-single-class-judgment.phase2065.test.ts');
const phpNames = read('packages/core/src/types/upstream/phpClassNameResolutionInterface.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['missing lexical context is a distinct closed evidence variant', () => assert.match(contract, /kind: 'unavailable'; readonly reason: 'controller_method_lexical_context_missing'/)],
  ['class-name judgment closes context absence with an explicit reason', () => assert.match(phpNames, /'class_name_resolution_context_unavailable'/)],
  ['class-reference rule does not fabricate a namespace/import context', () => { assert.match(authority, /switch \(contextEvidence\.kind\)/); assert.match(authority, /case 'unavailable':/); assert.match(authority, /class_name_resolution_context_unavailable/); }],
  ['scanner dataflow forwards explicit unavailable evidence instead of a fake empty context', () => { assert.match(dataflow, /classNameResolutionContext: classNameResolutionContextEvidence/); assert.doesNotMatch(dataflow, /namespaceName: createPhpQualifiedClassName\(''\), classImports: Object\.freeze\(\[\]\), importInventory: 'incomplete'/); }],
  ['regression covers absent lexical context', () => assert.match(test, /blocks missing lexical context instead of fabricating an empty namespace context/)],
  ['origin authority and class-reference rule versions advance together', () => { assert.match(contract, /readonly contractVersion: 11/); assert.match(authority, /contractVersion: 11/); assert.match(contract, /readonly contractVersion: 3/); assert.match(authority, /contractVersion: 3/); }],
  ['same canonical class judgment still feeds model identity', () => { assert.match(authority, /const classReferenceJudgment = classReferenceResolutionRule\.judge\(input\)/); assert.match(authority, /matchingRule\.judge\(input, classReferenceJudgment\)/); assert.match(authority, /modelClassIdentityRule\.judge\(input, classReferenceJudgment\)/); }],
  ['invocation semantic judgment remains the existing upstream authority', () => assert.match(invocation, /export type InvocationSemanticJudgment/)],
  ['integrated response remains correlated with invocation judgment', () => assert.match(response, /integrated_invocation_response_judgment/)],
  ['runtime executor remains delegation-only', () => { assert.match(runtime, /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/); assert.doesNotMatch(runtime, /phpClassNameResolutionAuthority|classReferenceResolutionRule/); }],
  ['phase audit is registered', () => assert.equal(packageJson.scripts['audit:phase2066-explicit-class-name-context-evidence-interface-first'], 'node scripts/audits/audit-phase2066-explicit-class-name-context-evidence-interface-first.cjs')],
];
const results = checks.map(([name, run]) => { try { run(); console.log(`PASS ${name}`); return { name, passed: true }; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return { name, passed: false }; } });
const report = { phase: 2066, title: 'Explicit Class-Name Context Evidence Interface First', passed: results.filter(result => result.passed).length, total: results.length, checks: results, verificationScope: 'structural source audit only; full typecheck/build/Vitest not asserted' };
fs.writeFileSync(path.join(root, 'PHASE2066_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.passed !== report.total) process.exitCode = 1;
