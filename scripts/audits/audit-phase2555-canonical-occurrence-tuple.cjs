const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const inventoryPath = 'packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts';
const inventory = read(inventoryPath);
const solver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const checks = [
  ['source occurrence identity serializes the file component with URI encoding', /encodeURIComponent\(file\)/.test(inventory)],
  ['source occurrence tuple retains start and end coordinates', /\$\{encodeURIComponent\(file\)\}:\$\{start\}:\$\{end\}/.test(inventory)],
  ['route, resource, and request occurrence keys share the canonical tuple operation', (inventory.match(/sourceSpanIdentity\(/g) || []).length >= 3],
  ['solver still validates canonical evidence against the source inventory', /assertSourceEvidenceInventoryBinding\(routes, resources, requests, sourceEvidence\)/.test(solver)],
  ['active lowering still exposes the unresolved legacy array producer boundary', /requestTypeDerivationProjectionPipeline\.derive\(/.test(lowering) && /derive:\s*\(input: RequestTypeDerivationProjectionInput\): readonly RequestType\[\]/.test(solver)],
  ['closed judgment ADT remains declared upstream rather than fabricated by the legacy solver', /kind: 'derived'[\s\S]*kind: 'incomplete'[\s\S]*kind: 'conflict'[\s\S]*kind: 'invalid_input'/.test(contract) && !/kind:\s*'derived'[\s\S]{0,300}requestTypeDerivationSolver/.test(solver)],
];
let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failures += 1;
}
const transpilation = ts.transpileModule(inventory, {
  fileName: inventoryPath,
  compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
const syntaxErrors = (transpilation.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
console.log(`${syntaxErrors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation: ${inventoryPath}`);
failures += syntaxErrors.length;
console.log(`Phase 2555 audit: ${checks.length + 1 - failures}/${checks.length + 1} passed`);
process.exitCode = failures === 0 ? 0 : 1;
