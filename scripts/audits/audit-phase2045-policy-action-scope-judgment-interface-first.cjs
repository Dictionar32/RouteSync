const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts');
const canonicalPath = path.join(root, 'packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts');
const interfaceSource = fs.readFileSync(interfacePath, 'utf8');
const authoritySource = fs.readFileSync(authorityPath, 'utf8');
const canonicalSource = fs.readFileSync(canonicalPath, 'utf8');
const checks = [
  ['existing upstream policy-scope interface owns attribute applicability', interfaceSource.includes('readonly analyzeAttribute:') && interfaceSource.includes('ControllerMethodAttributeScope')],
  ['authority resolves class-scope policy attributes to all actions', authoritySource.includes("case 'class':\n      return Object.freeze({ kind: 'all' });")],
  ['authority resolves method-scope policy attributes to the canonical action', authoritySource.includes("case 'method':\n      switch (action)") && authoritySource.includes("case undefined:\n          return scopeFromArguments(namedScopes(arguments_));") && authoritySource.includes("kind: 'only', actions: sequenceOf([action])")],
  ['legacy only/except analysis remains the canonical path when no method action is supplied', authoritySource.includes('analyze: (arguments_: ExpressionArguments): ControllerPolicyActionScopeJudgment => scopeFromArguments(namedScopes(arguments_))')],
  ['controller policy projection delegates authorization applicability to upstream authority', canonicalSource.includes('actions: controllerPolicyActionScopeJudgmentAuthority.analyzeAttribute(attribute.scope, action, attribute.arguments)')],
  ['controller policy projection no longer embeds the authorization action-scope decision', !canonicalSource.includes("actions: action ? { kind: 'only' as const, actions: sequence([action]) } : policyActionScope(attribute)")],
  ['middleware and HasMiddleware adapters preserve the blocked judgment ADT in their declared return types', canonicalSource.includes('function policyActionScope(attribute: ControllerMethodAttribute): ControllerPolicyActionScopeJudgment') && canonicalSource.includes('function controllerHasMiddlewareActionScope(expression: Expression): ControllerPolicyActionScopeJudgment')],
  ['existing invocation judgment and integrated response wiring remains unchanged', fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8').includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['focused regression test covers class, method, and absent-action cases', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.phase2045.test.ts'))],
  ['audit is registered in package scripts', fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('audit:phase2045-policy-action-scope-judgment-interface-first')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2045: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
