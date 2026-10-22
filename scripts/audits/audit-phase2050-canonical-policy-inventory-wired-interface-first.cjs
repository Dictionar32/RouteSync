const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const highLevelPath = path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts');
const resolverPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const invocationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const highLevel = fs.readFileSync(highLevelPath, 'utf8');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const invocation = fs.readFileSync(invocationPath, 'utf8');
const builderStart = highLevel.indexOf('const effectiveControllerActionPoliciesFromCatalog');
const builderEnd = highLevel.indexOf('export function sourceModelReferenceIndexFromCatalog', builderStart);
const inventory = highLevel.slice(builderStart, builderEnd);
const buildCall = highLevel.slice(highLevel.indexOf('const contracts = semanticContractCatalogFromSourceCatalog(catalog);'));
const checks = [
  ['canonical policy inventory is modeled as typed upstream input to the existing resolver', inventory.includes('resolveEffectiveControllerActionPolicyUpstream({') && inventory.includes('policy: sequenceToArray(controller.action.policy)') && inventory.includes('inheritedFrom: controller.action.inheritedFrom')],
  ['controller-action policy identity and source provenance are retained', inventory.includes('controller: controller.identity.name') && inventory.includes('action: controller.identity.action') && inventory.includes('source: Object.freeze([controller.action.source])')],
  ['route middleware remains a later route-specific composition, not folded into the catalog policy', inventory.includes('declarations: Object.freeze([])') && inventory.includes('action: { kind: \'present\', value: controller.identity.action }') && highLevel.includes('declarations: Object.freeze([...routeDeclarations, ...suppliedPolicy.middleware])')],
  ['production source-model builder passes its canonical policy inventory to the reference index', buildCall.includes('const effectivePolicies = effectiveControllerActionPoliciesFromCatalog(catalog)') && buildCall.includes('sourceModelReferenceIndexFromCatalog(catalog, effectivePolicies).graph')],
  ['controller evidence is fallback-only once canonical policy identity is present', highLevel.includes('relationOptionFold(') && highLevel.includes('controllerActionPolicyRelationsFromEvidence(') && highLevel.includes('relationFirstOption(')],
  ['closed complete/blocked policy ADT remains authoritative', highLevel.includes('switch (suppliedPolicy.judgment.kind)') && highLevel.includes("case 'blocked':") && highLevel.includes("case 'complete':")],
  ['invocation judgment continues through the existing controller producer', invocation.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['integrated response remains connected to invocation judgment', invocation.includes('responseSemanticPipeline.judgeIntegratedResponse(Object.freeze({') && invocation.includes("kind: 'laravel_controller_response_integrated_judgment_input'") && invocation.includes('judgment: invocationJudgment')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['audit is registered in package scripts', fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('audit:phase2050-canonical-policy-inventory-wired-interface-first')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2050: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
