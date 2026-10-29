const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const typePath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const upstreamResolverPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const scannerResolverPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const projectionPath = path.join(root, 'packages/core/src/types/upstream/controllerActionPolicyRelations.ts');
const regressionPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.closed-adt.phase2047.test.ts');
const invocationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const typeSource = fs.readFileSync(typePath, 'utf8');
const upstreamResolver = fs.readFileSync(upstreamResolverPath, 'utf8');
const scannerResolver = fs.readFileSync(scannerResolverPath, 'utf8');
const projection = fs.readFileSync(projectionPath, 'utf8');
const regression = fs.readFileSync(regressionPath, 'utf8');
const checks = [
  ['effective policy is a closed complete-or-blocked ADT', typeSource.includes('export type EffectiveControllerActionPolicy =') && typeSource.includes('| CompleteEffectiveControllerActionPolicy') && typeSource.includes('| BlockedEffectiveControllerActionPolicy')],
  ['complete variant alone owns middleware and authorization products', typeSource.includes('export type CompleteEffectiveControllerActionPolicy') && typeSource.includes('readonly middleware: readonly RouteMiddlewareContract[]') && typeSource.includes('readonly authorization: readonly ControllerAuthorizationRelation[]')],
  ['blocked variant contains judgment reasons without partial policy products', typeSource.includes('export type BlockedEffectiveControllerActionPolicy') && typeSource.includes("readonly kind: 'blocked'") && !typeSource.slice(typeSource.indexOf('export type BlockedEffectiveControllerActionPolicy'), typeSource.indexOf('/** Inputs to the canonical')).includes('readonly middleware:')],
  ['upstream resolver emits a blocked variant without middleware or authorization fields', upstreamResolver.includes("case 'blocked':\n      return Object.freeze({ ...identity, judgment });")],
  ['upstream resolver emits products only in complete branch', upstreamResolver.includes("case 'complete':\n      return Object.freeze({\n        ...identity,\n        judgment,") && upstreamResolver.includes('middleware: effectiveControllerActionPolicyAlgebra.effectiveMiddleware')],
  ['scanner resolver emits a blocked variant without partial products', scannerResolver.includes("case 'blocked':\n      return Object.freeze({ ...identity, judgment: policyJudgment });")],
  ['canonical relation projection discriminates before reading products', projection.includes("case 'blocked':") && projection.includes("case 'complete':") && projection.includes('...middlewareRelation(policy)')],
  ['blocked regression verifies products are absent and only blocked relation is projected', regression.includes("expect('middleware' in policy).toBe(false)") && regression.includes("expect('authorization' in policy).toBe(false)") && regression.includes("'controller_action_policy_blocked'")],
  ['complete regression verifies usable products remain available', regression.includes("expect(policy.judgment.kind).toBe('complete')") && regression.includes('expect(policy.middleware).toHaveLength(1)')],
  ['invocation judgment and existing integrated response path remain present', invocationPath && fs.readFileSync(invocationPath, 'utf8').includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['audit is registered in package scripts', fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('audit:phase2047-effective-policy-closed-adt-products-interface-first')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2047: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
