const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = process.cwd();
const checks = [];
const check = (name, condition) => {
  checks.push({ name, pass: Boolean(condition) });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}`);
};
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const implementation = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts';
const contract = 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts';
const upstreamBarrel = 'packages/core/src/types/upstream/index.ts';
const coreBarrel = 'packages/core/src/index.ts';

check('canonical inventory interface remains upstream-owned', read(contract).includes('interface RequestTypeDerivationSourceEvidenceInventoryInterface'));
check('inventory implementation is owned by semantic implementation layer', exists(implementation));
check('runtime inventory implementation is retired from types/upstream', !exists('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts'));
check('upstream barrel no longer exports a runtime inventory implementation', !read(upstreamBarrel).includes("requestTypeDerivationSourceEvidenceInventory"));
check('public core API preserves inventory operation export from its implementation owner', read(coreBarrel).includes("from './compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory'"));

const consumers = [
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolution.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionInventory.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolutionInventory.ts',
];
for (const relative of consumers) {
  const source = read(relative);
  check(`${path.basename(relative)} consumes same-layer inventory implementation`, source.includes("from './requestTypeDerivationSourceEvidenceInventory'"));
  check(`${path.basename(relative)} has no stale upstream implementation import`, !source.includes('types/upstream/requestTypeDerivationSourceEvidenceInventory'));
}
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
check('manifest preflight wires to semantic inventory implementation', preflight.includes("from '../../semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory'"));
check('manifest preflight has no stale upstream implementation import', !preflight.includes('types/upstream/requestTypeDerivationSourceEvidenceInventory'));

const syntaxFiles = [implementation, contract, ...consumers, 'packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts', coreBarrel, upstreamBarrel];
for (const relative of syntaxFiles) {
  const source = read(relative);
  const result = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const errors = (result.diagnostics || []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  check(`syntax transpilation ${relative}`, errors.length === 0);
}

const failed = checks.filter(result => !result.pass);
console.log(`\nRESULT ${checks.length - failed.length}/${checks.length} structural/syntax assertions passed`);
if (failed.length) process.exitCode = 1;
