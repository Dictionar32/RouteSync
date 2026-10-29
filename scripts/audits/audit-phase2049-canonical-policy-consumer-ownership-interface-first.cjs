const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const highLevelPath = path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts');
const policyPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const invocationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const highLevel = fs.readFileSync(highLevelPath, 'utf8');
const policy = fs.readFileSync(policyPath, 'utf8');
const invocation = fs.readFileSync(invocationPath, 'utf8');
const controllerProjectionStart = highLevel.indexOf('...sequenceExpand(catalog.controllers, controller => [', highLevel.indexOf('export function sourceModelReferenceIndexFromCatalog'));
const controllerProjectionEnd = highLevel.indexOf('...sequenceExpand(controller.action.semantic.resources', controllerProjectionStart);
const controllerProjection = highLevel.slice(controllerProjectionStart, controllerProjectionEnd);
const checks = [
  ['canonical effective policy identity is the controller/action ownership key', controllerProjection.includes('relationFirstOption(') && controllerProjection.includes('policy.controller.value.value') && controllerProjection.includes('controller.identity.name.value.value') && controllerProjection.includes('policy.action.value.value') && controllerProjection.includes('controller.identity.action.value.value')],
  ['catalog policy evidence is a fallback only when no effective policy owns the action', controllerProjection.includes('relationOptionFold(') && controllerProjection.indexOf('relationFirstOption(') < controllerProjection.indexOf('controllerActionPolicyRelationsFromEvidence(') && controllerProjection.includes('() => []')],
  ['effective policy relations remain the canonical graph projection', highLevel.includes('...effectivePolicies.flatMap(policy => controllerActionPolicyRelations(policy))')],
  ['ownership suppression applies equally to complete and blocked effective policies', policy.includes('| CompleteEffectiveControllerActionPolicy') && policy.includes('| BlockedEffectiveControllerActionPolicy') && controllerProjection.includes('relationFirstOption(') && controllerProjection.includes('effectivePolicies')],
  ['route projection still consumes the effective judgment without reopening blocked products', highLevel.includes('routeActionPolicyRelationsFromEffectivePolicy(route.identity, policy)')],
  ['invocation judgment continues through the existing controller producer', invocation.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['integrated response remains connected to invocation judgment', invocation.includes('responseSemanticPipeline.judgeIntegratedResponse(Object.freeze({') && invocation.includes("kind: 'laravel_controller_response_integrated_judgment_input'") && invocation.includes('judgment: invocationJudgment')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['audit is registered in package scripts', fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('audit:phase2049-canonical-policy-consumer-ownership-interface-first')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2049: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
