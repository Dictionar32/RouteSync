const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const executor = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts'), 'utf8');
const lowering = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'), 'utf8');
const checks = [
  ['executor checks closed contract identity', /contract\.kind !== 'request_type_derivation_contract'/.test(executor) && /contract\.closed !== true/.test(executor)],
  ['executor checks complete law coverage', /REQUEST_TYPE_DERIVATION_LAW_IDS\.every/.test(executor) && /contract_law_coverage_incomplete/.test(executor)],
  ['executor binds proof to submitted evidence', /assessment\.decision\.premises\.input/.test(executor) && /equivalentEvidence\(input, proofInput\)/.test(executor)],
  ['proof binding failure is a typed non-projectable result', /kind: 'input_binding_failed'/.test(executor) && /case 'input_binding_failed'/.test(lowering)],
  ['contract rejection is a typed non-projectable result', /kind: 'contract_rejected'/.test(executor) && /case 'contract_rejected'/.test(lowering)],
  ['authority-backed lowering does not import legacy projection pipeline', !/requestTypeDerivationProjectionPipeline/.test(lowering)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
