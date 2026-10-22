const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const solver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const pipeline = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts');

const checks = [
  ['group identity comes from the resolved upstream resource receipt', /receipt\.resolution\.resource\.canonicalIdentity\.semanticKey/.test(solver) && /resolvedResourceGroupKey\(ctx, route\)/.test(solver)],
  ['raw lowercase request binding is not used as group identity', !/const groupKey\s*=\s*requestBinding\.identity\.resource\.value\.value\.toLowerCase\(\)/.test(solver)],
  ['canonical resource identity is owned by the upstream evidence inventory', /canonicalResourceIdentity/.test(inventory) && /semanticKey:\s*`resource:\$\{canonicalName\.value\.value\}`/.test(inventory)],
  ['contract defines canonical resource identity as group identity', /groupIdentity:\s*Object\.freeze\(\{\s*kind:\s*'canonical_resource_identity'/.test(contract)],
  ['existing projection entry point remains an interface-valued alias; no false producer cutover', /requestTypeDerivationProjectionPipeline: RequestTypeDerivationProjectionInterface = requestTypeDerivationSolver/.test(pipeline)],
  ['solver uses canonical occurrence identity to bind receipts and upstream canonical identity for grouping', /canonicalRouteOccurrenceKey\(route\.provenance\)/.test(solver) && /receipt\.resolution\.resource\.canonicalIdentity\.semanticKey/.test(solver)],
];

for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
