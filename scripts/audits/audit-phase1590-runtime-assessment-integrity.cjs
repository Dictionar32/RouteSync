const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const executor = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts'), 'utf8');
const lowering = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'), 'utf8');
const checks = [
  ['assessment conclusion is correlated with discriminant', /decision\.conclusion !== assessment\.kind/.test(executor)],
  ['derived judgment requires the derived rule and judgment', /closed_derivation_with_complete_verification/.test(executor) && /judgment\.kind !== 'derived'/.test(executor)],
  ['successful derivation requires valid verification', /verification\.kind !== 'valid'/.test(executor)],
  ['successful derivation requires complete law coverage', /coverage\.kind !== 'complete'/.test(executor) && /coverage_contract_mismatch/.test(executor)],
  ['coverage contract is bound to injected contract', /equivalentEvidence\(decision\.premises\.coverage\.contract, contract\)/.test(executor)],
  ['integrity failures are typed and non-projectable', /kind: 'assessment_integrity_failed'/.test(executor) && /case 'assessment_integrity_failed'/.test(lowering)],
  ['executor does not derive request semantics', !/aggregateRequestTypeGroups|createDerivationContext|RequestTypeDeriver/.test(executor)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
