const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2340-EXISTING-POLICY-AUTHORITY-CONTRACT-CLOSURE.md');
const contract = fs.readFileSync(contractPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const docs = fs.readFileSync(docsPath, 'utf8');
const checks = [
  ['existing authority interface retained', contract.includes('interface EffectiveControllerActionPolicySemanticAuthorityInterface')],
  ['authority contract version evolved', /interface EffectiveControllerActionPolicySemanticAuthorityInterface[\s\S]*?contractVersion: 2/.test(contract)],
  ['authority exposes judge', /interface EffectiveControllerActionPolicySemanticAuthorityInterface[\s\S]*?judge:/.test(contract)],
  ['authority no longer exposes algebra', !/interface EffectiveControllerActionPolicySemanticAuthorityInterface[\s\S]*?algebra:/.test(contract)],
  ['existing executor interface retained', contract.includes('interface EffectiveControllerActionPolicyRuntimeExecutorInterface')],
  ['executor contract version evolved', /interface EffectiveControllerActionPolicyRuntimeExecutorInterface[\s\S]*?contractVersion: 2/.test(contract)],
  ['executor preserves closed ADT', /execute: \(input: EffectiveControllerActionPolicyUpstreamInput\) => EffectiveControllerActionPolicy/.test(contract)],
  ['scanner interface still existing canonical contract', scanner.includes('interface LaravelRouteScannerInterface')],
  ['scanner wiring still calls local resolver (reported, not hidden)', wiring.includes('resolveEffectiveControllerActionPolicy({')],
  ['trace documents unresolved wiring gap', docs.includes('does not yet expose the effective controller-action policy authority/executor')],
  ['trace explicitly records parallel closure', docs.includes('These paths still perform overlapping policy closure.')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed);
console.log(`Phase 2340 existing policy authority contract closure: ${checks.length - failures.length}/${checks.length}`);
process.exitCode = failures.length ? 1 : 0;
