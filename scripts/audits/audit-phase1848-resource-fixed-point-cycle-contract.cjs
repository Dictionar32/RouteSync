const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const semantic = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const resourceContract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['semantic judgment contract advances to version 9', /readonly version: 9/.test(semantic) && /version: 9/.test(semantic)],
  ['closure resolution is a typed stable-or-cycle union', /kind: 'stable_fixed_point'/.test(semantic) && /kind: 'cycle_conservative'/.test(semantic)],
  ['cycle receipt names only the affected resources', /affectedResources: readonly \[ResourceReference, \.\.\.ResourceReference\[\]\]/.test(semantic)],
  ['fixed-point equality compares discriminated outcomes structurally without JSON serialization', /const sameOutcome/.test(authority) && /const sameBatch/.test(authority) && !/JSON\.stringify/.test(authority)],
  ['stable convergence returns an explicit stable receipt', /closureReceipt\(\{ kind: 'stable_fixed_point' \}\)/.test(authority)],
  ['cycle detection identifies varying subjects across the repeated cycle states', /cycleStates = \[\.\.\.history\.slice\(repeatedIndex\), next\]/.test(authority) && /cycleStates\.every\(state => sameOutcome/.test(authority)],
  ['only affected resources become conservative unresolved judgments', /affectedIndexes\.includes\(index\)/.test(authority) && /unresolvedCycleJudgment\(input, subject\)/.test(authority)],
  ['cycle receipt preserves affected resource identities', /kind: 'cycle_conservative', affectedResources: affectedResourceTuple/.test(authority)],
  ['batch result keeps subject order and closure receipt', /judgments: Object\.freeze\(judgments\)/.test(authority) && /bindingClosure,/.test(scanner)],
  ['resource scanner contract advances to version 10', /contractVersion: 10/.test(resourceContract) && /contractVersion: 10/.test(scanner)],
  ['production pipeline continues to reuse integrated controller judgment', /controllerScan,/.test(pipeline) && /laravelResourceScanner\.scan/.test(pipeline) && !/semantic\/foundation/.test(pipeline)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1848-resource-fixed-point-cycle-contract'] === 'node scripts/audits/audit-phase1848-resource-fixed-point-cycle-contract.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
