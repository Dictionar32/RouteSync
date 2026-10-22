const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-static-call-single-class-judgment.phase2065.test.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['model identity interface consumes an existing class-resolution judgment', () => assert.match(contract, /judge: \(input: ControllerStaticCallOriginInput, classReferenceJudgment: ControllerStaticCallClassReferenceResolutionJudgment\)/)],
  ['origin rule contract forwards the same judgment', () => assert.match(contract, /interface ControllerStaticCallOriginRuleInterface[\s\S]*?judge: \(input: ControllerStaticCallOriginInput, classReferenceJudgment: ControllerStaticCallClassReferenceResolutionJudgment\)/)],
  ['model identity implementation does not invoke the resolver again', () => { const start = authority.indexOf('const modelClassIdentityRule'); const end = authority.indexOf('const databaseTableLiteralArgumentRule'); const body = authority.slice(start, end); assert.doesNotMatch(body, /classReferenceResolutionRule\.judge|phpClassNameResolutionAuthority\.judge/); assert.match(body, /judge: \(input, classReferenceJudgment\)/); }],
  ['static-call authority resolves once and forwards the exact judgment', () => { assert.match(authority, /const classReferenceJudgment = classReferenceResolutionRule\.judge\(input\)/); assert.match(authority, /matchingRule\.judge\(input, classReferenceJudgment\)/); assert.match(authority, /modelClassIdentityRule\.judge\(input, classReferenceJudgment\)/); }],
  ['the origin authority contract advances to version 11', () => { assert.match(contract, /readonly contractVersion: 11/); assert.match(authority, /contractVersion: 11/); }],
  ['regression proves a supplied judgment outranks source-context re-resolution', () => { assert.match(test, /App\\\\Models\\\\Ghost/); assert.match(test, /instead of resolving the source name again/); assert.match(test, /supplied blocked judgment/); }],
  ['invocation remains the existing canonical semantic judgment', () => { assert.match(invocation, /export type InvocationSemanticJudgment/); assert.doesNotMatch(invocation, /PhpClassNameResolutionRuleInterface/); }],
  ['integrated response remains the existing correlated response contract', () => { assert.match(response, /integrated_invocation_response_judgment/); assert.doesNotMatch(response, /php_class_name_resolution_rule/); }],
  ['runtime remains delegation-only', () => { assert.match(runtime, /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/); assert.doesNotMatch(runtime, /classReferenceResolutionRule|phpClassNameResolutionAuthority/); }],
  ['phase audit command is registered', () => assert.equal(packageJson.scripts['audit:phase2065-single-class-name-judgment-interface-first'], 'node scripts/audits/audit-phase2065-single-class-name-judgment-interface-first.cjs')],
];
const results = checks.map(([name, run]) => { try { run(); console.log(`PASS ${name}`); return { name, passed: true }; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return { name, passed: false }; } });
const report = { phase: 2065, title: 'Single Canonical Class-Name Judgment Interface First', passed: results.filter(result => result.passed).length, total: results.length, checks: results, verificationScope: 'structural source audit only; full typecheck/build/Vitest not asserted' };
fs.writeFileSync(path.join(root, 'PHASE2065_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.passed !== report.total) process.exitCode = 1;
