const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const highLevelPath = path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts');
const policyPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const invocationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const highLevel = fs.readFileSync(highLevelPath, 'utf8');
const policy = fs.readFileSync(policyPath, 'utf8');
const invocation = fs.readFileSync(invocationPath, 'utf8');
const suppliedStart = highLevel.indexOf("if (binding.kind === 'supplied_policy') {");
const suppliedEnd = highLevel.indexOf("if (binding.kind === 'unbound')", suppliedStart);
const suppliedBranch = highLevel.slice(suppliedStart, suppliedEnd);
const checks = [
  ['supplied effective policy is discriminated by closed judgment before products are read', suppliedBranch.includes('switch (suppliedPolicy.judgment.kind)') && suppliedBranch.indexOf("case 'blocked':") < suppliedBranch.indexOf('suppliedPolicy.middleware') && suppliedBranch.indexOf("case 'complete':") < suppliedBranch.indexOf('suppliedPolicy.middleware')],
  ['blocked supplied policy projects blocked judgment without accessing partial products', suppliedBranch.includes("case 'blocked':") && suppliedBranch.includes('suppliedPolicy.judgment.reasons') && suppliedBranch.includes('routeBlockedReasons') && suppliedBranch.includes('routeActionPolicyRelationsFromEffectivePolicy(route.identity')],
  ['complete supplied policy cannot attach authorization to a blocked route-policy variant', suppliedBranch.includes("switch (routePolicy.judgment.kind)") && suppliedBranch.includes("case 'blocked':\n            return routeActionPolicyRelationsFromEffectivePolicy(route.identity, routePolicy);") && suppliedBranch.includes("case 'complete':\n            return routeActionPolicyRelationsFromEffectivePolicy(route.identity, Object.freeze({\n              ...routePolicy,\n              authorization: suppliedPolicy.authorization,")],
  ['route source provenance is retained when policy is composed', suppliedBranch.includes('const source = Object.freeze([...suppliedPolicy.source, route.definition.provenance.span])')],
  ['closed effective policy remains a complete-or-blocked ADT', policy.includes('| CompleteEffectiveControllerActionPolicy') && policy.includes('| BlockedEffectiveControllerActionPolicy')],
  ['canonical invocation judgment continues into controller producer', invocation.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['integrated response judgment remains connected to invocation judgment', invocation.includes('responseSemanticPipeline.judgeIntegratedResponse(Object.freeze({') && invocation.includes("kind: 'laravel_controller_response_integrated_judgment_input'") && invocation.includes('judgment: invocationJudgment')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['audit is registered in package scripts', fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('audit:phase2048-supplied-policy-consumer-closure-interface-first')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2048: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
