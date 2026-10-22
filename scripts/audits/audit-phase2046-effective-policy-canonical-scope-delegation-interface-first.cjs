const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicyAlgebra.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts');
const controllerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');
const checks = [
  ['legacy resolver delegates authorization filtering to the canonical upstream algebra', resolver.includes('effectiveControllerActionPolicyAlgebra.authorization(\n    allPolicy,\n    input.action,\n  )')],
  ['legacy resolver no longer defines a second actionApplies predicate', !resolver.includes('const actionApplies =') && !resolver.includes('const authorizationApplies =')],
  ['upstream algebra owns all authorization scope variants', ['blocked', 'all', 'only', 'except', 'only_except'].every(kind => algebra.includes(`case '${kind}':`))],
  ['blocked policy reasons still contribute to the closed effective-policy judgment', resolver.includes('blockedPolicyReasons') && resolver.includes("kind: 'blocked' as const, reasons: policyReasons")],
  ['authorization results are produced by the same canonical algebra', resolver.includes('const authorization = effectiveControllerActionPolicyAlgebra.authorization')],
  ['only_except regression coverage exists', test.includes('filters only_except authorization through the existing upstream algebra')],
  ['blocked authorization regression coverage preserves blocked judgment', test.includes('keeps blocked authorization evidence in the overall judgment') && test.includes("expect(policy.judgment.kind).toBe('blocked')")],
  ['existing invocation semantic judgment wiring remains present', controller.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['audit is registered in package scripts', fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('audit:phase2046-effective-policy-canonical-scope-delegation-interface-first')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2046: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
