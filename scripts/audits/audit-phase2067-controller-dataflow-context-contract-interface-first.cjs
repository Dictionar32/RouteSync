const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const descriptor = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['dataflow construction has one named input contract', () => assert.match(dataflow, /export interface ControllerDataflowContractInput[\s\S]*?readonly evidence: ControllerDataflowAst;[\s\S]*?readonly returned: ControllerReturnSet;[\s\S]*?readonly response: ControllerResponse;[\s\S]*?readonly modelClasses: readonly ControllerStaticCallModelClassIdentity\[\];[\s\S]*?readonly classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence;/)],
  ['dataflow constructor no longer accepts unused positional parameters or default semantic context', () => { assert.match(dataflow, /createControllerDataflowContract\(input: ControllerDataflowContractInput\)/); assert.doesNotMatch(dataflow, /_parameters: readonly ControllerParameterAst|_sourceFile = '<scanner>'|classNameResolutionContextEvidence\?/); }],
  ['nested evidence projection receives explicit context ADT', () => { assert.match(dataflow, /function modelOriginEvidence\([\s\S]*?classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence/); assert.match(dataflow, /function staticCallOriginInput\([\s\S]*?classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence/); assert.match(dataflow, /classNameResolutionContext: classNameResolutionContextEvidence/); }],
  ['canonical AST projection explicitly marks unavailable lexical context', () => { assert.match(canonical, /const classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence = Object\.freeze\([\s\S]*?kind: 'unavailable'[\s\S]*?controller_method_lexical_context_missing/); assert.match(canonical, /createControllerDataflowContract\(\{[\s\S]*?classNameResolutionContextEvidence,/); }],
  ['descriptor boundary closes optional context once before entering dataflow contract', () => { assert.match(descriptor, /const classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence = relationOptionFold/); assert.match(descriptor, /kind: 'unavailable', reason: 'controller_method_lexical_context_missing'/); assert.match(descriptor, /kind: 'available', context: lexicalContext/); assert.match(descriptor, /createControllerDataflowContract\(\{[\s\S]*?classNameResolutionContextEvidence,/); }],
  ['origin interface preserves explicit available/unavailable context evidence', () => assert.match(authorityInterface, /ControllerStaticCallClassNameResolutionContextEvidence[\s\S]*?kind: 'available'[\s\S]*?kind: 'unavailable'/)],
  ['same existing upstream class-name authority remains responsible for resolution', () => { assert.match(authority, /classReferenceResolutionRule\.judge\(input\)/); assert.doesNotMatch(dataflow, /phpClassNameResolutionAuthority|classReferenceResolutionRule/); }],
  ['invocation semantic judgment remains the existing contract', () => assert.match(invocation, /export type InvocationSemanticJudgment/)],
  ['integrated response continues to retain invocation response correlation', () => assert.match(response, /integrated_invocation_response_judgment/)],
  ['runtime executor remains delegation-only', () => { assert.match(runtime, /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/); assert.doesNotMatch(runtime, /classReferenceResolutionRule|classNameResolutionContextEvidence/); }],
  ['no relation/foundation subscanner or duplicate authority was introduced', () => { assert.doesNotMatch(dataflow, /semantic\/foundation\/|new .*InvocationAuthority|new .*ResponseAuthority/); assert.doesNotMatch(authorityInterface, /ParallelControllerResourceBindingAuthority/); }],
  ['phase audit is registered', () => assert.equal(packageJson.scripts['audit:phase2067-controller-dataflow-context-contract-interface-first'], 'node scripts/audits/audit-phase2067-controller-dataflow-context-contract-interface-first.cjs')],
];
const results = checks.map(([name, run]) => { try { run(); console.log(`PASS ${name}`); return { name, passed: true }; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return { name, passed: false }; } });
const report = { phase: 2067, title: 'Controller Dataflow Context Contract Interface First', passed: results.filter(result => result.passed).length, total: results.length, checks: results, verificationScope: 'structural source audit only; full typecheck/build/Vitest not asserted' };
fs.writeFileSync(path.join(root, 'PHASE2067_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.passed !== report.total) process.exitCode = 1;
